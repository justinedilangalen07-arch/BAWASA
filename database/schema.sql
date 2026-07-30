PRAGMA foreign_keys = ON;

-- Clean up existing tables
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS meters;
DROP TABLE IF EXISTS consumers;
DROP TABLE IF EXISTS admins;

-- 1. ADMINS TABLE
CREATE TABLE admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) DEFAULT 'Secretary',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (username, password_hash, full_name, role)
VALUES ('admin', 'admin123', 'Barangay Secretary', 'Super Admin');

-- 2. CONSUMERS TABLE
CREATE TABLE consumers (
    consumer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    purok_zone VARCHAR(50) NOT NULL,
    contact_no VARCHAR(15),
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO consumers (account_no, first_name, last_name, purok_zone, contact_no) VALUES
('BWSA-00101', 'Juan', 'Dela Cruz', 'Purok 1 - Mabini', '09171234567'),
('BWSA-00102', 'Maria', 'Santos', 'Purok 3 - Rizal', '09182345678'),
('BWSA-00103', 'Antonio', 'Luna', 'Purok 2 - Bonifacio', '09193456789'),
('BWSA-00104', 'Elena', 'Torralba', 'Purok 1 - Mabini', '09204567890');

-- 3. METERS TABLE
CREATE TABLE meters (
    meter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id INTEGER NOT NULL,
    meter_number VARCHAR(30) UNIQUE NOT NULL,
    installation_date DATE,
    meter_status VARCHAR(20) DEFAULT 'Operational',
    FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id) ON DELETE CASCADE
);

INSERT INTO meters (consumer_id, meter_number, installation_date) VALUES
(1, 'WM-2023-001', '2023-01-15'),
(2, 'WM-2023-002', '2023-02-10'),
(3, 'WM-2023-003', '2023-02-12'),
(4, 'WM-2023-004', '2023-03-01');

-- 4. READINGS TABLE
CREATE TABLE readings (
    reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id INTEGER NOT NULL,
    reading_date DATE NOT NULL,
    previous_reading NUMERIC(10, 2) NOT NULL,
    current_reading NUMERIC(10, 2) NOT NULL,
    consumption_m3 NUMERIC(10, 2) NOT NULL,
    rate_per_m3 NUMERIC(10, 2) DEFAULT 20.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    billing_status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id) ON DELETE CASCADE
);

INSERT INTO readings (consumer_id, reading_date, previous_reading, current_reading, consumption_m3, rate_per_m3, total_amount, due_date, billing_status) VALUES
(1, '2026-07-01', 100.00, 118.00, 18.00, 20.00, 360.00, '2026-07-25', 'Paid'),
(2, '2026-07-01', 210.00, 234.00, 24.00, 20.00, 480.00, '2026-07-25', 'Pending'),
(3, '2026-07-01', 150.00, 181.00, 31.00, 20.00, 620.00, '2026-07-15', 'Overdue'),
(4, '2026-07-01', 80.00,  95.00,  15.00, 20.00, 300.00, '2026-07-25', 'Paid');

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id INTEGER NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount_paid NUMERIC(10, 2) NOT NULL,
    or_number VARCHAR(30) UNIQUE NOT NULL,
    processed_by INTEGER,
    FOREIGN KEY (reading_id) REFERENCES readings(reading_id),
    FOREIGN KEY (processed_by) REFERENCES admins(admin_id)
);

INSERT INTO payments (reading_id, amount_paid, or_number, processed_by) VALUES
(1, 360.00, 'OR-2026-0001', 1),
(4, 300.00, 'OR-2026-0002', 1);