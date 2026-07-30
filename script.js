document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  // ==========================================================================
  // 1. HANDLE ADMIN LOGIN VIA API
  // ==========================================================================
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");

      if (!usernameInput || !passwordInput) return;

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (errorMessage) errorMessage.classList.add("hidden");

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to dashboard on success
          window.location.href = "dashboard.html";
        } else {
          if (errorMessage) {
            errorMessage.textContent = data.message;
            errorMessage.classList.remove("hidden");
          }
        }
      } catch (err) {
        if (errorMessage) {
          errorMessage.textContent = "Server connection error. Ensure 'node server.js' is running.";
          errorMessage.classList.remove("hidden");
        }
      }
    });
  }

  // ==========================================================================
  // 2. HANDLE LOGOUT VIA API
  // ==========================================================================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = "index.html";
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }

  // ==========================================================================
  // 3. PAGE INITIALIZATION ROUTER
  // ==========================================================================
  if (window.location.pathname.includes("dashboard.html")) {
    loadDashboardData();
  }

  if (window.location.pathname.includes("payments.html")) {
    loadUnpaidBills();
  }

  if (window.location.pathname.includes("readings.html")) {
    initReadingsPage();
  }
});

// ============================================================================
// DASHBOARD LOGIC
// ============================================================================
async function loadDashboardData() {
  try {
    // A. Check Active Admin Session
    const sessionRes = await fetch('/api/session');
    const sessionData = await sessionRes.json();
    
    if (!sessionData.loggedIn) {
      window.location.href = "index.html";
      return;
    }

    // B. Fetch Summary Metrics
    const metricsRes = await fetch('/api/dashboard/metrics');
    const metrics = await metricsRes.json();

    const metricValues = document.querySelectorAll('.metric-value');
    if (metricValues.length >= 4) {
      metricValues[0].textContent = metrics.consumers;
      metricValues[1].textContent = metrics.activeMeters;
      metricValues[2].textContent = `₱${metrics.collections.toLocaleString()}`;
      metricValues[3].textContent = metrics.overdueCount;
    }

    // C. Fetch Recent Transactions Table
    const tableRes = await fetch('/api/dashboard/transactions');
    const transactions = await tableRes.json();
    const tableBody = document.querySelector('.data-table tbody');

    if (tableBody) {
      tableBody.innerHTML = transactions.map(t => `
        <tr>
          <td>${t.account_no}</td>
          <td>${t.consumer_name}</td>
          <td>${t.purok_zone}</td>
          <td>${t.consumption_m3} m³</td>
          <td>₱${Number(t.total_amount).toFixed(2)}</td>
          <td>
            <span class="badge badge-${
              t.billing_status === 'Paid' 
                ? 'success' 
                : (t.billing_status === 'Pending' ? 'warning' : 'danger')
            }">${t.billing_status}</span>
          </td>
          <td>
            ${t.billing_status !== 'Paid' 
              ? `<button class="btn-action" onclick="openPaymentModal(${t.reading_id}, '${t.account_no}', '${t.consumer_name}', ${t.total_amount})">Pay</button>` 
              : `<button class="btn-action" onclick="viewReceipt(${t.reading_id})">Receipt</button>`}
          </td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// ============================================================================
// PAYMENT & RECEIPT MODAL LOGIC
// ============================================================================
let currentReadingId = null;
let currentPayAmount = 0;

function openPaymentModal(readingId, accountNo, name, amount) {
  currentReadingId = readingId;
  currentPayAmount = amount;

  document.getElementById("payAccountNo").textContent = accountNo;
  document.getElementById("payConsumerName").textContent = name;
  document.getElementById("payAmountDue").textContent = Number(amount).toFixed(2);

  document.getElementById("paymentFormView").classList.remove("hidden");
  document.getElementById("receiptView").classList.add("hidden");
  document.getElementById("paymentModal").classList.remove("hidden");
}

document.getElementById("closeModalBtn")?.addEventListener("click", () => {
  document.getElementById("paymentModal").classList.add("hidden");
});

document.getElementById("confirmPayBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reading_id: currentReadingId, amount_paid: currentPayAmount })
    });

    const data = await res.json();
    if (data.success) {
      await viewReceipt(currentReadingId);
      if (window.location.pathname.includes("dashboard.html")) loadDashboardData();
      if (window.location.pathname.includes("payments.html")) loadUnpaidBills();
    } else {
      alert("Payment failed: " + data.message);
    }
  } catch (err) {
    alert("Server error processing payment.");
  }
});

async function viewReceipt(readingId) {
  try {
    const res = await fetch(`/api/receipt/${readingId}`);
    const data = await res.json();

    if (data.success) {
      const r = data.receipt;
      document.getElementById("recOR").textContent = r.or_number;
      document.getElementById("recDate").textContent = new Date(r.payment_date).toLocaleString();
      document.getElementById("recAccount").textContent = r.account_no;
      document.getElementById("recName").textContent = r.consumer_name;
      document.getElementById("recPurok").textContent = r.purok_zone;
      document.getElementById("recConsumption").textContent = r.consumption_m3;
      document.getElementById("recAmount").textContent = Number(r.amount_paid).toFixed(2);

      document.getElementById("paymentFormView").classList.add("hidden");
      document.getElementById("receiptView").classList.remove("hidden");
      document.getElementById("paymentModal").classList.remove("hidden");
    }
  } catch (err) {
    console.error("Error loading receipt:", err);
  }
}

// ============================================================================
// PAYMENTS PAGE LOGIC (payments.html)
// ============================================================================
async function loadUnpaidBills() {
  try {
    const res = await fetch('/api/payments/unpaid');
    const bills = await res.json();
    const tbody = document.getElementById('unpaidBillsBody');

    if (!tbody) return;

    if (!Array.isArray(bills) || bills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No pending or overdue bills found.</td></tr>`;
      return;
    }

    tbody.innerHTML = bills.map(b => `
      <tr>
        <td>${b.account_no}</td>
        <td>${b.consumer_name}</td>
        <td>${b.purok_zone}</td>
        <td>${b.consumption_m3} m³</td>
        <td>₱${Number(b.total_amount).toFixed(2)}</td>
        <td>
          <span class="badge badge-${b.billing_status === 'Pending' ? 'warning' : 'danger'}">
            ${b.billing_status}
          </span>
        </td>
        <td>
          <button class="btn-action" onclick="openPaymentModal(${b.reading_id}, '${b.account_no}', '${b.consumer_name}', ${b.total_amount})">
            Pay Now
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Error loading unpaid bills:", err);
  }
}

// ============================================================================
// METER READINGS PAGE LOGIC (readings.html)
// ============================================================================
async function initReadingsPage() {
  const consumerSelect = document.getElementById("consumerSelect");
  const prevReadingInput = document.getElementById("prevReading");
  const currReadingInput = document.getElementById("currReading");
  const readingDateInput = document.getElementById("readingDate");
  const calcConsumption = document.getElementById("calcConsumption");
  const calcTotal = document.getElementById("calcTotal");
  const readingForm = document.getElementById("readingForm");

  if (readingDateInput) readingDateInput.value = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch('/api/consumers/list');
    const consumers = await res.json();
    if (consumerSelect) {
      consumerSelect.innerHTML = `<option value="">-- Choose Consumer --</option>` + 
        consumers.map(c => `<option value="${c.consumer_id}">${c.account_no} - ${c.full_name}</option>`).join('');
    }
  } catch (err) {
    console.error("Failed to load consumers list", err);
  }

  consumerSelect?.addEventListener("change", async () => {
    const consumerId = consumerSelect.value;
    if (!consumerId) {
      prevReadingInput.value = "";
      return;
    }

    const res = await fetch(`/api/readings/latest/${consumerId}`);
    const data = await res.json();
    prevReadingInput.value = data.previous_reading.toFixed(2);
    updateCalculations();
  });

  currReadingInput?.addEventListener("input", updateCalculations);

  function updateCalculations() {
    const prev = parseFloat(prevReadingInput.value) || 0;
    const curr = parseFloat(currReadingInput.value) || 0;

    let consumption = curr - prev;
    if (consumption < 0) consumption = 0;

    const total = consumption * 20.00;

    if (calcConsumption) calcConsumption.textContent = consumption.toFixed(2);
    if (calcTotal) calcTotal.textContent = total.toFixed(2);
  }

  readingForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const consumer_id = consumerSelect.value;
    const reading_date = readingDateInput.value;
    const previous_reading = parseFloat(prevReadingInput.value) || 0;
    const current_reading = parseFloat(currReadingInput.value) || 0;
    const consumption_m3 = current_reading - previous_reading;

    if (consumption_m3 < 0) {
      alert("Current reading cannot be less than previous reading.");
      return;
    }

    const total_amount = consumption_m3 * 20.00;

    try {
      const res = await fetch('/api/readings/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id,
          reading_date,
          previous_reading,
          current_reading,
          consumption_m3,
          total_amount
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Meter reading submitted successfully!");
        readingForm.reset();
        if (calcConsumption) calcConsumption.textContent = "0.00";
        if (calcTotal) calcTotal.textContent = "0.00";
        loadRecentReadings();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error saving meter reading.");
    }
  });

  loadRecentReadings();
}

async function loadRecentReadings() {
  const tbody = document.getElementById("readingsTableBody");
  if (!tbody) return;

  try {
    const res = await fetch('/api/dashboard/transactions');
    const transactions = await res.json();

    tbody.innerHTML = transactions.map(t => `
      <tr>
        <td>${t.account_no}</td>
        <td>${t.consumer_name}</td>
        <td>${t.purok_zone}</td>
        <td>${t.consumption_m3} m³</td>
        <td>₱${Number(t.total_amount).toFixed(2)}</td>
        <td><span class="badge badge-info">${t.billing_status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Error loading readings table:", err);
  }
}