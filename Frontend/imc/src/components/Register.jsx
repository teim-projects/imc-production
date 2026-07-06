import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleAuthButton from "./GoogleAuthButton";
import singerBg from "../assets/newback.jpg";

/* ===== VALIDATION ===== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^[0-9]{10}$/;
const MAX_PHOTO_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_FIELD_NAME = "photo";

export default function Register() {
  const navigate = useNavigate();
  const REGISTER_URL = `${import.meta.env.VITE_BASE_API_URL}/auth/dj-rest-auth/registration/`;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_no: "",
    password1: "",
    password2: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* PHOTO */
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef(null);

  /* ERRORS */
  const [emailServerErr, setEmailServerErr] = useState("");
  const [mobileServerErr, setMobileServerErr] = useState("");

  const emailErr = useMemo(
    () => (form.email && !EMAIL_RE.test(form.email) ? "Invalid email" : ""),
    [form.email]
  );

  const mobileErr = useMemo(
    () => (form.mobile_no && !PHONE_RE.test(form.mobile_no) ? "10-digit number required" : ""),
    [form.mobile_no]
  );

  const passwordMatchErr = useMemo(
    () => (form.password2 && form.password1 !== form.password2 ? "Passwords do not match check" : ""),
    [form.password1, form.password2]
  );

  const isFormValid =
    form.full_name.trim().length >= 2 &&
    EMAIL_RE.test(form.email) &&
    PHONE_RE.test(form.mobile_no) &&
    form.password1.length >= 8 &&
    !passwordMatchErr &&
    agreeTerms;

  /* HANDLERS */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "email") setEmailServerErr("");
    if (name === "mobile_no") setMobileServerErr("");
  };

  const handlePhoto = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type))
      return setPhotoError("Only JPG, PNG, WebP allowed");
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setPhotoError(`Max ${MAX_PHOTO_MB}MB`);

    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setMessage("");
    setEmailServerErr("");
    setMobileServerErr("");

    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name);
      fd.append("email", form.email);
      fd.append("mobile_no", form.mobile_no);
      fd.append("password1", form.password1);
      fd.append("password2", form.password2);
      if (photoFile) fd.append(PHOTO_FIELD_NAME, photoFile);

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        body: fd,
      });

      // Read raw text first so we can inspect even non-JSON (500 HTML) responses
      const rawText = await res.text().catch(() => "");
      let data = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }

      if (!res.ok) {
        const rawLower = rawText.toLowerCase();

        // Only flag as duplicate if the response SPECIFICALLY names that field
        // The MySQL 500 error contains: Duplicate entry 'x' for key 'api_customuser.email'
        // The DRF 400 JSON contains: { "email": ["..."] } or { "mobile_no": ["..."] }

        const emailDuplicate =
          (data?.email && (Array.isArray(data.email) ? data.email[0] : data.email)) ||
          (rawLower.includes("duplicate") && rawLower.includes("customuser.email"));

        const mobileDuplicate =
          (data?.mobile_no && (Array.isArray(data.mobile_no) ? data.mobile_no[0] : data.mobile_no)) ||
          (rawLower.includes("duplicate") && rawLower.includes("customuser.mobile_no"));

        if (emailDuplicate) {
          setEmailServerErr(
            "This email address is already registered. Please use a different email address or log in with your existing account."
          );
        }
        if (mobileDuplicate) {
          setMobileServerErr("An account with this mobile number already exists.");
        }
        if (!emailDuplicate && !mobileDuplicate) {
          const fallback =
            data?.detail ||
            data?.non_field_errors?.[0] ||
            "Please check your details and try again.";
          setMessage("❌ " + fallback);
        }
        return;
      }

      setMessage("🎉 Account created! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      setMessage("⚠️ Network error");
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
            <h1>Join Live Singer Shows</h1>
            <p>
              Create your account to book, manage <br />
              and explore live music experiences.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="login-form-area">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          <p className="subtitle">Sign up to get started</p>

          <input
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={emailServerErr ? { borderColor: "#dc2626" } : {}}
            required
          />
          {emailErr && <div className="msg error">{emailErr}</div>}
          {!emailErr && emailServerErr && (
            <div className="msg error" style={{ marginBottom: "0.75rem" }}>
              {emailServerErr}
            </div>
          )}

          <input
            name="mobile_no"
            placeholder="Mobile Number"
            maxLength={10}
            value={form.mobile_no}
            onChange={handleChange}
            style={mobileServerErr ? { borderColor: "#dc2626" } : {}}
            required
          />
          {mobileErr && <div className="msg error">{mobileErr}</div>}
          {!mobileErr && mobileServerErr && (
            <div className="msg error" style={{ marginBottom: "0.75rem" }}>
              {mobileServerErr}
            </div>
          )}

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              name="password1"
              placeholder="Password"
              value={form.password1}
              onChange={handleChange}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>👁</span>
          </div>

          <input
            type="password"
            name="password2"
            placeholder="Confirm Password"
            value={form.password2}
            onChange={handleChange}
            required
          />
          {passwordMatchErr && <div className="msg error">{passwordMatchErr}</div>}

          {/* PHOTO */}
          <div
            className="photo-upload"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" />
            ) : (
              <span>Upload Profile Photo (optional)</span>
            )}
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files[0])}
            />
          </div>
          {photoError && <div className="msg error">{photoError}</div>}

          <label className="terms">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            I agree to the Terms
          </label>

          <button disabled={!isFormValid || loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="divider">OR</div>
          <GoogleAuthButton endpoint="/auth/google/" />

          {message && <div className="msg">{message}</div>}

          <p className="signup">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </div>

      {/* SAME STYLE AS LOGIN */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width:100%; height:100%; overflow:hidden; font-family:Inter,system-ui; }

        .login-wrapper {
          display:grid;
          grid-template-columns:1.2fr 1fr;
          width:100vw;
          height:100vh;
        }

        .login-hero {
          background-size:cover;
          background-position:center;
          position:relative;
        }

        .hero-overlay {
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          color:white;
        }

        .hero-text h1 {
          font-size:3.2rem;
          font-weight:800;
          text-shadow:0 6px 20px rgba(0,0,0,.6);
        }

        .hero-text p {
          margin-top:1rem;
          font-size:1.2rem;
        }

        .login-form-area {
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f9fafb;
        }

        .login-card {
          max-width:420px;
          width:100%;
          padding:3rem;
          border-radius:16px;
          background:white;
          box-shadow:0 30px 60px rgba(0,0,0,.12);
        }

        input {
          width:100%;
          padding:14px;
          margin-bottom:1rem;
          border-radius:8px;
          border:1px solid #ddd;
        }

        .password-box { position:relative; }
        .password-box span {
          position:absolute;
          right:14px;
          top:14px;
          cursor:pointer;
        }

        .photo-upload {
          padding:14px;
          border:1px dashed #aaa;
          border-radius:8px;
          text-align:center;
          margin-bottom:1rem;
          cursor:pointer;
        }

        .photo-upload img {
          width:100%;
          border-radius:8px;
        }

        button {
          width:100%;
          padding:14px;
          background:linear-gradient(90deg,#2563eb,#4f46e5);
          border:none;
          color:white;
          border-radius:8px;
          cursor:pointer;
        }

        .divider {
          text-align:center;
          margin:1.5rem 0;
          color:#9ca3af;
        }

        .msg { text-align:center; margin-top:.5rem; }
        .msg.error { color:#dc2626; }

        .signup { text-align:center; margin-top:1.2rem; }

        @media(max-width:900px){
          .login-wrapper { grid-template-columns:1fr; }
          .login-hero { display:none; }
        }
      `}</style>
    </div>
  );
}