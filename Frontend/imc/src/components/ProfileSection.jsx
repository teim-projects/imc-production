import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileSection = () => {
  const navigate = useNavigate();
  const BASE = useMemo(() => (import.meta.env.VITE_BASE_API_URL || "").replace(/\/+$/, ""), []);

  // ------------ state ------------
  const [user, setUser] = useState({
    full_name: "",
    email: "",
    mobile_no: "",
    profile_photo: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarVersion, setAvatarVersion] = useState(Date.now()); // ← new: force reload new photo
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // ------------ helpers ------------
  const notify = (type, text) => setMessage({ type, text });
  const clearMessage = () => setMessage(null);

  const bearer = () => {
    const token = localStorage.getItem("access");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const toAbsolute = (maybeUrl) => {
    if (!maybeUrl) return "";
    const s = String(maybeUrl);
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("/")) return `${BASE}${s}`;
    return `${BASE}/${s}`;
  };

  const splitName = (full) => {
    const s = (full || "").trim().replace(/\s+/g, " ");
    if (!s) return { first_name: "", last_name: "" };
    const parts = s.split(" ");
    return { first_name: parts.shift() || "", last_name: parts.join(" ") };
  };

  const validateLocal = () => {
    const e = {};
    if (!user.full_name.trim()) e.full_name = "Full name is required.";
    if (user.mobile_no && !/^\+?\d{7,15}$/.test(user.mobile_no.trim())) {
      e.mobile_no = "Enter a valid phone (7–15 digits, optional +).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ------------ fetch user ------------
  const fetchUserData = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    clearMessage();
    setErrors({});

    try {
      const res = await fetch(`${BASE}/auth/dj-rest-auth/user/`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...bearer() },
      });

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile.");

      const data = await res.json();
      const full = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();

      setUser({
        full_name: full,
        email: data.email || "",
        mobile_no: data.mobile_no || "",
        profile_photo: data.profile_photo || data.photo || "",
      });

      // Reset version on fresh load
      setAvatarVersion(Date.now());
    } catch (err) {
      console.error("Fetch user error:", err);
      notify("error", "Could not load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------ save ------------
  const handleSave = async (e) => {
    e.preventDefault();
    clearMessage();
    setErrors((x) => ({ ...x, api: null }));

    if (!validateLocal()) {
      notify("error", "Please fix validation errors.");
      return;
    }
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);
    try {
      const { first_name, last_name } = splitName(user.full_name);
      let res, data;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("first_name", first_name);
        formData.append("last_name", last_name);
        // Removed: formData.append("photo", avatarFile);
        formData.append("profile_photo", avatarFile);
        if (user.mobile_no?.trim()) formData.append("mobile_no", user.mobile_no.trim());

        res = await fetch(`${BASE}/auth/dj-rest-auth/user/`, {
          method: "PATCH",
          headers: { ...bearer() },
          body: formData,
        });
      } else {
        const payload = { first_name, last_name };
        if (user.mobile_no?.trim()) payload.mobile_no = user.mobile_no.trim();

        res = await fetch(`${BASE}/auth/dj-rest-auth/user/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...bearer() },
          body: JSON.stringify(payload),
        });
      }

      try { data = await res.json(); } catch { data = {}; }

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        const fieldErrs = {};
        if (data && typeof data === "object") {
          for (const [k, v] of Object.entries(data)) {
            if (Array.isArray(v) && v.length) fieldErrs[k] = v[0];
            else if (typeof v === "string") fieldErrs[k] = v;
          }
        }
        setErrors((prev) => ({ ...prev, ...fieldErrs }));
        notify("error", fieldErrs.detail || fieldErrs.non_field_errors || "Failed to update profile.");
        return;
      }

      const fullNew = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
      const newPhoto = data.profile_photo || data.photo || user.profile_photo;

      setUser((prev) => ({
        ...prev,
        full_name: fullNew || prev.full_name,
        mobile_no: data.mobile_no ?? prev.mobile_no,
        profile_photo: newPhoto,
      }));

      // Critical: force new photo to load if we uploaded one
      if (avatarFile && newPhoto) {
        setAvatarVersion(Date.now() + 1); // small bump to ensure change
      }

      if (avatarFile) {
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }

      notify("success", "Profile updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      notify("error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setErrors((e) => ({ ...e, profile_photo: "Please choose an image file (png, jpg, webp)." }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrors((e) => ({ ...e, profile_photo: "Max file size is 3MB." }));
      return;
    }
    setErrors((e) => ({ ...e, profile_photo: null }));
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    fetchUserData();
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  }, []);

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-card">
          <div className="profile-header">
            <div className="skeleton-title" />
          </div>
          <div className="profile-body">
            <div className="skeleton-avatar" />
            <div className="skeleton-field" />
            <div className="skeleton-field" />
            <div className="skeleton-field" />
            <div className="skeleton-buttons" />
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = avatarPreview || (user.profile_photo ? `${toAbsolute(user.profile_photo)}?v=${avatarVersion}` : "");

  return (
    <div className="profile-shell">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div>
            <h2 className="profile-title">👤 Profile</h2>
            <p className="profile-subtitle">Manage your account details</p>
          </div>
          <button type="button" onClick={handleLogout} className="btn-danger" title="Logout">
            Logout
          </button>
        </div>

        {/* Toast */}
        {message && (
          <div role="alert" className={`toast ${message.type}`}>
            {message.text}
            <button onClick={clearMessage} className="toast-close" aria-label="Close">×</button>
          </div>
        )}

        {/* Form */}
        <form className="profile-form" onSubmit={handleSave} noValidate>
          <div className="avatar-section">
            <div className="avatar-wrap">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">IMC</div>
              )}
            </div>

            <label htmlFor="avatar" className="btn-light">
              Upload Photo
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onAvatarChange(e.target.files?.[0])}
              style={{ display: "none" }}
            />

            {avatarPreview && (
              <button type="button" onClick={removeAvatar} className="btn-ghost">
                Remove
              </button>
            )}

            <p className="hint">PNG / JPG / WebP • max 3 MB</p>
            {errors.profile_photo && <span className="error-text">{errors.profile_photo}</span>}
          </div>

          <div className="form-fields">
            <div className="field">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                value={user.full_name}
                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                placeholder="Your full name"
                className={`input ${errors.full_name ? "input-error" : ""}`}
              />
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </div>

            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="input readonly"
              />
              <span className="hint">Email cannot be changed</span>
            </div>

            <div className="field">
              <label className="field-label">Mobile Number</label>
              <input
                type="text"
                value={user.mobile_no}
                onChange={(e) => {
                  setUser({ ...user, mobile_no: e.target.value });
                  if (errors.mobile_no) setErrors((x) => ({ ...x, mobile_no: null }));
                }}
                placeholder="+91 9876543210"
                className={`input ${errors.mobile_no ? "input-error" : ""}`}
              />
              {errors.mobile_no && <span className="error-text">{errors.mobile_no}</span>}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" className="btn-ghost" onClick={fetchUserData} disabled={saving}>
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .profile-shell {
          padding: 1.5rem 1rem;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          background: #f8faff;
        }

        .profile-card {
          width: 100%;
          max-width: 960px;
          background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88));
          border: 1px solid rgba(10,44,86,0.14);
          border-radius: 16px;
          box-shadow: 0 12px 36px rgba(10,44,86,0.09);
          overflow: hidden;
          backdrop-filter: blur(8px);
        }

        .profile-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.2rem 1.5rem;
          background: linear-gradient(90deg, #0a2c56, #ff6f3c 65%, #ffd23f);
          color: white;
        }

        .profile-title {
          margin: 0;
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .profile-subtitle {
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          opacity: 0.92;
        }

        .profile-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .avatar-wrap {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #ffd23f;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f8faff, #eef4ff);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          font-size: 2.6rem;
          font-weight: 900;
          color: #0a2c56;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-weight: 700;
          margin-bottom: 0.45rem;
          color: #0a2c56;
          font-size: 0.95rem;
        }

        .input {
          padding: 0.8rem 1rem;
          border: 1px solid #d1ddea;
          border-radius: 10px;
          font-size: 1rem;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-shadow: inset 0 1px 4px rgba(13,38,76,0.04);
        }

        .input:focus {
          outline: none;
          border-color: #00b4d8;
          box-shadow: 0 0 0 3px rgba(0,180,216,0.18);
        }

        .input-error {
          border-color: #ff6b6b;
          box-shadow: 0 0 0 3px rgba(255,107,107,0.16);
        }

        .readonly {
          background: #f5f8ff;
          color: #4b5e7a;
          cursor: not-allowed;
        }

        .hint {
          font-size: 0.82rem;
          color: #6b7a90;
          margin-top: 0.4rem;
        }

        .error-text {
          color: #e63946;
          font-size: 0.84rem;
          margin-top: 0.35rem;
        }

        .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-primary,
        .btn-light,
        .btn-ghost,
        .btn-danger {
          padding: 0.75rem 1.4rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.98rem;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 120px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0077b6, #00b4d8);
          color: white;
          border: none;
          box-shadow: 0 6px 14px rgba(0,123,255,0.22);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(0,123,255,0.28);
        }

        .btn-light {
          background: linear-gradient(135deg, #ffd23f, #ffb703);
          color: #0a2c56;
          border: none;
          margin: 0.5rem 0;
        }

        .btn-ghost {
          background: transparent;
          color: #0a2c56;
          border: 1.5px solid rgba(10,44,86,0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ff4d4d, #ff6f6f);
          color: white;
          border: none;
        }

        .toast {
          margin: 1rem 1.5rem;
          padding: 0.9rem 1.2rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .toast.success {
          background: rgba(0, 184, 148, 0.14);
          color: #006d5b;
          border: 1px solid rgba(0,184,148,0.3);
        }

        .toast.error {
          background: rgba(255, 87, 87, 0.14);
          color: #c53030;
          border: 1px solid rgba(255,87,87,0.3);
        }

        .toast-close {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.4rem;
          cursor: pointer;
          padding: 0 0.5rem;
        }

        /* Skeleton */
        .skeleton-title,
        .skeleton-avatar,
        .skeleton-field,
        .skeleton-buttons {
          background: linear-gradient(90deg, #eef3fa, #f8fbff, #eef3fa);
          background-size: 200% 100%;
          animation: skeleton-loading 1.4s infinite;
          border-radius: 8px;
        }

        .skeleton-title { height: 1.4rem; width: 60%; }
        .skeleton-avatar { width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 1rem; }
        .skeleton-field { height: 3.2rem; }
        .skeleton-buttons { height: 3rem; width: 100%; }

        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Mobile adjustments ──────────────────────────────────────── */
        @media (max-width: 640px) {
          .profile-shell { padding: 1rem 0.8rem; }
          .profile-card { border-radius: 14px; }
          .profile-header { padding: 1rem; flex-direction: column; align-items: flex-start; gap: 0.8rem; }
          .profile-title { font-size: 1.35rem; }
          .profile-form { padding: 1.2rem; gap: 1.8rem; }
          .avatar-wrap { width: 120px; height: 120px; }
          .form-actions { flex-direction: column; }
          .btn-primary, .btn-ghost { width: 100%; padding: 0.9rem; }
        }

        @media (min-width: 641px) {
          .profile-form {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 2.5rem;
          }
          .avatar-section {
            flex: 0 0 260px;
            border-right: 1px dashed rgba(10,44,86,0.16);
            padding-right: 1.5rem;
          }
          .form-fields {
            flex: 1;
            max-width: 580px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileSection;