import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GoogleAuthButton from "./GoogleAuthButton";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^[0-9]{10}$/; // IN 10-digit
const MAX_PHOTO_MB = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_FIELD_NAME = "photo"; // 🔁 must match your Django field (e.g., "photo" or "profile_image")

const Register = () => {
  const navigate = useNavigate();
  const REGISTER_URL = `${import.meta.env.VITE_BASE_API_URL}/auth/dj-rest-auth/registration/`;
  console.log("url:",REGISTER_URL)
  console.log("base:",import.meta.env.VITE_BASE_API_URL)

  const [form, setForm] = useState({ email: "", mobile_no: "", password1: "", password2: "" });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({}); // ← server-side field errors
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // clear server error for that field once user edits
    if (fieldErrors[e.target.name]) {
      setFieldErrors((fe) => ({ ...fe, [e.target.name]: null }));
    }
  };
  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  // validations
  const emailErr = useMemo(
    () => (form.email && !EMAIL_RE.test(form.email) ? "Invalid email" : ""),
    [form.email]
  );
  const phoneErr = useMemo(
    () => (form.mobile_no && !PHONE_RE.test(form.mobile_no) ? "Enter 10-digit mobile" : ""),
    [form.mobile_no]
  );
  const passMatchErr = useMemo(
    () => (form.password2 && form.password1 !== form.password2 ? "Passwords do not match" : ""),
    [form.password1, form.password2]
  );

  const strength = useMemo(() => passwordStrength(form.password1), [form.password1]);
  const allValid = EMAIL_RE.test(form.email) && PHONE_RE.test(form.mobile_no) && form.password1 && !passMatchErr;

  // ---- Photo helpers ----
  const validateAndSetPhoto = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Only JPG, PNG or WebP allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`Max size ${MAX_PHOTO_MB} MB.`);
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    // clear any server photo error after new pick
    if (fieldErrors[PHOTO_FIELD_NAME]) {
      setFieldErrors((fe) => ({ ...fe, [PHOTO_FIELD_NAME]: null }));
    }
  };

  const onFilePick = (e) => validateAndSetPhoto(e.target.files?.[0]);
  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); validateAndSetPhoto(e.dataTransfer.files?.[0]); };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
  };

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!allValid) { setMessage("Please fix the highlighted fields."); return; }
    if (photoError) { setMessage("Please fix the photo issue."); return; }

    setLoading(true);
    setMessage("Registering...");
    try {
      // Always send as multipart/form-data (supports file)
      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("mobile_no", form.mobile_no);
      fd.append("password1", form.password1);
      fd.append("password2", form.password2);
      if (photoFile) fd.append(PHOTO_FIELD_NAME, photoFile);

      const res = await fetch(REGISTER_URL, { method: "POST", body: fd });
      let data = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        // dj-rest-auth / DRF will usually return field dict like {mobile_no:["msg"], email:["msg"], photo:["msg"], non_field_errors:["msg"]}
        if (data && typeof data === "object") {
          const normalized = {};
          for (const [k, v] of Object.entries(data)) {
            if (Array.isArray(v) && v.length) normalized[k] = v[0];
            else if (typeof v === "string") normalized[k] = v;
          }
          setFieldErrors(normalized);
          // prefer a banner for non-field or detail errors
          setMessage(normalized.detail || normalized.non_field_errors || "❌ Registration failed. Please check the fields.");
        } else {
          setMessage("❌ Registration failed.");
        }
        return;
      }

      setMessage("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Combine client + server errors for inputs
  const emailErrorCombined = (touched.email && emailErr) || fieldErrors.email || null;
  const phoneErrorCombined = (touched.mobile_no && phoneErr) || fieldErrors.mobile_no || null;
  const pass2ErrorCombined = (touched.password2 && passMatchErr) || fieldErrors.password2 || null;

  return (
    <div style={styles.page}>
      {/* Decorative sky + arcs */}
      <div style={styles.arcs}>
        <div style={{ ...styles.arc, width: 900, height: 900 }} />
        <div style={{ ...styles.arc, width: 1300, height: 1300 }} />
      </div>

      {/* Brand */}
      <div style={styles.brandWrap}>
        <div style={styles.brandBadge}><LogoBox /></div>
        <span style={styles.brandText}>Ebolt</span>
      </div>

      {/* Card */}
      <div style={styles.cardGlow}>
        <div style={styles.card}>
          <div style={styles.cardIconWrap}><div style={styles.cardIconCircle}><LoginIcon /></div></div>
          <h2 style={styles.title}>Create your account</h2>
          <p style={styles.subtitle}>Fast, secure sign up. Collaborate with your team in one place.</p>

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            {/* Email */}
            <FloatingInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={emailErrorCombined}
            />

            {/* Mobile */}
            <FloatingInput
              label="Mobile Number"
              name="mobile_no"
              type="tel"
              value={form.mobile_no}
              onChange={handleChange}
              onBlur={handleBlur}
              error={phoneErrorCombined}
              maxLength={10}
            />

            {/* Password */}
            <FloatingInput
              label="Password"
              name="password1"
              type={show1 ? "text" : "password"}
              value={form.password1}
              onChange={handleChange}
              onBlur={handleBlur}
              rightIcon={<EyeButton onClick={() => setShow1((s) => !s)} shown={show1} />}
              error={fieldErrors.password1}
            />

            {/* Strength meter */}
            <StrengthBar strength={strength} />

            {/* Confirm */}
            <FloatingInput
              label="Confirm Password"
              name="password2"
              type={show2 ? "text" : "password"}
              value={form.password2}
              onChange={handleChange}
              onBlur={handleBlur}
              error={pass2ErrorCombined}
              rightIcon={<EyeButton onClick={() => setShow2((s) => !s)} shown={show2} />}
            />

            {/* Photo upload (inline) */}
            <div style={{ marginTop: 14 }}>
              {!photoPreview ? (
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  style={styles.dropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <p style={{ margin: "8px 0 2px", color: "#111827", fontSize: 14, fontWeight: 600 }}>
                    Add your profile photo (optional)
                  </p>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>
                    JPG, PNG or WebP • up to {MAX_PHOTO_MB} MB
                  </p>
                  <button type="button" style={styles.pickBtn}>Choose file</button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={onFilePick}
                  />
                </div>
              ) : (
                <div style={styles.previewWrap}>
                  <img src={photoPreview} alt="preview" style={styles.previewImg} />
                  <div style={styles.previewMeta}>
                    <span style={styles.previewText}>{photoFile?.name}</span>
                    <button type="button" onClick={removePhoto} style={styles.removeBtn}>Remove</button>
                  </div>
                </div>
              )}
              {(photoError || fieldErrors[PHOTO_FIELD_NAME]) && (
                <div style={styles.errorText}>{photoError || fieldErrors[PHOTO_FIELD_NAME]}</div>
              )}
            </div>

            <button
              type="submit"
              style={{ ...styles.cta, opacity: allValid ? 1 : 0.6, cursor: allValid ? "pointer" : "not-allowed" }}
              disabled={!allValid || loading}
            >
              {loading ? <Spinner /> : "Create account"}
            </button>
          </form>

          <p style={{ fontSize: 13, marginTop: 12 }}>
            Already have an account? <a href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Sign in</a>
          </p>

          <div style={styles.dividerRow}><span style={styles.dots} /><span style={styles.muted}>Or continue with</span><span style={styles.dots} /></div>

          <div style={{ width: "100%", marginTop: 8 }}>
            <GoogleAuthButton endpoint="/auth/auth/google/" onSuccessNavigate="/dashboard" />
          </div>

          {message && <p style={styles.message}>{message}</p>}
        </div>
      </div>

      <style>{globalCss}</style>
    </div>
  );
};

/* ---------- UI Pieces ---------- */
function FloatingInput({ label, rightIcon, error, ...rest }) {
  const [focused, setFocused] = useState(false);
  const hasValue = String(rest.value || "").length > 0;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...styles.inputWrap, boxShadow: focused ? "0 0 0 4px rgba(37,99,235,0.15)" : "none", borderColor: error ? "#ef4444" : "#e5e7eb" }}>
        <label style={{ ...styles.floatingLabel, transform: hasValue || focused ? "translate(10px, -12px) scale(0.85)" : "translate(14px, 10px) scale(1)", color: error ? "#ef4444" : focused ? "#2563eb" : "#6b7280" }}>{label}</label>
        <input
          {...rest}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { rest.onBlur && rest.onBlur(e); setFocused(false); }}
          style={{ ...styles.input, paddingRight: rightIcon ? 44 : 12 }}
          aria-invalid={!!error}
          aria-describedby={error ? `${rest.name}-error` : undefined}
        />
        {rightIcon && <div style={styles.rightIcon}>{rightIcon}</div>}
      </div>
      {error && <div id={`${rest.name}-error`} style={styles.errorText}>{error}</div>}
    </div>
  );
}

