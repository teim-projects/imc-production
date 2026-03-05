import axios from "axios";
import { useState } from "react";

export default function PaymentPage() {

  const [service,setService] = useState("studio_booking");
  const [amount,setAmount] = useState("");

  const payNow = async () => {

    const res = await axios.post(
      "http://localhost:8000/api/payments/create-payment/",
      {
        service:service,
        amount:Number(amount)
      }
    );

    const paymentUrl = res.data.payment_links.web;

    window.location.href = paymentUrl;

  };

  return (

    <div>

      <h2>IMC Payment</h2>

      <select value={service} onChange={(e)=>setService(e.target.value)}>

        <option value="studio_booking">Studio Booking</option>

        <option value="singing_classes">Singing Classes</option>

        <option value="auditorium_music_shows">Auditorium Music Shows</option>

        <option value="private_music_events">Private Music Events</option>

        <option value="photography_service">Photography Service</option>

      </select>

      <br/><br/>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
      />

      <br/><br/>

      <button onClick={payNow}>Pay Now</button>

    </div>

  );

}