import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {

  const [service, setService] = useState("singing_classes");
  const [registrationId, setRegistrationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const payNow = async () => {

    if (!registrationId) {
      setError("Registration ID required");
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const res = await axios.post(
        "http://localhost:8000/api/payments/create-payment/",
        {
          registration_id: registrationId,
          service: service
        }
      );

      const paymentUrl = res.data?.payment_links?.web;

      if (!paymentUrl) {
        throw new Error("Payment URL not received");
      }

      window.location.href = paymentUrl;

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        err.message ||
        "Payment failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <div style={styles.card}>

      <h2>IMC Payment</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>Registration ID</label>
        <input
          type="number"
          value={registrationId}
          onChange={(e) => setRegistrationId(e.target.value)}
          style={styles.input}
        />
      </div>

      <button
        onClick={payNow}
        style={styles.btn}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>

      {error && <p style={styles.error}>{error}</p>}

    </div>
  );
}

const styles = {
  card: {
    width: 380,
    margin: "100px auto",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    background: "#fff",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  btn: {
    background: "#28a745",
    color: "white",
    padding: "14px 30px",
    border: "none",
    borderRadius: 6,
    fontSize: 18,
    width: "100%",
  },
  error: {
    color: "red",
    marginTop: 10,
  }
};