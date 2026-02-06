import axios from "axios";

const PaymentButton = ({ setOrderId }) => {

  const payNow = async () => {
    const res = await axios.post(
      "http://localhost:8000/api/payments/create-payment/"
    );

    const orderId = res.data.order_id;
    setOrderId(orderId);

    window.location.href = res.data.payment_links.web;
  };

  return <button onClick={payNow}>Pay ₹1</button>;
};

export default PaymentButton;
