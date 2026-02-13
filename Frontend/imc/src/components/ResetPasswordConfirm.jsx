import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import singerBg from "../assets/newback.jpg"; // same image as forgot password page

const ResetPasswordConfirm = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const CONFIRM_ENDPOINT = `${BASE_API}/auth/password-reset-confirm/`;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("❌ Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setMessage("Resetting your password...");

    try {
      const res = await fetch(CONFIRM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidb64: uid,
          token: token,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Most Django reset endpoints return detail or non_field_errors
        const errorMsg =
          data.detail ||
          data.non_field_errors?.[0] ||
          data.new_password?.[0] ||
          "Failed to reset password. Link may be invalid or expired.";
        setMessage(`❌ ${errorMsg}`);
        return;
      }

      setIsSuccess(true);
      setMessage("✅ Password successfully reset!");
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT IMAGE / HERO */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${singerBg})` }}
      >
        <div className="hero-overlay">
          <div className="hero-text">
            <h1>Create New Password</h1>
            <p>
              Enter your new password below<br />
              to regain access to your account.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="login-form-area">
        <form onSubmit={handleSubmit} className="login-card">
          <h2>Reset Password</h2>
          <p className="subtitle">Choose a strong new password</p>

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading || isSuccess}>
            {loading
              ? "Resetting..."
              : isSuccess
              ? "Redirecting..."
              : "Reset Password"}
          </button>

          {message && (
            <div className={`msg ${isSuccess ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <div className="back-login">
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/*               SAME STYLES AS FORGOT PAGE        */}
      {/* ────────────────────────────────────────────── */}
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
          background: rgba(0,0,0,0.45);
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
          text-shadow: 0 6px 20px rgba(0,0,0,0.7);
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
          text-align: center;
        }

        input {
          width: 100%;
          padding: 14px;
          margin-bottom: 1.2rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 1rem;
        }

        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: linear-gradient(90deg, #93c5fd, #c4b5fd);
        }

        .msg {
          margin-top: 1.2rem;
          text-align: center;
          font-weight: 600;
          padding: 10px;
          border-radius: 8px;
        }

        .msg.success {
          color: #166534;
          background: #dcfce7;
        }

        .msg.error {
          color: #991b1b;
          background: #fee2e2;
        }

        .back-login {
          margin-top: 1.8rem;
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

export default ResetPasswordConfirm;