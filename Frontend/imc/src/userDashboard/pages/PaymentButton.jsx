import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {
  const [service, setService] = useState("studio_booking");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const payNow = async () => {
    // Basic validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!service) {
      setError("Please select a service");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/payments/create-payment/", // ← change to your production URL later
        {
          amount: Number(amount),     // send as number (backend will format to .2f)
          service: service,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // HDFC SmartGateway typically returns payment_links.web for web redirect
      const paymentUrl = res.data?.payment_links?.web;

      if (!paymentUrl) {
        throw new Error("Payment URL not received from server");
      }

      // Redirect user to HDFC payment page
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2>IMC Payment</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>Select Service</label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={styles.input}
          disabled={loading}
        >
          <option value="studio_booking">Studio Booking</option>
          <option value="singing_classes">Singing Classes</option>
          <option value="auditorium_music_shows">Auditorium Music Shows</option>
          <option value="private_music_events">Private Music Events</option>
          <option value="photography_service">Photography Service</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Enter Amount (₹)</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
          min="1"
          step="1"
          disabled={loading}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={payNow}
        style={{
          ...styles.btn,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        disabled={loading}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

const styles = {
  card: {
    width: 380,
    maxWidth: "90%",
    margin: "100px auto",
    padding: 30,
    textAlign: "center",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    background: "#fff",
  },
  formGroup: {
    marginBottom: 20,
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 16,
    boxSizing: "border-box",
  },
  btn: {
    background: "#28a745",
    color: "white",
    padding: "14px 30px",
    border: "none",
    borderRadius: 6,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 10,
    width: "100%",
  },
  error: {
    color: "#dc3545",
    fontSize: 14,
    margin: "10px 0",
  },
};