import React from "react";

const PaymentSuccess = () => {
  return (
    <>
      {/* ===== CSS INSIDE SAME FILE ===== */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .payment-wrapper {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f9d58, #34a853);
        }

        .payment-card {
          background: #ffffff;
          padding: 45px 40px;
          border-radius: 18px;
          width: 400px;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.18);
          animation: fadeIn 0.6s ease-in-out;
        }

        .checkmark-circle {
          width: 90px;
          height: 90px;
          margin: 0 auto 25px;
          border-radius: 50%;
          background: #0f9d58;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(15, 157, 88, 0.4);
        }

        .checkmark {
          color: #ffffff;
          font-size: 48px;
          font-weight: bold;
        }

        .success-title {
          font-size: 28px;
          color: #0f9d58;
          margin-bottom: 10px;
        }

        .success-text {
          font-size: 15px;
          color: #555;
          margin-bottom: 30px;
        }

        .info-box {
          background: #f6f8fb;
          padding: 18px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: left;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin: 8px 0;
          color: #333;
        }

        .info-row span:last-child {
          font-weight: 600;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: #0f9d58;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .primary-btn:hover {
          background: #0b7a43;
          transform: translateY(-2px);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .payment-card {
            width: 90%;
            padding: 35px 25px;
          }
        }
      `}</style>

      {/* ===== UI ===== */}
      <div className="payment-wrapper">
        <div className="payment-card">
          <div className="checkmark-circle">
            <span className="checkmark">✓</span>
          </div>

          <h1 className="success-title">Payment Successful</h1>
          <p className="success-text">
            Thank you for your payment. Your transaction has been completed
            successfully.
          </p>

          <div className="info-box">
            <div className="info-row">
              <span>Status</span>
              <span>Completed</span>
            </div>
            <div className="info-row">
              <span>Payment Method</span>
              <span>UPI</span>
            </div>
            <div className="info-row">
              <span>Amount Paid</span>
              <span>₹1.00</span>
            </div>
          </div>

          <button
            className="primary-btn"
            onClick={() => (window.location.href = "/")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
