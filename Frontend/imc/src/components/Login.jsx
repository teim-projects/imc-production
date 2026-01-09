import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleAuthButton from "./GoogleAuthButton";
import singerBg from "../assets/newback.jpg";

export default function Login() {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

  const LOGIN_ENDPOINT = `${BASE_API}/auth/dj-rest-auth/login/`;
  const USER_ENDPOINT = `${BASE_API}/auth/dj-rest-auth/user/`;

  const [form, setForm] = useState({
    email_or_mobile: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ================= SAME BACKEND LOGIC ================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const fetchUserAndRedirect = async (accessToken) => {
    try {
      const res = await fetch(USER_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        navigate("/dashboard");
        return;
      }

      const user = await res.json();

      localStorage.setItem("user", JSON.stringify(user));
      if (user.role) localStorage.setItem("user_role", user.role);
      if (typeof user.is_superuser !== "undefined") {
        localStorage.setItem(
          "is_superuser",
          JSON.stringify(user.is_superuser)
        );
      }

      window.dispatchEvent(new Event("authChange"));

      const role = (user.role || "").toLowerCase();
      const isSuper = !!user.is_superuser;

      if (role === "admin" || isSuper) {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Logging in...");

    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_mobile: form.email_or_mobile,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail =
          data?.detail ||
          data?.non_field_errors?.[0] ||
          data?.error ||
          "Invalid credentials";
        setMessage("❌ " + detail);
      } else {
        if (data.access) localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);

        setMessage("✅ Login successful! Redirecting...");
        await fetchUserAndRedirect(data.access);
      }
    } catch {
      setMessage("⚠️ Unable to connect. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="login-wrapper">
      {/* LEFT HERO */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${singerBg})` }}
      >
        <div className="hero-overlay">
          <div className="hero-text">
            <h1>Book Live Singer Shows</h1>
            <p>
              Discover, book, and manage live singer performances <br />
              for concerts, events, and private shows.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="login-form-area">
        <form onSubmit={handleSubmit} className="login-card">
          <h2>Sign In</h2>
          <p className="subtitle">Enter your credentials to continue</p>

          <input
            type="text"
            name="email_or_mobile"
            placeholder="Email or Mobile"
            value={form.email_or_mobile}
            onChange={handleChange}
            required
          />

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>👁</span>
          </div>

          <div className="options">
            <label>
              <input type="checkbox" name="remember" onChange={handleChange} />
              Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="divider">OR</div>

          <GoogleAuthButton endpoint="/auth/google/" />

          {message && <div className="msg">{message}</div>}

          <p className="signup">
            Don’t have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>

      {/* ================= STYLES ================= */}
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
          color: #fff;
        }

        .hero-text h1 {
          font-size: 3.5rem;
          font-weight: 800;
        }

        .hero-text p {
          margin-top: 1rem;
          font-size: 1.2rem;
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
          max-width: 420px;
          width: 100%;
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
          margin-bottom: 1.2rem;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .password-box {
          position: relative;
        }

        .password-box span {
          position: absolute;
          right: 14px;
          top: 14px;
          cursor: pointer;
        }

        .options {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          border: none;
          color: white;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        }

        .divider {
          text-align: center;
          margin: 1.5rem 0;
          color: #9ca3af;
        }

        .msg {
          margin-top: 1rem;
          text-align: center;
          font-weight: 600;
        }

        .signup {
          text-align: center;
          margin-top: 1.5rem;
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
}