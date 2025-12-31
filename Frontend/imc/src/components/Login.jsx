// src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleAuthButton from "./GoogleAuthButton";

export default function Login() {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

  // dj-rest-auth endpoints
  const LOGIN_ENDPOINT = `${BASE_API}/auth/dj-rest-auth/login/`;
  const USER_ENDPOINT = `${BASE_API}/auth/dj-rest-auth/user/`; // <- current logged-in user

  const [form, setForm] = useState({
    email_or_mobile: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // fetch user profile AFTER login and redirect based on role
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
        console.warn("Failed to load user profile, status:", res.status);
        // fallback: old behaviour
        navigate("/dashboard");
        return;
      }

      const user = await res.json();

      // store for later use
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role) localStorage.setItem("user_role", user.role);
      if (typeof user.is_superuser !== "undefined") {
        localStorage.setItem("is_superuser", JSON.stringify(user.is_superuser));
      }

      window.dispatchEvent(new Event("authChange"));

      const role = (user.role || "").toLowerCase();
      const isSuper = !!user.is_superuser;

      // 🔐 only admin / superuser go to admin dashboard
      if (role === "admin" || isSuper) {
        navigate("/dashboard"); // your existing admin dashboard route
      } else {
        navigate("/user-dashboard"); // normal user/customer dashboard route
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // if something breaks, at least go to old dashboard
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
          JSON.stringify(data);
        setMessage("❌ Login failed: " + detail);
      } else {
        if (data.access) localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);

        setMessage("✅ Login successful!");

        // redirect based on role
        if (data.access) {
          await fetchUserAndRedirect(data.access);
        } else {
          // if for some reason access token not returned, fallback
          window.dispatchEvent(new Event("authChange"));
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("⚠️ Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* rays */}
      <div style={styles.raysWrap} aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            style={{
              ...styles.ray,
              transform: `rotate(${i * (360 / 24)}deg)`,
            }}
          />
        ))}
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>Welcome</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email or Mobile */}
          <label style={styles.label} htmlFor="email_or_mobile">
            Email or Mobile
          </label>
          <div style={styles.inputWrap}>
            <input
              id="email_or_mobile"
              name="email_or_mobile"
              type="text"
              placeholder="you@example.com or 98XXXXXXXX"
              required
              value={form.email_or_mobile}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Password */}
          <label
            style={{ ...styles.label, marginTop: 16 }}
            htmlFor="password"
          >
            Password
          </label>
          <div style={styles.inputWrap}>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••••••••"
              required
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                style={styles.checkbox}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Don’t have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#111",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register
            </Link>
          </p>

          {/* Divider */}
          <div style={styles.dividerRow}>
            <span style={styles.line} />
            <span style={styles.or}>or</span>
            <span style={styles.line} />
          </div>

          {/* Google OAuth button */}
          {/* NOTE: after Google login you may also want to call fetchUserAndRedirect inside GoogleAuthButton */}
          <GoogleAuthButton
            endpoint="/auth/auth/google/"
            onSuccessNavigate="/dashboard"
          />

          {message && <p style={styles.message}>{message}</p>}
        </form>
      </div>

      <style>{globalCss}</style>
    </div>
  );
}

// ---- Styles ----
const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, #fce7f3 0%, #ffe7d6 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  },
  raysWrap: {
    position: "absolute",
    inset: 0,
    margin: "auto",
    width: 1100,
    height: 1100,
    opacity: 0.55,
    pointerEvents: "none",
  },
  ray: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 2,
    height: "48%",
    transformOrigin: "center bottom",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))",
  },
  container: {
    width: 420,
    maxWidth: "92vw",
    padding: "18px 22px 26px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.55)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    textAlign: "left",
  },
  badge: {
    alignSelf: "center",
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 10,
    background: "#fde68a",
    color: "#6b4f00",
    fontWeight: 600,
    fontSize: 12,
    margin: "8px auto 6px",
  },
  title: {
    textAlign: "center",
    margin: "4px 0 16px",
    fontSize: 36,
    lineHeight: 1.15,
    color: "#1f2937",
  },
  form: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 6,
    fontWeight: 600,
  },
  inputWrap: {
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow:
      "0 2px 0 rgba(0,0,0,0.04) inset, 0 6px 16px rgba(0,0,0,0.06)",
    padding: 2,
  },
  input: {
    width: "100%",
    height: 44,
    border: "1px solid transparent",
    outline: "none",
    padding: "0 14px",
    borderRadius: 10,
    fontSize: 14,
    transition: "box-shadow .2s, border-color .2s",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#4b5563",
  },
  checkbox: { width: 16, height: 16, accentColor: "#111" },
  link: { fontSize: 13, color: "#6b7280", textDecoration: "none" },
  primaryBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    border: "1px solid #0b0b0c",
    background: "linear-gradient(180deg, #2b2c30, #0f0f12)",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.2,
    cursor: "pointer",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "18px 0 10px",
  },
  line: { flex: 1, height: 1, background: "#e5e7eb" },
  or: { fontSize: 12, color: "#9ca3af" },
  message: {
    marginTop: 12,
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
  },
};

const globalCss = `
/* Focus ring for inputs */
input:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  border-color: #A5B4FC !important;
}
`;
