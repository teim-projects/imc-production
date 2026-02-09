import axios from "axios";

export default function PaymentPage() {

  const payNow = async () => {
    const res = await axios.post(
      "http://localhost:8000/api/payments/create-payment/",
      { amount: 1 }
    );

    window.location.href = res.data.payment_links.web;
  };

  return (
    <div style={styles.card}>
      <h2>IMC Membership</h2>
      <p>Amount: ₹1.00</p>
      <button onClick={payNow} style={styles.btn}>
        Pay Now
      </button>
    </div>
  );
}

const styles = {
  card: {
    width: 350,
    margin: "100px auto",
    padding: 20,
    textAlign: "center",
    borderRadius: 10,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  btn: {
    background: "#28a745",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: 5,
    fontSize: 16,
    cursor: "pointer"
  }
};
