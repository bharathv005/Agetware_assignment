// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to our SQLite database file
const DB_PATH = path.resolve(__dirname, 'bank.db');

let db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS Customers (
            customer_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating Customers table:", err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS Loans (
            loan_id TEXT PRIMARY KEY,
            customer_id TEXT,
            principal_amount REAL NOT NULL,
            total_amount REAL NOT NULL,
            interest_rate REAL NOT NULL,
            loan_period_years INTEGER NOT NULL,
            monthly_emi REAL NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
        )`, (err) => {
            if (err) console.error("Error creating Loans table:", err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS Payments (
            payment_id TEXT PRIMARY KEY,
            loan_id TEXT,
            amount REAL NOT NULL,
            payment_type TEXT NOT NULL,
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
        )`, (err) => {
            if (err) console.error("Error creating Payments table:", err.message);
        });

        // Add a dummy customer for testing
        db.run(`INSERT OR IGNORE INTO Customers (customer_id, name) VALUES ('cust_123', 'Alice Smith')`, (err) => {
            if (err) console.error("Error inserting dummy customer:", err.message);
            else console.log("Dummy customer 'Alice Smith' ensured.");
        });
    }
});

module.exports = db;