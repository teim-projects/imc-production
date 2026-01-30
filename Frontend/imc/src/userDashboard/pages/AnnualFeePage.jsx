// src/userDashboard/pages/AnnualFeePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000/";
const API = `${BASE.replace(/\/$/, "")}/auth/annual-fees/`;


const api = axios.create();
api.interceptors.request.use((c) => {
  const token = localStorage.getItem("access");
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

export default function AnnualFeePage({ singerId }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState("");

  const fetchFees = async () => {
    if (!singerId) {
      setFees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(API, {
        params: { singer: singerId },
      });

      const data = res.data.results || res.data || [];
      setFees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch fees:", err);
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Network error — is the backend running at " + BASE + " ?");
      } else if (err.response?.status === 404) {
        setError("Endpoint not found (404). Check if /api/auth/annual-fees/ exists in Django urls.py");
      } else {
        setError("Unable to load fee records. " + (err.message || ""));
      }
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [singerId]);

  const submitFee = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      await api.post(API, {
        singer: singerId,
        year: new Date().getFullYear(),
        amount: Number(amount),
        payment_method: "Cash",
        remarks: null,
      });

      setAmount("");
      fetchFees();
      alert("Fee added successfully!");
    } catch (err) {
      console.error("Failed to add fee:", err);
      if (err.code === "ERR_NETWORK" || !err.response) {
        alert("Network error — cannot reach backend at " + API);
      } else if (err.response?.status === 404) {
        alert("404 Not Found — annual-fees endpoint doesn't exist or URL is wrong");
      } else if (err.response?.status === 400) {
        const detail = err.response.data?.detail || JSON.stringify(err.response.data);
        alert("Validation error: " + detail);
      } else {
        alert("Failed to add fee: " + (err.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="pf-wrap">
      <h2 style={{ marginBottom: "32px", fontSize: "1.8rem", color: "#1e293b" }}>
        Annual Membership Fees
      </h2>

      {/* Add Fee Record */}
      <div className="pf-card" style={{ marginBottom: "40px" }}>
        <h3 style={{ marginBottom: "20px", color: "#dc2626", fontWeight: "600" }}>
          ● Add Fee Record
        </h3>
        <form onSubmit={submitFee}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Amount (₹) *
            </label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "50px",
              fontSize: "1.1rem",
              fontWeight: "600",
              background: "#2563eb",
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)",
            }}
          >
            Add Fee Record
          </button>
        </form>
      </div>

      {/* Fee Records Table */}
      <div className="pf-card">
        <h3 style={{ marginBottom: "20px", color: "#dc2626", fontWeight: "600" }}>
          ● All Fee Records
        </h3>

        {error && (
          <div className="pf-banner pf-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "50px", color: "#6b7280" }}>
                    Loading fee records...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "50px", color: "#6b7280" }}>
                    No fee records found for this singer.
                  </td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: "600", color: "#f97316" }}>
                      {f.id}
                    </td>
                    <td style={{ fontWeight: "600", color: "#15803d", fontSize: "1.1rem" }}>
                      ₹ {Number(f.amount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}