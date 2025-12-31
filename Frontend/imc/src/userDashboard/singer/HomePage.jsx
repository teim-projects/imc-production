// src/components/Forms/SingerFormPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";


const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE.replace(/\/$/, "")}/auth/singers/`;

// -------------------- AXIOS INSTANCE --------------------
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access");
  if (token)
    cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      alert("Session expired or not authenticated. Redirecting to login.");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// helpers
const fmtCurrency = (x) => {
  if (x === null || x === undefined || x === "") return "0.00";
  const n = Number(x);
  if (Number.isNaN(n)) return x;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const safeImageUrl = (url) => {
  if (!url) return null;
  try {
    return new URL(url).href;
  } catch {
    return BASE.replace(/\/$/, "") + (url.startsWith("/") ? url : `/${url}`);
  }
};

export default function SingerFormPage({ initialMode = "list" }) {
  const emptyInitial = {
    name: "",
    birth_date: "",
    mobile: "",
    profession: "",
    education: "",
    achievement: "",
    favourite_singer: "",
    reference_by: "",
    genre: "",
    experience: "",
    area: "",
    city: "",
    state: "",
    rate: "",
    gender: "",
    payment_method: "Cash",
    active: true,
    photo: null,
  };

  const [form, setForm] = useState(emptyInitial);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState(initialMode === "form" ? "form" : "list"); // 'form' | 'list'
  const [editingId, setEditingId] = useState(null);

  const [singers, setSingers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  const accessToken = localStorage.getItem("access");

  useEffect(() => {
    if (!accessToken) {
      setError("You are not logged in. Please login to manage singers.");
      setMode("list");
      return;
    }
    fetchSingers();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchSingers = async (query) => {
    setLoadingList(true);
    setError(null);
    try {
      const params = {};
      if (query || searchText) params.search = query ?? searchText;
      const res = await api.get("", { params });
      setSingers(Array.isArray(res.data) ? res.data : res.data.results || []);
      setMode("list");
    } catch (err) {
      console.error("fetchSingers:", err);
      setError(
        err?.response?.status === 401
          ? "Unauthorized. Please login."
          : "Failed to load singers."
      );
    } finally {
      setLoadingList(false);
    }
  };

  const loadSinger = async (id) => {
    setError(null);
    try {
      const res = await api.get(`${id}/`);
      const d = res.data;
      setForm({
        name: d.name || "",
        birth_date: d.birth_date || "",
        mobile: d.mobile || "",
        profession: d.profession || "",
        education: d.education || "",
        achievement: d.achievement || "",
        favourite_singer: d.favourite_singer || "",
        reference_by: d.reference_by || "",
        genre: d.genre || "",
        experience: d.experience ?? "",
        area: d.area || "",
        city: d.city || "",
        state: d.state || "",
        rate: d.rate ?? "",
        gender: d.gender || "",
        payment_method: d.payment_method || "Cash",
        active: typeof d.active === "boolean" ? d.active : true,
        photo: d.photo || null,
      });
      setPreview(d.photo ? safeImageUrl(d.photo) : null);
      setEditingId(id);
      setMode("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("loadSinger:", err);
      setError("Failed to load singer.");
    }
  };

  const startAdd = () => {
    setForm(emptyInitial);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setEditingId(null);
    setMode("form");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") setForm((f) => ({ ...f, [name]: checked }));
    else setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, photo: file }));
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.keys(form).forEach((k) => {
      if (k === "photo") return;
      const val = form[k];
      fd.append(k, val === null || val === undefined ? "" : String(val));
    });
    if (form.photo instanceof File) fd.append("photo", form.photo);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!accessToken) {
      setError("You must be logged in to create or update singers.");
      return;
    }
    if (!form.name.trim()) {
      setError("Singer name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        if (form.photo instanceof File) {
          await api.put(`${editingId}/`, buildFormData(), {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          const payload = { ...form };
          if (typeof payload.photo === "string" || payload.photo === null)
            delete payload.photo;
          await api.put(`${editingId}/`, payload);
        }
        alert("Singer updated.");
      } else {
        if (form.photo instanceof File) {
          await api.post("", buildFormData(), {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.post("", form);
        }
        alert("Singer created.");
      }
      await fetchSingers();
      setForm(emptyInitial);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      setEditingId(null);
      setMode("list");
    } catch (err) {
      console.error("handleSubmit:", err);
      if (err?.response) {
        const { status, data } = err.response;
        if (status === 401) setError("Unauthorized — please login.");
        else if (data)
          setError(typeof data === "string" ? data : JSON.stringify(data));
        else setError("Save failed. See console for details.");
      } else {
        setError("Save failed. See console for details.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this singer?")) return;
    try {
      await api.delete(`${id}/`);
      await fetchSingers();
    } catch (err) {
      console.error("handleDelete:", err);
      if (err?.response?.status === 401)
        setError("Unauthorized — please login.");
      else alert("Delete failed.");
    }
  };

  // ------------- NOT LOGGED IN -------------
  if (!accessToken) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h2>Singer Master — Sign in required</h2>
          <p className="pf-subtitle">
            You must be logged in to create, update or delete singers.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Login
            </button>
            <button className="btn ghost" onClick={() => fetchSingers()}>
              Try to refresh
            </button>
          </div>
          {error && (
            <div className="pf-banner pf-error" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------------- MAIN UI -------------
  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Singer Master</h2>
          <p className="pf-subtitle">
            Manage registered singers, membership fee, and performance details.
          </p>
        </div>
        <div className="pf-tabs">
          <button
            className={mode === "form" ? "active" : ""}
            type="button"
            onClick={startAdd}
          >
            Add Singer
          </button>
          <button
            className={mode === "list" ? "active" : ""}
            type="button"
            onClick={() => fetchSingers()}
          >
            View Singers
          </button>
        </div>
      </div>

      {error && (
        <div className="pf-banner pf-error" style={{ marginBottom: 12 }}>
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* FORM MODE */}
      {mode === "form" && (
        <form
          className="pf-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          {/* PROFILE & CONTACT */}
          <section className="pf-card">
            <h3>Profile & Contact</h3>
            <div className="pf-grid">
              <label>
                Singer Name*
                <input
                  className="input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Arijit Singh"
                  required
                />
              </label>

              <label>
                Birth Date
                <input
                  className="input"
                  name="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                Mobile Number
                <input
                  className="input"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="+919876543210"
                />
              </label>

              <label>
                Gender
                <select
                  className="input"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Profession
                <input
                  className="input"
                  name="profession"
                  value={form.profession}
                  onChange={handleChange}
                  placeholder="e.g., Playback Singer"
                />
              </label>

              <label>
                Education in Music
                <input
                  className="input"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="e.g., Trinity Grade 8"
                />
              </label>
            </div>
          </section>

          {/* MUSIC DETAILS */}
          <section className="pf-card">
            <h3>Music Details</h3>
            <div className="pf-grid">
              <label>
                Special Achievement
                <input
                  className="input"
                  name="achievement"
                  value={form.achievement}
                  onChange={handleChange}
                  placeholder="e.g., National award"
                />
              </label>

              <label>
                Favourite Singer
                <input
                  className="input"
                  name="favourite_singer"
                  value={form.favourite_singer}
                  onChange={handleChange}
                  placeholder="e.g., Lata Mangeshkar"
                />
              </label>

              <label>
                Genre
                <input
                  className="input"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g., Pop"
                />
              </label>

              <label>
                Experience (years)
                <input
                  className="input"
                  name="experience"
                  type="number"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="5"
                />
              </label>

              <label>
                Reference By
                <input
                  className="input"
                  name="reference_by"
                  value={form.reference_by}
                  onChange={handleChange}
                  placeholder="Referrer name"
                />
              </label>
            </div>
          </section>

          {/* ADDRESS & MEMBERSHIP */}
          <section className="pf-card">
            <h3>Address & Membership</h3>
            <div className="pf-grid">
              <label>
                City
                <input
                  className="input"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                />
              </label>

              <label>
                State
                <input
                  className="input"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                />
              </label>

              <label>
                Area / Locality
                <input
                  className="input"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="Area / Locality"
                />
              </label>

              <label>
                Annual Membership Fee (₹)
                <input
                  className="input"
                  name="rate"
                  type="number"
                  step="0.01"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </label>

              <label>
                Payment Method
                <div className="pf-methods">
                  <div className="pf-tags">
                    {["Cash", "Card", "UPI"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={
                          form.payment_method === opt ? "tag active" : "tag"
                        }
                        onClick={() =>
                          setForm((f) => ({ ...f, payment_method: opt }))
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </label>

              <label>
                Status
                <div style={{ marginTop: 8 }}>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, active: e.target.checked }))
                      }
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        color: form.active ? "#0d7a42" : "#6b7280",
                      }}
                    >
                      {form.active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>
              </label>
            </div>
          </section>

          {/* PHOTO */}
          <section className="pf-card">
            <h3>Profile Photo</h3>
            <div className="pf-grid">
              <label>
                Singer Photo
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    id="photo-file-main"
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                  />
                  <div style={{ fontSize: 13 }}>
                    {form.photo?.name ||
                      (typeof form.photo === "string" && form.photo
                        ? "Existing photo"
                        : "No file chosen")}
                  </div>
                  {preview && (
                    <img
                      src={preview}
                      alt="preview"
                      style={{
                        width: 84,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}
                </div>
              </label>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pf-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setForm(emptyInitial);
                if (preview) {
                  URL.revokeObjectURL(preview);
                  setPreview(null);
                }
                setEditingId(null);
                setMode("list");
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn" type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Singer"
                : "Create Singer"}
            </button>
          </div>
        </form>
      )}

      {/* LIST MODE */}
      {mode === "list" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="pf-search"
                placeholder="Search singers..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchSingers(searchText);
                }}
              />
              <button
                className="btn"
                type="button"
                onClick={() => fetchSingers(searchText)}
              >
                Search
              </button>
            </div>
            <div className="pf-table-meta">
              {loadingList ? "Loading..." : `${singers.length} singers`}
            </div>
          </div>

          <div className="pf-table-wrap">
            <table className="pf-table responsive-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Birth Date</th>
                  <th>Mobile</th>
                  <th>Profession</th>
                  <th>Education</th>
                  <th>Achievement</th>
                  <th>Fav Singer</th>
                  <th>Reference</th>
                  <th>Genre</th>
                  <th>City</th>
                  <th>Annual Fee</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="c">Actions</th>
                </tr>
              </thead>
              <tbody>
                {singers.map((s) => (
                  <tr key={s.id}>
                    <td className="td-name">
                      <div className="name-strong">{s.name}</div>
                      {s.area ? (
                        <div className="muted small">{s.area}</div>
                      ) : null}
                    </td>
                    <td>
                      {s.photo ? (
                        <img
                          src={safeImageUrl(s.photo)}
                          alt={s.name}
                          className="thumb"
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{s.birth_date || "—"}</td>
                    <td>{s.mobile || "—"}</td>
                    <td>{s.profession || "—"}</td>
                    <td>{s.education || "—"}</td>
                    <td>{s.achievement || "—"}</td>
                    <td>{s.favourite_singer || "—"}</td>
                    <td>{s.reference_by || "—"}</td>
                    <td>{s.genre || "—"}</td>
                    <td>{s.city || "—"}</td>
                    <td>₹ {fmtCurrency(s.rate)}</td>
                    <td>{s.payment_method || "—"}</td>
                    <td>
                      <span className={`chip ${s.active ? "ok" : "muted"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="c">
                      <button
                        className="mini"
                        type="button"
                        onClick={() => loadSinger(s.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="mini danger"
                        type="button"
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {singers.length === 0 && !loadingList && (
                  <tr>
                    <td
                      colSpan={15}
                      style={{
                        padding: 28,
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      No singers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
