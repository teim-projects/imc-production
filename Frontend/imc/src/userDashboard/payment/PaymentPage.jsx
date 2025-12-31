import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../components/Forms/Forms.css"; // reuse same form styles

const PaymentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // data passed from UserStudioRentalForm navigate()
  const booking = state?.booking || null;
  const studio = state?.studio || null;
  const amount = state?.amount || 0;

  if (!booking) {
    return (
      <div className="pf-wrap">
        <h2>Payment</h2>
        <div className="pf-banner pf-error">
          No booking data found. Please start booking again.
        </div>
        <button className="btn" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  const handlePayNow = () => {
    // 👉 Replace this with Razorpay / Stripe integration
    alert("Payment gateway integration goes here.");

    // Example success redirect
    navigate("/payment-success", {
      state: {
        booking,
        studio,
        amount,
        payment_status: "success",
      },
    });
  };

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <h2>Payment</h2>
        <button className="btn ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {/* BOOKING SUMMARY */}
      <section className="pf-card">
        <h3>Booking Summary</h3>
        <div className="pf-grid">
          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Studio</div>
            <div style={{ fontWeight: 600 }}>
              {studio?.name || booking.studio_name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Customer</div>
            <div style={{ fontWeight: 600 }}>{booking.customer}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Date</div>
            <div style={{ fontWeight: 600 }}>{booking.date}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Start Time</div>
            <div style={{ fontWeight: 600 }}>{booking.time_slot}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Duration</div>
            <div style={{ fontWeight: 600 }}>
              {booking.duration} hour(s)
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Price / Hour
            </div>
            <div style={{ fontWeight: 600 }}>
              ₹{booking.price_per_hour || 0}
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENT DETAILS */}
      <section className="pf-card">
        <h3>Payment Details</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            fontSize: 16,
          }}
        >
          <span>Total Amount</span>
          <strong style={{ color: "#b91c1c" }}>₹{amount}</strong>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="pf-actions">
        <button className="btn" onClick={handlePayNow}>
          Pay Now
        </button>
        <button className="btn ghost" onClick={() => navigate("/")}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