function StrengthBar({ strength }) {
  const bars = [0,1,2,3];
  return (
    <div style={styles.strengthRow} aria-label="password strength">
      {bars.map((b, i) => (
        <div key={i} style={{ ...styles.strengthBar, background: i < strength.index ? strength.color : "#e5e7eb" }} />
      ))}
      <span style={styles.strengthLabel}>{strength.label}</span>
    </div>
  );
}

function EyeButton({ onClick, shown }) {
  return (
    <button type="button" onClick={onClick} style={styles.eyeBtn} aria-label={shown ? "Hide password" : "Show password"}>
      {shown ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function Spinner(){
  return (
    <div style={styles.spinner}>
      <div style={styles.spinnerDot} />
    </div>
  );
}

function LogoBox(){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#111"/>
      <path d="M8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" fill="#fff"/>
    </svg>
  );
}
function LoginIcon(){
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#111" />
      <path d="M12 7v10M8 13l4 4 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function EyeIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" stroke="#64748b" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="1.5"/>
    </svg>
  );
}
function EyeOffIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3l18 18" stroke="#64748b" strokeWidth="1.6"/>
      <path d="M10 6.3A10.8 10.8 0 0 1 12 6c6 0 10 6 10 6a18.2 18.2 0 0 1-5.1 4.86" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.1 8.5A16.3 16.3 0 0 0 2 12s4 6 10 6c1.1 0 2.16-.18 3.16-.52" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function UploadIcon(){
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 16V8m0 0l-3 3m3-3l3 3M5 16a4 4 0 01-4-4 4 4 0 014-4c.5 0 .97.09 1.41.25A6 6 0 0118 7a5 5 0 012 9.58M7 16h10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(180deg, #dff0ff 0%, #eaf5ff 30%, #f5fbff 60%, #ffffff 100%)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  },
  arcs: { position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" },
  arc: { position: "absolute", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.5)" },
  brandWrap: { position: "absolute", top: 20, left: 20, display: "flex", alignItems: "center", gap: 10 },
  brandBadge: { width: 32, height: 32, borderRadius: 8, background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.08) inset" },
  brandText: { fontWeight: 600, color: "#0b1220" },
  cardGlow: {
    padding: 10,
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(37,99,235,0.18), rgba(37,99,235,0.05))",
    boxShadow: "0 18px 55px rgba(37, 99, 235, 0.25)",
  },
  card: {
    width: 440,
    maxWidth: "calc(100vw - 32px)",
    padding: "28px 28px 22px",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.76))",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
  },
  cardIconWrap: { marginTop: 2, marginBottom: 8 },
  cardIconCircle: { width: 50, height: 50, borderRadius: 12, background: "#f2f4f7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 0 rgba(0,0,0,0.06) inset" },
  title: { fontSize: 22, margin: "10px 0 6px", color: "#0b1220", fontWeight: 700 },
  subtitle: { margin: 0, textAlign: "center", color: "#64748b", fontSize: 13.5, lineHeight: 1.45, maxWidth: 360 },

  inputWrap: { position: "relative", width: "100%", height: 54, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb", transition: "box-shadow .25s, border-color .25s" },
  floatingLabel: { position: "absolute", left: 0, top: 0, padding: "0 6px", transition: "transform .2s ease, color .2s ease", background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))", borderRadius: 6, transformOrigin: "left" },
  input: { width: "100%", height: "100%", border: "none", outline: "none", background: "transparent", padding: "18px 12px 10px", fontSize: 14, color: "#0b1220" },
  rightIcon: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" },
  eyeBtn: { border: "none", background: "transparent", cursor: "pointer", padding: 6 },

  // Photo
  dropZone: {
    border: "2px dashed #bfdbfe",
    background: "linear-gradient(180deg, #f8fbff, #ffffff)",
    borderRadius: 14,
    padding: 18,
    textAlign: "center",
    cursor: "pointer",
  },
  pickBtn: {
    marginTop: 10,
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  previewWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 10,
    background: "#fff",
  },
  previewImg: { width: 64, height: 64, objectFit: "cover", borderRadius: 12, border: "1px solid #e5e7eb" },
  previewMeta: { display: "flex", alignItems: "center", gap: 10 },
  previewText: { fontSize: 13, color: "#374151", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  removeBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #ef4444",
    background: "linear-gradient(180deg, #fee2e2, #fecaca)",
    color: "#991b1b",
    fontWeight: 700,
    cursor: "pointer",
  },

  cta: { width: "100%", height: 46, marginTop: 16, borderRadius: 12, border: "1px solid #0b0b0c", background: "linear-gradient(180deg, #2b2c30, #0f0f12)", color: "#fff", fontWeight: 700, letterSpacing: 0.2 },
  dividerRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 18, color: "#6b7280", fontSize: 12.5 },
  dots: { flex: 1, height: 1, background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 6px, transparent 6px, transparent 12px)" },
  muted: { whiteSpace: "nowrap" },
  message: { marginTop: 12, color: '#374151', fontSize: 13, textAlign: 'center' },
  strengthRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
  strengthBar: { flex: 1, height: 6, borderRadius: 6, transition: "background .25s" },
  strengthLabel: { fontSize: 12, color: "#6b7280", width: 80, textAlign: "right" },
  spinner: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, position: "relative" },
  spinnerDot: { width: 12, height: 12, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

const globalCss = `
:root { --cloud: rgba(255,255,255,0.9); }
body { margin: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* cloud blobs */
body::after {
  content: ""; position: fixed; inset: auto 0 0 0; height: 45vh; pointer-events: none;
  background:
    radial-gradient(40vw 18vh at 10% 80%, var(--cloud), transparent 60%),
    radial-gradient(38vw 18vh at 40% 90%, var(--cloud), transparent 60%),
    radial-gradient(42vw 20vh at 70% 88%, var(--cloud), transparent 60%),
    radial-gradient(40vw 18vh at 95% 85%, var(--cloud), transparent 60%);
}
`;

function passwordStrength(pwd){
  let score = 0;
  if (!pwd) return { index: 0, label: "", color: "#e5e7eb" };
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const index = Math.min(4, Math.max(1, score));
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#e5e7eb", "#ef4444", "#f59e0b", "#10b981", "#059669"];
  return { index, label: labels[index], color: colors[index] };
}

export default Register;
