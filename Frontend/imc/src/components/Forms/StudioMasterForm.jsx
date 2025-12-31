// src/components/Forms/StudioMasterForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBuilding, FaPlus, FaEye, FaTrash } from "react-icons/fa";
import "./Forms.css";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE}/auth/studio-master/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

const initial = {
  name: "",
  location: "",
  area: "",
  city: "",
  state: "",
  google_map_link: "",
  capacity: 0,
  hourly_rate: "",
  is_active: true,
};

export default function StudioMasterForm({ defaultTab = "ADD", onSaved } = {}) {
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);
  const [editingImages, setEditingImages] = useState([]);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState(null); // {src, caption, studioName}

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await api.get(API_URL, { params: q ? { search: q } : {} });
      setRows(Array.isArray(resp.data) ? resp.data : resp.data?.results || []);
    } catch (e) {
      setError("Failed to load studios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "VIEW") fetchRows();
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else if (name === "capacity") {
      setForm((f) => ({ ...f, capacity: Math.max(0, parseInt(value || "0", 10)) }));
    } else if (name === "hourly_rate") {
      setForm((f) => ({ ...f, hourly_rate: value }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const reset = () => {
    setForm(initial);
    setError("");
    setMsg("");
    setEditingId(null);
    setEditingImages([]);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    setSelectedFiles([]);
  };

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    previews.forEach((p) => URL.revokeObjectURL(p));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setSelectedFiles(files);
    setPreviews(newPreviews);
  };

  const formatServerError = (err) => {
    if (!err?.response?.data) return "Failed to save. Check required fields.";
    const data = err.response.data;
    if (typeof data === "object") {
      try {
        return Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : String(v)}`)
          .join(" | ");
      } catch {
        return JSON.stringify(data);
      }
    }
    return String(data);
  };

  const uploadImages = async (files, studioId) => {
    if (!files || files.length === 0) return null;
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    try {
      const uploadUrl = `${API_URL}${studioId}/images/`;
      const resp = await api.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchRows();
      return resp.data;
    } catch (err) {
      console.error("Image upload failed", err);
      throw err;
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");

    if (!form.name || !form.name.trim()) {
      setError("Studio name is required.");
      setSaving(false);
      return;
    }
    if (form.capacity < 0) {
      setError("Capacity must be 0 or greater.");
      setSaving(false);
      return;
    }
    if (
      form.google_map_link &&
      !(
        form.google_map_link.startsWith("http://") ||
        form.google_map_link.startsWith("https://")
      )
    ) {
      setError("Google Maps link must begin with http:// or https://");
      setSaving(false);
      return;
    }

    try {
      let locationStr = form.location?.trim() || "";
      const parts = [];
      if (form.area && form.area.trim()) parts.push(form.area.trim());
      if (form.city && form.city.trim()) parts.push(form.city.trim());
      if (form.state && form.state.trim()) parts.push(form.state.trim());
      if (parts.length) locationStr = parts.join(", ");

      const payload = {
        name: form.name?.trim(),
        location: locationStr,
        area: form.area?.trim() || "",
        city: form.city?.trim() || "",
        state: form.state?.trim() || "",
        google_map_link: form.google_map_link?.trim() || "",
        capacity: Number.isFinite(+form.capacity) ? +form.capacity : 0,
        hourly_rate: form.hourly_rate === "" ? "0" : String(form.hourly_rate),
        is_active: !!form.is_active,
      };

      let resp;

      if (editingId) {
        resp = await api.patch(`${API_URL}${editingId}/`, payload);
        setMsg(`Studio "${resp.data?.name || payload.name}" updated.`);

        if (selectedFiles.length) {
          const uploaded = await uploadImages(selectedFiles, editingId);
          if (uploaded && Array.isArray(uploaded)) {
            setEditingImages((prev) => [...prev, ...uploaded]);
          }
        } else {
          await fetchRows();
        }
      } else {
        resp = await api.post(API_URL, payload);
        const createdId = resp.data?.id;
        setMsg(`Studio "${resp.data?.name || payload.name}" created.`);

        if (selectedFiles.length && createdId) {
          await uploadImages(selectedFiles, createdId);
        } else {
          await fetchRows();
        }
      }

      reset();
      if (typeof onSaved === "function") onSaved(resp.data);
    } catch (err) {
      setError(formatServerError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id) => {
    if (!confirm("Delete this studio?")) return;
    try {
      await api.delete(`${API_URL}${id}/`);
      setRows((r) => r.filter((x) => x.id !== id));
      setMsg("Deleted.");
    } catch {
      alert("Delete failed.");
    }
  };

  const toggleActive = async (row) => {
    try {
      const resp = await api.patch(`${API_URL}${row.id}/`, {
        is_active: !row.is_active,
      });
      setRows((r) => r.map((x) => (x.id === row.id ? resp.data : x)));
      setMsg("Updated.");
    } catch {
      alert("Update failed.");
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name || "",
      location: r.location || "",
      area: r.area || "",
      city: r.city || "",
      state: r.state || "",
      google_map_link: r.google_map_link || "",
      capacity: r.capacity ?? 0,
      hourly_rate: r.hourly_rate ?? "",
      is_active: !!r.is_active,
    });
    setEditingImages(Array.isArray(r.images) ? r.images.slice() : []);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    setSelectedFiles([]);
    setTab("ADD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteImage = async (studioId, imageId) => {
    if (!confirm("Delete this image?")) return;
    try {
      await api.delete(`${API_URL}${studioId}/images/${imageId}/`);
      if (editingId && Number(editingId) === Number(studioId)) {
        setEditingImages((prev) =>
          prev.filter((img) => Number(img.id) !== Number(imageId))
        );
      }
      await fetchRows();
    } catch (err) {
      console.error(err);
      alert("Image delete failed.");
    }
  };

  const openImagePreview = (studio, img) => {
    setLightboxImg({
      src: img.url,
      caption: img.caption || "",
      studioName: studio.name || "",
    });
  };

  const closeImagePreview = () => setLightboxImg(null);

  // ===================== UI =====================
  return (
    <div className="pf-wrap studio-master-page">
      {/* Header */}
      <div className="pf-header sm-head">
        <div className="sm-left">
          <div className="sm-icon">
            <FaBuilding />
          </div>
          <div>
            <h2>Studio Master</h2>
            <div className="pf-subtitle">
              Define studios, address &amp; rates (with images)
            </div>
          </div>
        </div>

        <div className="pf-tabs sm-actions">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={() => {
              setTab("ADD");
              reset();
            }}
            type="button"
          >
            <FaPlus style={{ marginRight: 6 }} />
            {editingId ? "Add / Edit Studio" : "Add Studio"}
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
            type="button"
          >
            <FaEye style={{ marginRight: 6 }} />
            View Studios
          </button>
        </div>
      </div>

      {/* ---------------- ADD / EDIT FORM ---------------- */}
      {tab === "ADD" && (
        <form className="sm-form" onSubmit={submit}>
          <div className="grid two">
            <div className="field">
              <label>Studio Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g., IMC – Studio A"
                required
              />
            </div>

            <div className="field">
              <label>Area / Locality</label>
              <input
                name="area"
                value={form.area}
                onChange={onChange}
                placeholder="e.g., Andheri East"
              />
            </div>

            <div className="field">
              <label>City</label>
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                placeholder="e.g., Mumbai"
              />
            </div>

            <div className="field">
              <label>State</label>
              <input
                name="state"
                value={form.state}
                onChange={onChange}
                placeholder="e.g., Maharashtra"
              />
            </div>

            <div className="field">
              <label>Full Location (fallback)</label>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="Street, landmark"
              />
            </div>

            <div className="field">
              <label>Google Maps Link</label>
              <input
                name="google_map_link"
                value={form.google_map_link}
                onChange={onChange}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="field">
              <label>Capacity</label>
              <input
                type="number"
                min="0"
                name="capacity"
                value={form.capacity}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label>Hourly Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                name="hourly_rate"
                value={form.hourly_rate}
                onChange={onChange}
                placeholder="0.00"
              />
            </div>

            <div className="field switch-row">
              <label>Active</label>
              <label className="switch">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={form.is_active}
                  onChange={onChange}
                />
                <span className="slider" />
              </label>
            </div>

            {/* Existing images when editing */}
            {editingId && (
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Existing Images</label>
                {editingImages && editingImages.length > 0 ? (
                  <div className="sm-existing-images">
                    {editingImages.map((img) => (
                      <div key={img.id} className="sm-thumb-cell">
                        <img
                          src={img.url}
                          alt={img.caption || ""}
                          className="sm-thumb-img"
                          onClick={() =>
                            openImagePreview(
                              { name: form.name || "Studio" },
                              img
                            )
                          }
                        />
                        <button
                          title="Delete image"
                          type="button"
                          className="sm-thumb-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(editingId, img.id);
                          }}
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }} className="muted">
                    No images uploaded yet for this studio.
                  </div>
                )}
              </div>
            )}

            {/* New images */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Studio Images (add new)</label>
              <input type="file" multiple accept="image/*" onChange={onFilesChange} />
              <div className="image-previews">
                {previews.map((src, i) => (
                  <div key={i} className="image-previews-item">
                    <img src={src} alt={`preview-${i}`} />
                  </div>
                ))}
              </div>
              <div className="sm-help-text">
                You can select multiple images; they will be uploaded after the
                studio is saved.
              </div>
            </div>
          </div>

          <div className="status-row">
            {error && <div className="banner pf-error">{error}</div>}
            {msg && <div className="banner pf-success">{msg}</div>}
          </div>

          <div className="sm-footer">
            <div className="note muted">
              Manage studios, their address and images here. Use View to edit/delete
              records and images.
            </div>

            <div className="cta">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                className="btn outline"
                onClick={reset}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ---------------- VIEW TABLE ---------------- */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search studios..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRows()}
            />
            <button className="btn ghost" onClick={fetchRows} disabled={loading}>
              {loading ? "Refreshing..." : "Search"}
            </button>
          </div>

          <div className="pf-table-wrap">
            {loading ? (
              <div className="loader">Loading studios…</div>
            ) : (
              <table className="pf-table nice-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>LOCATION</th>
                    <th>IMAGES</th>
                    <th>CAPACITY</th>
                    <th>₹/HR</th>
                    <th>STATUS</th>
                    <th style={{ width: 220 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td-main">{r.name}</td>

                      {/* LOCATION CELL – auto adjust, wraps text nicely */}
                      <td className="sm-td-location">
                        <div className="sm-location-main">
                          {r.area || r.city || r.state
                            ? `${r.area ? r.area + ", " : ""}${
                                r.city ? r.city + ", " : ""
                              }${r.state ? r.state : ""}`
                            : r.location || "—"}
                        </div>
                        {r.google_map_link && (
                          <div className="sm-location-map">
                            <a
                              href={r.google_map_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open map
                            </a>
                          </div>
                        )}
                      </td>

                      {/* IMAGES CELL – auto layout thumbnails */}
                      <td>
                        {r.images && r.images.length > 0 ? (
                          <div className="sm-images-cell">
                            {r.images.map((img) => (
                              <div key={img.id} className="sm-thumb-cell">
                                <img
                                  src={img.url}
                                  alt={img.caption || ""}
                                  className="sm-thumb-img"
                                  onClick={() => openImagePreview(r, img)}
                                />
                                <button
                                  title="Delete image"
                                  type="button"
                                  className="sm-thumb-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteImage(r.id, img.id);
                                  }}
                                >
                                  <FaTrash size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>

                      <td>{r.capacity ?? 0}</td>
                      <td>{r.hourly_rate ?? "0.00"}</td>
                      <td>
                        <button
                          className={`chip ${r.is_active ? "ok" : "muted"}`}
                          onClick={() => toggleActive(r)}
                          type="button"
                        >
                          {r.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="mini"
                            type="button"
                            onClick={() => startEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            className="mini danger"
                            type="button"
                            onClick={() => deleteRow(r.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="muted center">
                        No studios found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX POPUP */}
      {lightboxImg && (
        <div className="sm-lightbox-backdrop" onClick={closeImagePreview}>
          <div className="sm-lightbox" onClick={(e) => e.stopPropagation()}>
            <button
              className="sm-lightbox-close"
              type="button"
              onClick={closeImagePreview}
            >
              ×
            </button>
            <img src={lightboxImg.src} alt={lightboxImg.caption || ""} />
            <div className="sm-lightbox-meta">
              <div className="title">{lightboxImg.studioName}</div>
              {lightboxImg.caption && (
                <div className="caption">{lightboxImg.caption}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
