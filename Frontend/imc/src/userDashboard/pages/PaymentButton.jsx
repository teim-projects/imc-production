import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {
  const [service, setService] = useState("singing_classes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const services = {
    studio_booking: "Studio Booking",
    singing_classes: "Singing Classes",
    auditorium_music_shows: "Auditorium Music Shows",
    private_music_events: "Private Music Events",
    photography_service: "Photography Service",
    videography_service: "Videography Service",
    sound_system_service: "Sound System Service",
    singer_management: "Singer Management",
  };

  const payNow = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Use environment variable in production
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8000/api/payments/create-payment/";

      const res = await axios.post(apiUrl, {
        amount: 1,           // Change to real amount later
        service: service,    // Send selected service
      });

      // HDFC gateway returns payment_links.web for redirect
      if (res.data?.payment_links?.web) {
        setMessage("Redirecting to payment gateway...");
        window.location.href = res.data.payment_links.web;
      } else {
        setError("Payment link not found in response.");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to start payment. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2>IMC Payment</h2>

      <label style={styles.label}>Select Service</label>
      <select
        value={service}
        onChange={(e) => setService(e.target.value)}
        style={styles.select}
        disabled={loading}
      >
        {Object.entries(services).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </select>

      <p style={styles.amount}>Amount: ₹1.00 (Test Mode)</p>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.message}>{message}</p>}

      <button
        onClick={payNow}
        style={styles.btn}
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
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    background: "#fff",
    border: "1px solid #eee",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: "bold",
    color: "#333",
  },
  select: {
    width: "100%",
    padding: 12,
    marginBottom: 20,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 16,
    background: "#f9f9f9",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
    margin: "20px 0",
  },
  btn: {
    background: "#28a745",
    color: "white",
    padding: "14px 30px",
    border: "none",
    borderRadius: 8,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  error: {
    color: "#dc3545",
    margin: "15px 0",
    fontWeight: "500",
  },
  message: {
    color: "#17a2b8",
    margin: "15px 0",
    fontWeight: "500",
  },
};