// src/components/Forms/SingerFormPage.jsx
import React, { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import "./Forms.css";

// Fixed import path - was wrong, now correct
const AnnualFeePage = lazy(() => import("../../userDashboard/pages/AnnualFeePage"));

const BASE = import.meta?.env?.VITE_BASE_API_URL || "https://www.imcpune.in/api";
const API_URL = `${BASE.replace(/\/$/, "")}/auth/singer/`;
const FEE_API = `${BASE.replace(/\/$/, "")}/auth/annual-fees/`;

// Axios instance
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
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

// Helpers
const fmtCurrency = (x) => {
  if (x === null || x === undefined || x === "") return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === "0000-00-00" || dateStr.trim() === "") return "—";

  try {
    let parts = dateStr.split(/[-/]/);
    let day, month, year;

    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else if (parts[2]?.length === 4) {
      [day, month, year] = parts;
    } else {
      return "—";
    }

    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");
    year = year.trim();

    if (year.length !== 4 || !month || !day) return "—";

    const d = new Date(`${year}-${month}-${day}`);
    if (isNaN(d.getTime())) return "—";

    return `${day}-${month}-${year}`;
  } catch {
    return "—";
  }
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
  const [mode, setMode] = useState(initialMode === "form" ? "form" : "list");
  const [editingId, setEditingId] = useState(null);
  const [singers, setSingers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [sortOption, setSortOption] = useState("id_desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const accessToken = localStorage.getItem("access");

  useEffect(() => {
    if (!accessToken) {
      setError("You are not logged in. Please login to manage singers.");
      setMode("list");
      return;
    }
    if (mode === "list") {
      fetchSingers();
    }
  }, [accessToken, currentPage, searchText, sortOption, mode]);

  const fetchSingers = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const params = {
        search: searchText.trim() || undefined,
        page: currentPage,
        page_size: pageSize,
        ordering: sortOption === "id_asc" ? "id" : "-id",
      };

      const res = await api.get("", { params });

      let results = res.data.results || res.data || [];
      const count = res.data.count || results.length;

      if (sortOption === "name") {
        results = [...results].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      }

      setSingers(results);
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
    } catch (err) {
      console.error("fetchSingers error:", err);
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
      const encodedId = encodeURIComponent(id);
      const res = await api.get(`${encodedId}/`);
      const d = res.data.data || res.data || {};

      setForm({
        ...emptyInitial,
        name: d.name || "",
        birth_date: formatDateDDMMYYYY(d.birth_date) === "—" ? "" : formatDateDDMMYYYY(d.birth_date),
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
      console.error("loadSinger error:", err);
      setError("Failed to load singer details.");
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
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
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
      if (val !== "" && val !== null && val !== undefined) {
        if (k === "birth_date" && val) {
          fd.append(k, val);
        } else {
          fd.append(k, String(val));
        }
      }
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

    if (form.birth_date && !/^\d{2}-\d{2}-\d{4}$/.test(form.birth_date)) {
      setError("Birth date must be in DD-MM-YYYY format.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const encodedId = encodeURIComponent(editingId);
        if (form.photo instanceof File) {
          await api.put(`${encodedId}/`, buildFormData(), {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.put(`${encodedId}/`, { ...form });
        }
        alert("Singer updated successfully.");
      } else {
        if (form.photo instanceof File) {
          await api.post("", buildFormData(), {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.post("", { ...form });
        }
        alert("Singer created successfully.");
      }

      setSortOption("id_desc");
      setCurrentPage(1);
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
      const { status, data } = err?.response || {};
      if (status === 401) setError("Unauthorized — please login.");
      else if (data) setError(typeof data === "string" ? data : JSON.stringify(data));
      else setError("Save failed. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error("Invalid singer id:", id);
      alert("Invalid singer id");
      return;
    }

    if (!confirm("Are you sure you want to delete this singer?")) return;

    try {
      console.log("Deleting singer:", id); // must be IMC-SM-xxx

      // ❌ NO encodeURIComponent
      await api.delete(`${id}/`);

      await fetchSingers(); // refresh list
    } catch (err) {
      console.error("handleDelete:", err.response || err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError("Unauthorized — please login.");
      } else if (err?.response?.status === 404) {
        alert("Singer not found (check ID format).");
      } else {
        alert("Delete failed.");
      }
    }
  };


  if (!accessToken) {
    return (
      <div className="pf-wrap">
        <div className="pf-card">
          <h2>Singer Master — Authentication Required</h2>
          <p className="pf-subtitle">Please login to manage singers.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="btn" onClick={() => (window.location.href = "/login")}>
              Go to Login
            </button>
            <button className="btn ghost" onClick={fetchSingers}>
              Refresh
            </button>
          </div>
          {error && <div className="pf-banner pf-error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      {/* HEADER - Now includes Annual Fee button that loads AnnualFeePage */}
      <div className="pf-header">
        <div>
          <h2>Singer Master</h2>
          <p className="pf-subtitle">
            Manage registered singers, membership fees, and performance details
          </p>
        </div>
        <div className="pf-tabs">
          <button
            className={`pill-btn light ${mode === "form" ? "active" : ""}`}
            type="button"
            onClick={startAdd}
          >
            Add Singer
          </button>
          <button
            className={`pill-btn dark ${mode === "annual-fee" ? "active" : ""}`}
            type="button"
            onClick={() => setMode("annual-fee")}
          >
            Annual Fee
          </button>
          <button
            className={`pill-btn dark ${mode === "list" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setMode("list");
              fetchSingers();
            }}
          >
            View Singers
          </button>
        </div>
      </div>

      {error && (
        <div className="pf-banner pf-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ANNUAL FEE PAGE MODE */}
      {mode === "annual-fee" && (
        <Suspense fallback={<div className="text-center py-10">Loading Annual Fee page...</div>}>
          <AnnualFeePage />
        </Suspense>
      )}

      {/* FORM MODE */}
      {mode === "form" && (
        <form className="pf-form" onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Profile & Contact */}
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
                  placeholder="e.g. Shreya Ghoshal"
                  required
                />
              </label>
              <label>
                Birth Date (DD-MM-YYYY)
                <input
                  className="input"
                  name="birth_date"
                  type="text"
                  placeholder="16-02-2002"
                  maxLength={10}
                  pattern="\d{2}-\d{2}-\d{4}"
                  title="Format: DD-MM-YYYY"
                  value={form.birth_date}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                    if (v.length >= 2) v = v.slice(0, 2) + "-" + v.slice(2);
                    if (v.length >= 5) v = v.slice(0, 5) + "-" + v.slice(5);
                    setForm((f) => ({ ...f, birth_date: v }));
                  }}
                />
              </label>
              <label>
                Mobile Number
                <input
                  className="input"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="8830066865"
                />
              </label>
              <label>
                Gender
                <select className="input" name="gender" value={form.gender} onChange={handleChange}>
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
                  placeholder="e.g. Service, Singer"
                />
              </label>
              <label>
                Education in Music
                <input
                  className="input"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="e.g. Nil, Sangeet Prabhakar"
                />
              </label>
            </div>
          </section>

          {/* Music Details */}
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
                  placeholder="e.g. Nil, Winner of Sa Re Ga Ma Pa"
                />
              </label>
              <label>
                Favourite Singer
                <input
                  className="input"
                  name="favourite_singer"
                  value={form.favourite_singer}
                  onChange={handleChange}
                  placeholder="e.g. Mohammad Rafi, Lata Mangeshkar"
                />
              </label>
              <label>
                Genre
                <input
                  className="input"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g. Bollywood, Ghazal, Classical"
                />
              </label>
              <label>
                Experience (years)
                <input
                  className="input"
                  name="experience"
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>
              <label>
                Reference By
                <input
                  className="input"
                  name="reference_by"
                  value={form.reference_by}
                  onChange={handleChange}
                  placeholder="e.g. Ms. Rashmi Kankaria"
                />
              </label>
            </div>
          </section>

          {/* Address & Membership */}
          <section className="pf-card">
            <h3>Address & Membership</h3>
            <div className="pf-grid">
              <label>
                City
                <input className="input" name="city" value={form.city} onChange={handleChange} />
              </label>
              <label>
                State
                <input className="input" name="state" value={form.state} onChange={handleChange} />
              </label>
              <label>
                Area / Locality
                <input className="input" name="area" value={form.area} onChange={handleChange} />
              </label>
              <label>
                Annual Membership Fee (₹)
                <input
                  className="input"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </label>
              <label>
                Payment Method
                <div className="pf-methods">
                  {["Cash", "Card", "UPI"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`tag ${form.payment_method === opt ? "active" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, payment_method: opt }))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                Status
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                    />
                    <span style={{ fontWeight: 600, color: form.active ? "#15803d" : "#6b7280" }}>
                      {form.active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>
              </label>
            </div>
          </section>

          {/* Photo */}
          <section className="pf-card">
            <h3>Profile Photo</h3>
            <div className="pf-grid">
              <label>
                Singer Photo
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                  />
                  <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    {form.photo instanceof File
                      ? form.photo.name
                      : form.photo
                      ? "Existing photo"
                      : "No photo selected"}
                  </span>
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  )}
                </div>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="pf-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setForm(emptyInitial);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setEditingId(null);
                setMode("list");
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Singer" : "Create Singer"}
            </button>
          </div>
        </form>
      )}

      {/* LIST MODE */}
      {mode === "list" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="pf-search"
                placeholder="Search by name, mobile, city, id..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSingers()}
              />
              <button className="btn danger" onClick={fetchSingers}>
                Search
              </button>


              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="sort-select"
              >
                <option value="id_desc">Newest first</option>
                <option value="id_asc">Oldest first</option>
                <option value="name">Name A→Z</option>
              </select>
            </div>

            <div className="pf-table-meta">
              {loadingList
                ? "Loading singers..."
                : `${totalCount} singer${totalCount !== 1 ? "s" : ""} • Page ${currentPage} of ${totalPages}`}
            </div>
          </div>

          {/* Table and pagination unchanged */}
          <div className="pf-table-wrap">
            <table className="pf-table responsive-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Photo</th>
                  <th>Birth Date</th>
                  <th>Mobile</th>
                  <th>Profession</th>
                  <th>Education</th>
                  <th>Achievement</th>
                  <th>Fav. Singer</th>
                  <th>Reference</th>
                  <th>Genre</th>
                  <th>City</th>
                  <th>Fee (₹)</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="c">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan={16} className="text-center py-8">
                      Loading singers...
                    </td>
                  </tr>
                ) : singers.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-10 text-gray-500">
                      No singers found. Use "+ Add Singer" to register one.
                    </td>
                  </tr>
                ) : (
                  singers.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-orange-700">{s.id || "—"}</td>
                      <td>
                        <div className="font-medium">{s.name || "—"}</div>
                        {s.area && <div className="text-xs text-gray-500">{s.area}</div>}
                      </td>
                      <td>
                        {s.photo ? (
                          <img src={safeImageUrl(s.photo)} alt={s.name} className="thumb" />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{formatDateDDMMYYYY(s.birth_date)}</td>
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
                        <span className={`chip ${s.active ? "chip-success" : "chip-muted"}`}>
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="mini" onClick={() => loadSinger(s.id)}>
                          Edit
                        </button>
                        <button className="mini danger" onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loadingList && totalCount > 0 && (
            <div className="pagination">
              <button
                className="btn ghost"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                <small style={{ marginLeft: 12 }}>({totalCount} total)</small>
              </span>

              <button
                className="btn ghost"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}