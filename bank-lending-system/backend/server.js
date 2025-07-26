// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // For unique IDs
const db = require('./database'); // Our database connection

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Base URL for API
const API_BASE_URL = '/api/v1';

// Helper function to calculate interest and EMI
function calculateLoanDetails(principal, loanPeriodYears, interestRate) {
    const totalInterest = principal * loanPeriodYears * (interestRate / 100);
    const totalAmount = principal + totalInterest;
    const monthlyEmi = totalAmount / (loanPeriodYears * 12);
    return { totalInterest, totalAmount, monthlyEmi };
}

// 2.1. LEND: Create a new loan (POST /loans)
app.post(`${API_BASE_URL}/loans`, (req, res) => {
    const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;

    if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
        return res.status(400).json({ error: 'Missing required loan parameters.' });
    }

    // Basic validation for numbers
    if (isNaN(loan_amount) || isNaN(loan_period_years) || isNaN(interest_rate_yearly)) {
        return res.status(400).json({ error: 'Loan amount, period, and interest rate must be numbers.' });
    }

    const { totalAmount, monthlyEmi } = calculateLoanDetails(loan_amount, loan_period_years, interest_rate_yearly);
    const loan_id = uuidv4();

    db.run(`INSERT INTO Loans (loan_id, customer_id, principal_amount, total_amount, interest_rate, loan_period_years, monthly_emi) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [loan_id, customer_id, loan_amount, totalAmount, interest_rate_yearly, loan_period_years, monthlyEmi],
        function (err) {
            if (err) {
                console.error("Error creating loan:", err.message);
                return res.status(500).json({ error: 'Failed to create loan.' });
            }
            res.status(201).json({
                loan_id: loan_id,
                customer_id: customer_id,
                total_amount_payable: parseFloat(totalAmount.toFixed(2)),
                monthly_emi: parseFloat(monthlyEmi.toFixed(2))
            });
        }
    );
});

// 2.2. PAYMENT: Record a payment for a loan (POST /loans/{loan_id}/payments)
app.post(`${API_BASE_URL}/loans/:loan_id/payments`, (req, res) => {
    const { loan_id } = req.params;
    const { amount, payment_type } = req.body;

    if (!amount || !payment_type) {
        return res.status(400).json({ error: 'Missing required payment parameters.' });
    }
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Payment amount must be a positive number.' });
    }
    if (!['EMI', 'LUMP_SUM'].includes(payment_type.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid payment type. Must be EMI or LUMP_SUM.' });
    }

    db.get(`SELECT total_amount, monthly_emi, principal_amount, loan_period_years, interest_rate FROM Loans WHERE loan_id = ?`, [loan_id], (err, loan) => {
        if (err) {
            console.error("Error fetching loan for payment:", err.message);
            return res.status(500).json({ error: 'Failed to retrieve loan details.' });
        }
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found.' });
        }

        const newOutstandingBalance = loan.total_amount - amount;
        let newEmisLeft = Math.ceil(newOutstandingBalance / loan.monthly_emi);

        // If lump sum makes the balance negative or zero, set EMIs left to 0 and status to PAID_OFF
        if (newOutstandingBalance <= 0) {
            newEmisLeft = 0;
        }

        const payment_id = uuidv4();

        db.serialize(() => {
            db.run(`INSERT INTO Payments (payment_id, loan_id, amount, payment_type) VALUES (?, ?, ?, ?)`,
                [payment_id, loan_id, amount, payment_type],
                function (err) {
                    if (err) {
                        console.error("Error recording payment:", err.message);
                        return res.status(500).json({ error: 'Failed to record payment.' });
                    }

                    // Update loan's total_amount and status
                    const loanStatus = newOutstandingBalance <= 0 ? 'PAID_OFF' : 'ACTIVE';
                    db.run(`UPDATE Loans SET total_amount = ?, status = ? WHERE loan_id = ?`,
                        [newOutstandingBalance, loanStatus, loan_id],
                        function (err) {
                            if (err) {
                                console.error("Error updating loan after payment:", err.message);
                                // Potentially roll back the payment here in a real system
                                return res.status(500).json({ error: 'Failed to update loan after payment.' });
                            }
                            res.status(200).json({
                                payment_id: payment_id,
                                loan_id: loan_id,
                                message: 'Payment recorded successfully.',
                                remaining_balance: parseFloat(newOutstandingBalance.toFixed(2)),
                                emis_left: newEmisLeft
                            });
                        }
                    );
                }
            );
        });
    });
});

// 2.3. LEDGER: View loan details and transaction history (GET /loans/{loan_id}/ledger)
app.get(`${API_BASE_URL}/loans/:loan_id/ledger`, (req, res) => {
    const { loan_id } = req.params;

    db.get(`SELECT * FROM Loans WHERE loan_id = ?`, [loan_id], (err, loan) => {
        if (err) {
            console.error("Error fetching loan for ledger:", err.message);
            return res.status(500).json({ error: 'Failed to retrieve loan details.' });
        }
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found.' });
        }

        db.all(`SELECT payment_id AS transaction_id, payment_date AS date, amount, payment_type AS type FROM Payments WHERE loan_id = ? ORDER BY payment_date ASC`, [loan_id], (err, transactions) => {
            if (err) {
                console.error("Error fetching payments for ledger:", err.message);
                return res.status(500).json({ error: 'Failed to retrieve transaction history.' });
            }

            const initialTotalAmount = loan.principal_amount + (loan.principal_amount * loan.loan_period_years * (loan.interest_rate / 100));
            const amountPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
            const balanceAmount = loan.total_amount; // loan.total_amount is already the remaining balance
            const emisLeft = balanceAmount > 0 ? Math.ceil(balanceAmount / loan.monthly_emi) : 0;

            res.status(200).json({
                loan_id: loan.loan_id,
                customer_id: loan.customer_id,
                principal: parseFloat(loan.principal_amount.toFixed(2)),
                total_amount: parseFloat(initialTotalAmount.toFixed(2)), // Initial total amount
                monthly_emi: parseFloat(loan.monthly_emi.toFixed(2)),
                amount_paid: parseFloat(amountPaid.toFixed(2)),
                balance_amount: parseFloat(balanceAmount.toFixed(2)),
                emis_left: emisLeft,
                transactions: transactions.map(t => ({
                    transaction_id: t.transaction_id,
                    date: t.date,
                    amount: parseFloat(t.amount.toFixed(2)),
                    type: t.type
                }))
            });
        });
    });
});

// 2.4. ACCOUNT OVERVIEW: View all loans for a customer (GET /customers/{customer_id}/overview)
app.get(`${API_BASE_URL}/customers/:customer_id/overview`, (req, res) => {
    const { customer_id } = req.params;

    db.all(`SELECT * FROM Loans WHERE customer_id = ?`, [customer_id], async (err, loans) => {
        if (err) {
            console.error("Error fetching loans for customer overview:", err.message);
            return res.status(500).json({ error: 'Failed to retrieve customer loans.' });
        }
        if (loans.length === 0) {
            return res.status(404).json({ error: 'No loans found for this customer_id.' });
        }

        const loansWithDetails = [];
        for (const loan of loans) {
            const initialTotalAmount = loan.principal_amount + (loan.principal_amount * loan.loan_period_years * (loan.interest_rate / 100));
            const totalInterest = initialTotalAmount - loan.principal_amount;

            // Calculate amount paid by summing up all payments for this loan
            const payments = await new Promise((resolve, reject) => {
                db.all(`SELECT amount FROM Payments WHERE loan_id = ?`, [loan.loan_id], (err, p) => {
                    if (err) reject(err);
                    else resolve(p);
                });
            });
            const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            const balanceAmount = loan.total_amount; // Current outstanding balance
            const emisLeft = balanceAmount > 0 ? Math.ceil(balanceAmount / loan.monthly_emi) : 0;

            loansWithDetails.push({
                loan_id: loan.loan_id,
                principal: parseFloat(loan.principal_amount.toFixed(2)),
                total_amount: parseFloat(initialTotalAmount.toFixed(2)),
                total_interest: parseFloat(totalInterest.toFixed(2)),
                emi_amount: parseFloat(loan.monthly_emi.toFixed(2)),
                amount_paid: parseFloat(amountPaid.toFixed(2)),
                emis_left: emisLeft
            });
        }

        res.status(200).json({
            customer_id: customer_id,
            total_loans: loans.length,
            loans: loansWithDetails
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});