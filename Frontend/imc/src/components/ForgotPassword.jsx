import React, { useState } from "react";
import { Link } from "react-router-dom";
import singerBg from "../assets/newback.jpg";

const ForgotPassword = () => {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const RESET_ENDPOINT = `${BASE_API}/auth/password-reset/`;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Sending reset link...");

    try {
      const res = await fetch(RESET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setMessage("❌ Unable to send reset email");
        return;
      }

      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch {
      setMessage("⚠️ Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT IMAGE */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${singerBg})` }}
      >
        <div className="hero-overlay">
          <div className="hero-text">
            <h1>Reset Your Password</h1>
            <p>
              Enter your registered email address <br />
              and we’ll send you a password reset link.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="login-form-area">
        <form onSubmit={handleSubmit} className="login-card">
          <h2>Forgot Password</h2>
          <p className="subtitle">
            We’ll help you get back into your account
          </p>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {message && <div className="msg">{message}</div>}

          {/* ✅ GO TO LOGIN LINK */}
          <div className="back-login">
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>

      {/* SAME AUTH STYLES */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: Inter, system-ui, sans-serif;
        }

        .login-wrapper {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          width: 100vw;
          height: 100vh;
        }

        .login-hero {
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
 
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
        }

        .hero-text { max-width: 520px; padding: 0 24px; }

        .hero-text h1 {
          font-size: 3.2rem;
          font-weight: 800;
          text-shadow: 0 6px 20px rgba(0,0,0,0.6);
        }

        .hero-text p {
          margin-top: 1.2rem;
          font-size: 1.25rem;
          line-height: 1.6;
        }

        .login-form-area {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        .login-card {
          background: white;
          width: 100%;
          max-width: 420px;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        }

        .subtitle {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        input {
          width: 100%;
          padding: 14px;
          margin-bottom: 1.4rem;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          border: none;
          color: white;
          border-radius: 8px;
          cursor: pointer;
        }

        .msg {
          margin-top: 1rem;
          text-align: center;
          font-weight: 600;
        }

        /* 👇 BACK TO LOGIN */
        .back-login {
          margin-top: 1.6rem;
          text-align: center;
        }

        .back-login a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .back-login a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .login-wrapper {
            grid-template-columns: 1fr;
          }
          .login-hero {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;