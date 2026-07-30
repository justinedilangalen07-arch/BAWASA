const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Session Setup (keeps admin logged in across page refreshes)
app.use(session({
  secret: 'bwsa_secure_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // Session lasts 1 Hour
}));

// Serve static frontend files (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname)));

// 3. Connect to SQLite Database
const db = new sqlite3.Database('./barangay_water.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite Database: barangay_water.db');
  }
});

// ============================================================================
// API ROUTE 1: ADMIN LOGIN
// ============================================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM admins WHERE username = ? AND password_hash = ?`;
  db.get(sql, [username, password], (err, admin) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database query error.' });
    }

    if (admin) {
      req.session.admin = { id: admin.admin_id, username: admin.username, name: admin.full_name };
      return res.json({ success: true, message: 'Login successful', admin: req.session.admin });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
  });
});

// ============================================================================
// API ROUTE 2: ADMIN LOGOUT
// ============================================================================
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// ============================================================================
// API ROUTE 3: CHECK SESSION STATUS
// ============================================================================
app.get('/api/session', (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

// ============================================================================
// API ROUTE 4: DASHBOARD METRICS (SUMMARY CARDS)
// ============================================================================
app.get('/api/dashboard/metrics', (req, res) => {
  const queries = {
    consumers: `SELECT COUNT(*) AS count FROM consumers`,
    meters: `SELECT COUNT(*) AS count FROM meters WHERE meter_status = 'Operational'`,
    collections: `SELECT SUM(amount_paid) AS total FROM payments`,
    overdue: `SELECT COUNT(*) AS count FROM readings WHERE billing_status = 'Overdue'`
  };

  db.get(queries.consumers, [], (err, q1) => {
    db.get(queries.meters, [], (err, q2) => {
      db.get(queries.collections, [], (err, q3) => {
        db.get(queries.overdue, [], (err, q4) => {
          res.json({
            consumers: q1 ? q1.count : 0,
            activeMeters: q2 ? q2.count : 0,
            collections: q3 && q3.total ? q3.total : 0,
            overdueCount: q4 ? q4.count : 0
          });
        });
      });
    });
  });
});

// ============================================================================
// API ROUTE 5: RECENT TRANSACTIONS TABLE DATA
// ============================================================================
app.get('/api/dashboard/transactions', (req, res) => {
  const sql = `
    SELECT 
      c.account_no,
      (c.first_name || ' ' || c.last_name) AS consumer_name,
      c.purok_zone,
      r.consumption_m3,
      r.total_amount,
      r.billing_status
    FROM readings r
    JOIN consumers c ON r.consumer_id = c.consumer_id
    ORDER BY r.reading_date DESC
    LIMIT 10
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve records.' });
    }
    res.json(rows);
  });
});

// Start Server Listener
app.listen(PORT, () => {
  console.log(`Backend server active on http://localhost:${PORT}`);
});

// ============================================================================
// API ROUTE 6: PROCESS PAYMENT & UPDATE BILL STATUS
// ============================================================================
app.post('/api/payments/process', (req, res) => {
  const { reading_id, amount_paid, processed_by } = req.body;

  if (!reading_id || !amount_paid) {
    return res.status(400).json({ success: false, message: 'Missing payment details.' });
  }

  // Generate a unique Official Receipt (OR) Number (e.g., OR-1722384000000)
  const or_number = `OR-${Date.now()}`;
  const admin_id = processed_by || 1;

  // Insert payment record
  const sqlInsertPayment = `
    INSERT INTO payments (reading_id, amount_paid, or_number, processed_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sqlInsertPayment, [reading_id, amount_paid, or_number, admin_id], function(err) {
    if (err) {
      console.error('Payment Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to record payment.' });
    }

    // Update the reading status to 'Paid'
    const sqlUpdateReading = `UPDATE readings SET billing_status = 'Paid' WHERE reading_id = ?`;
    
    db.run(sqlUpdateReading, [reading_id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Payment saved, but failed to update status.' });
      }

      res.json({
        success: true,
        message: 'Payment recorded successfully!',
        or_number: or_number,
        payment_id: this.lastID
      });
    });
  });
});

// ============================================================================
// API ROUTE 7: GET RECEIPT DETAILS BY READING ID
// ============================================================================
app.get('/api/receipt/:reading_id', (req, res) => {
  const { reading_id } = req.params;

  const sql = `
    SELECT 
      p.or_number,
      p.payment_date,
      p.amount_paid,
      (c.first_name || ' ' || c.last_name) AS consumer_name,
      c.account_no,
      c.purok_zone,
      r.reading_date,
      r.consumption_m3,
      r.rate_per_m3
    FROM payments p
    JOIN readings r ON p.reading_id = r.reading_id
    JOIN consumers c ON r.consumer_id = c.consumer_id
    WHERE r.reading_id = ?
    ORDER BY p.payment_id DESC
    LIMIT 1
  `;

  db.get(sql, [reading_id], (err, receipt) => {
    if (err || !receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }
    res.json({ success: true, receipt });
  });
});
// ============================================================================
// API ROUTE: GET UNPAID AND OVERDUE BILLS ONLY
// ============================================================================
app.get('/api/payments/unpaid', (req, res) => {
  const sql = `
    SELECT 
      r.reading_id,
      c.account_no,
      (c.first_name || ' ' || c.last_name) AS consumer_name,
      c.purok_zone,
      r.consumption_m3,
      r.total_amount,
      r.billing_status
    FROM readings r
    JOIN consumers c ON r.consumer_id = c.consumer_id
    WHERE r.billing_status != 'Paid'
    ORDER BY r.due_date ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve unpaid bills.' });
    }
    res.json(rows);
  });
});