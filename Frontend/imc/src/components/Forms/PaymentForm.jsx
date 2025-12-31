import React, { useState } from "react";
import "./Forms.css";
export default function PaymentForm({ onClose }) {
  const [data, setData] = useState({ customer: "", amount: "", method: "" });
  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); alert("Payment Recorded!"); onClose(); };
  return (
    <div className="form-container">
      <h3>💰 Payment</h3>
      <form onSubmit={handleSubmit}>
        <input name="customer" placeholder="Customer Name" onChange={handleChange} required />
        <input type="number" name="amount" placeholder="Amount ₹" onChange={handleChange} required />
        <input name="method" placeholder="Payment Method" onChange={handleChange} required />
        <div className="form-buttons"><button type="submit">Submit</button><button className="cancel-btn" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}
