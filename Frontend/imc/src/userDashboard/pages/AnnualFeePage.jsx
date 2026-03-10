import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000/";
const API = `${BASE.replace(/\/$/, "")}/auth/annual-fees/`;

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function AnnualFeePage({ singerId }) {

  const [fees, setFees] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFees = async () => {

    if (!singerId) return;

    setLoading(true);

    try {

      const res = await api.get(API, {
        params: { singer: singerId }
      });

      const data = res.data.results || res.data;

      setFees(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchFees();
  }, [singerId]);

  const submitFee = async (e) => {

    e.preventDefault();

    if (!amount) return;

    try {

      await api.post(API, {
        singer: singerId,
        amount: Number(amount),
        payment_method: "Cash"
      });

      setAmount("");
      fetchFees();

    } catch (err) {
      console.error(err);
      alert("Failed to add fee");
    }
  };

  return (
    <div>

      <h2>Annual Membership Fees</h2>

      <form onSubmit={submitFee}>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />

        <button type="submit">Add Fee</button>

      </form>

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>

          {loading ? (
            <tr>
              <td colSpan="2">Loading...</td>
            </tr>
          ) : fees.length === 0 ? (
            <tr>
              <td colSpan="2">No records</td>
            </tr>
          ) : (
            fees.map((f) => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>₹ {Number(f.amount).toLocaleString("en-IN")}</td>
              </tr>
            ))
          )}

        </tbody>

      </table>

    </div>
  );
}