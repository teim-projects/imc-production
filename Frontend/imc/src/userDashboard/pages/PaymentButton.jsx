import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {

  const [service, setService] = useState("singing_classes");
  const [amount, setAmount] = useState("");

  const services = {
    studio_booking: "Studio Booking",
    singing_classes: "Singing Classes",
    auditorium_music_shows: "Auditorium Music Shows",
    private_music_events: "Private Music Events",
    photography_service: "Photography Service",
    videography_service: "Videography Service",
    sound_system_service: "Sound System Service",
    singer_management: "Singer Management"
  };

  const payNow = async () => {

    if (!amount) {
      alert("Enter amount");
      return;
    }

    const res = await axios.post(
      "http://localhost:8000/api/payments/create-payment/",
      {
        amount: amount,
        payment_type: services[service],
        reference_id: 1
      }
    );

    window.location.href = res.data.payment_links.web;
  };

  return (
    <div style={styles.card}>

      <h2>IMC Service Payment</h2>

      <select
        value={service}
        onChange={(e) => setService(e.target.value)}
        style={styles.select}
      >
        {Object.keys(services).map((key) => (
          <option key={key} value={key}>
            {services[key]}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Enter Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={styles.input}
      />

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
    padding: 25,
    textAlign: "center",
    borderRadius: 12,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },
  select: {
    width: "100%",
    padding: 10,
    marginTop: 15
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 15
  },
  btn: {
    background: "#28a745",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: 5,
    marginTop: 20,
    cursor: "pointer"
  }
};