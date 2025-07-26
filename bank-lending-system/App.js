// frontend/src/App.js
import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Connects to our backend

function App() {
  //Loan Creation
  const [newLoan, setNewLoan] = useState({
    customer_id: '',
    loan_amount: '',
    loan_period_years: '',
    interest_rate_yearly: ''
  });
  const [loanResult, setLoanResult] = useState(null);
  const [loanError, setLoanError] = useState(null);

  //Payment
  const [paymentDetails, setPaymentDetails] = useState({
    loan_id: '',
    amount: '',
    payment_type: 'EMI'
  });
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  //Ledger
  const [ledgerLoanId, setLedgerLoanId] = useState('');
  const [ledgerDetails, setLedgerDetails] = useState(null);
  const [ledgerError, setLedgerError] = useState(null);

  //Account Overview
  const [overviewCustomerId, setOverviewCustomerId] = useState('');
  const [accountOverview, setAccountOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);

  // --- Handlers for Loan Creation ---
  const handleLoanChange = (e) => {
    setNewLoan({ ...newLoan, [e.target.name]: e.target.value });
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setLoanResult(null);
    setLoanError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: newLoan.customer_id,
          loan_amount: parseFloat(newLoan.loan_amount),
          loan_period_years: parseInt(newLoan.loan_period_years),
          interest_rate_yearly: parseFloat(newLoan.interest_rate_yearly)
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create loan');
      }
      setLoanResult(data);
      alert('Loan created successfully!');
    } catch (err) {
      setLoanError(err.message);
    }
  };

  // --- Handlers for Payment ---
  const handlePaymentChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentResult(null);
    setPaymentError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/loans/${paymentDetails.loan_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentDetails.amount),
          payment_type: paymentDetails.payment_type
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }
      setPaymentResult(data);
      alert('Payment recorded successfully!');
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  // --- Handlers for Ledger ---
  const handleLedgerSearch = async (e) => {
    e.preventDefault();
    setLedgerDetails(null);
    setLedgerError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/loans/${ledgerLoanId}/ledger`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ledger details');
      }
      setLedgerDetails(data);
    } catch (err) {
      setLedgerError(err.message);
    }
  };

  // --- Handlers for Account Overview ---
  const handleOverviewSearch = async (e) => {
    e.preventDefault();
    setAccountOverview(null);
    setOverviewError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${overviewCustomerId}/overview`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch account overview');
      }
      setAccountOverview(data);
    } catch (err) {
      setOverviewError(err.message);
    }
  };


  return (
    <div className="App">
      <h1>Bank Lending System</h1>

      {/* Lend Section */}
      <section>
        <h2>1. Lend (Create New Loan)</h2>
        <form onSubmit={handleCreateLoan}>
          <label>
            Customer ID:
            <input type="text" name="customer_id" value={newLoan.customer_id} onChange={handleLoanChange} required />
          </label>
          <label>
            Loan Amount (P):
            <input type="number" name="loan_amount" value={newLoan.loan_amount} onChange={handleLoanChange} required />
          </label>
          <label>
            Loan Period (Years - N):
            <input type="number" name="loan_period_years" value={newLoan.loan_period_years} onChange={handleLoanChange} required />
          </label>
          <label>
            Interest Rate (Yearly - R):
            <input type="number" name="interest_rate_yearly" value={newLoan.interest_rate_yearly} onChange={handleLoanChange} required />
          </label>
          <button type="submit">Create Loan</button>
        </form>
        {loanResult && (
          <div className="success">
            <h3>Loan Created!</h3>
            <p>Loan ID: {loanResult.loan_id}</p>
            <p>Customer ID: {loanResult.customer_id}</p>
            <p>Total Amount Payable: ₹{loanResult.total_amount_payable}</p>
            <p>Monthly EMI: ₹{loanResult.monthly_emi}</p>
          </div>
        )}
        {loanError && <div className="error">{loanError}</div>}
      </section>

      {/* Payment Section */}
      <section>
        <h2>2. Payment (Record Payment)</h2>
        <form onSubmit={handleRecordPayment}>
          <label>
            Loan ID:
            <input type="text" name="loan_id" value={paymentDetails.loan_id} onChange={handlePaymentChange} required />
          </label>
          <label>
            Amount:
            <input type="number" name="amount" value={paymentDetails.amount} onChange={handlePaymentChange} required />
          </label>
          <label>
            Payment Type:
            <select name="payment_type" value={paymentDetails.payment_type} onChange={handlePaymentChange}>
              <option value="EMI">EMI</option>
              <option value="LUMP_SUM">LUMP SUM</option>
            </select>
          </label>
          <button type="submit">Record Payment</button>
        </form>
        {paymentResult && (
          <div className="success">
            <h3>Payment Recorded!</h3>
            <p>Payment ID: {paymentResult.payment_id}</p>
            <p>Loan ID: {paymentResult.loan_id}</p>
            <p>{paymentResult.message}</p>
            <p>Remaining Balance: ₹{paymentResult.remaining_balance}</p>
            <p>EMIs Left: {paymentResult.emis_left}</p>
          </div>
        )}
        {paymentError && <div className="error">{paymentError}</div>}
      </section>

      {/* Ledger Section */}
      <section>
        <h2>3. Ledger (View Loan Details & Transactions)</h2>
        <form onSubmit={handleLedgerSearch}>
          <label>
            Loan ID:
            <input type="text" value={ledgerLoanId} onChange={(e) => setLedgerLoanId(e.target.value)} required />
          </label>
          <button type="submit">View Ledger</button>
        </form>
        {ledgerDetails && (
          <div className="success">
            <h3>Loan Ledger for {ledgerDetails.loan_id}</h3>
            <p>Customer ID: {ledgerDetails.customer_id}</p>
            <p>Principal Amount: ₹{ledgerDetails.principal}</p>
            <p>Total Amount (Original): ₹{ledgerDetails.total_amount}</p>
            <p>Monthly EMI: ₹{ledgerDetails.monthly_emi}</p>
            <p>Amount Paid: ₹{ledgerDetails.amount_paid}</p>
            <p>Balance Amount: ₹{ledgerDetails.balance_amount}</p>
            <p>EMIs Left: {ledgerDetails.emis_left}</p>
            <h4>Transactions:</h4>
            {ledgerDetails.transactions.length > 0 ? (
              <ul>
                {ledgerDetails.transactions.map((t) => (
                  <li key={t.transaction_id}>
                    {new Date(t.date).toLocaleDateString()} - {t.type}: ₹{t.amount}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No transactions yet.</p>
            )}
          </div>
        )}
        {ledgerError && <div className="error">{ledgerError}</div>}
      </section>

      {/* Account Overview Section */}
      <section>
        <h2>4. Account Overview (All Loans for Customer)</h2>
        <form onSubmit={handleOverviewSearch}>
          <label>
            Customer ID:
            <input type="text" value={overviewCustomerId} onChange={(e) => setOverviewCustomerId(e.target.value)} required />
          </label>
          <button type="submit">View Account Overview</button>
        </form>
        {accountOverview && (
          <div className="success">
            <h3>Account Overview for {accountOverview.customer_id}</h3>
            <p>Total Loans: {accountOverview.total_loans}</p>
            {accountOverview.loans.length > 0 ? (
              accountOverview.loans.map((loan) => (
                <div key={loan.loan_id} className="loan-summary">
                  <h4>Loan ID: {loan.loan_id}</h4>
                  <p>Principal: ₹{loan.principal}</p>
                  <p>Total Amount (Original): ₹{loan.total_amount}</p>
                  <p>Total Interest: ₹{loan.total_interest}</p>
                  <p>EMI Amount: ₹{loan.emi_amount}</p>
                  <p>Amount Paid: ₹{loan.amount_paid}</p>
                  <p>EMIs Left: {loan.emis_left}</p>
                </div>
              ))
            ) : (
              <p>No loans found for this customer.</p>
            )}
          </div>
        )}
        {overviewError && <div className="error">{overviewError}</div>}
      </section>
    </div>
  );
}


export default App;
