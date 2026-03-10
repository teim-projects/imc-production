import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {
  const [service, setService] = useState("singing_classes");
  const [registrationId, setRegistrationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const payNow = async () => {
    // Basic validation
    if (!registrationId.trim()) {
      setError("Please enter Registration ID");
      return;
    }

    // Optional: you can add more validation here (e.g. check if number is valid)
    const regIdNum = Number(registrationId);
    if (isNaN(regIdNum) || regIdNum <= 0) {
      setError("Registration ID must be a positive number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/payments/create-payment/", // ← change to your production URL later
        {
          registration_id: regIdNum,   // send as number
          service: service,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      console.log("Payment initiation response:", response.data);

      // Try different possible keys where gateway might return the payment URL
      const paymentUrl =
        response.data?.payment_links?.web ||
        response.data?.payment_url ||
        response.data?.link ||
        response.data?.redirect_url ||
        response.data?.paymentLink;

      if (!paymentUrl) {
        throw new Error("Payment URL not found in server response");
      }

      // Redirect user to payment gateway
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Payment initiation failed:", err);

      let errorMessage = "Something went wrong. Please try again.";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>IMC Payment</h2>

        {/* Service Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Service</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="singing_classes">Singing Classes</option>
            <option value="singer_registration">Singer Registration</option>
            <option value="studio_booking">Studio Booking</option>
          </select>
        </div>

        {/* Registration ID Input */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Registration ID</label>
          <input
            type="number"
            placeholder="Enter your registration ID"
            value={registrationId}
            onChange={(e) => {
              setRegistrationId(e.target.value);
              setError(null); // clear error on typing
            }}
            style={styles.input}
            disabled={loading}
          />
        </div>

        {/* Pay Button */}
        <button
          onClick={payNow}
          style={{
            ...styles.button,
            background: loading ? "#6c757d" : "#28a745",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {/* Error Message */}
        {error && <p style={styles.errorMessage}>{error}</p>}

        <p style={styles.note}>
          You will be redirected to the secure payment gateway.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8f9fa",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    background: "#ffffff",
  },
  title: {
    textAlign: "center",
    marginBottom: "32px",
    color: "#333",
    fontSize: "28px",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#444",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #ced4da",
    borderRadius: "8px",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #ced4da",
    borderRadius: "8px",
    fontSize: "16px",
    background: "#fff",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "18px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  errorMessage: {
    marginTop: "16px",
    color: "#dc3545",
    textAlign: "center",
    fontSize: "15px",
  },
  note: {
    marginTop: "20px",
    textAlign: "center",
    color: "#6c757d",
    fontSize: "14px",
  },
};