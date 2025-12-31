// src/components/Forms/VideographyForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

/**
 * VideographyForm:
 * ✅ Add / View tabs
 * ✅ Search + pagination
 * ✅ Payment Method as tag buttons
 * ✅ Event Type dropdown with "Other" → extra name field
 */

const BASE_API = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const CANDIDATE_API_URLS = [
  `${BASE_API}/auth/videography/`,
  `${BASE_API}/videography/`,
  `${BASE_API}//videography-bookings/`,
];
const PAGE_SIZE = 10;

// Event types for dropdown
const eventTypes = [
  "theatre music events",
  "private music events",
  "Birthday",
  "Other",
];

const initialForm = {
  client_name: "",
  email: "",
  mobile_no: "",
  project: "", // Event / project name
  editor: "",
  shoot_date: "",
  start_time: "",
  duration_hours: 2,
  location: "",
  event_type: "",        // dropdown
  other_event_name: "",  // shown only when event_type === "Other"
  package_type: "Standard",
  package_price: "",
  payment_method: "Cash",
  notes: "",
};

const packageOptions = ["Standard", "Premium", "Custom"];
const methodOptions = ["Cash", "Card", "UPI"];

const VideographyForm = ({ onClose, viewOnly = false }) => {
  const [tab, setTab] = useState(viewOnly ? "VIEW" : "ADD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [resolvedURL, setResolvedURL] = useState(CANDIDATE_API_URLS[0]);
  const [urlChecked, setUrlChecked] = useState(false);

  const token = useMemo(() => localStorage.getItem("access"), []);
  const headers = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ---------- Resolve endpoint once ----------
  const resolveApiUrl = async () => {
    for (const u of CANDIDATE_API_URLS) {
      try {
        const r = await axios.get(u, { headers });
        if (r.status === 200) {
          setResolvedURL(u);
          setUrlChecked(true);
          return;
        }
      } catch (_) {
        // try next
      }
    }
    setUrlChecked(true);
  };

  useEffect(() => {
    resolveApiUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Fetch ----------
  const fetchRows = async () => {
    if (!urlChecked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(resolvedURL, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRows(data);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? `404: ${resolvedURL} not found. Check backend router (api/urls.py).`
          : err?.response?.data?.detail ||
              err?.message ||
              "Failed to load videography bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "VIEW" && urlChecked) fetchRows();
  }, [tab, urlChecked, resolvedURL]);

  // ---------- Handlers ----------
  const onChange = (e) => {
    const { name, value, type } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const toggleMethod = (m) => {
    setForm((s) => ({
      ...s,
      payment_method: s.payment_method === m ? "" : m,
    }));
  };

  const validate = () => {
    if (!form.project?.trim()) return "Project / Event name is required.";
    if (!form.editor?.trim()) return "Editor is required.";
    if (!form.shoot_date) return "Shoot date is required.";

    const d = Number(form.duration_hours);
    if (Number.isNaN(d) || d <= 0) return "Duration (hours) must be greater than 0.";

    if (!form.payment_method) return "Select a payment method.";

    // Extra validation for "Other" type
    if (form.event_type === "Other") {
      if (!form.other_event_name.trim()) {
        return "Please enter event name for 'Other' type.";
      }
    }

    return null;
  };

  const buildPayload = () => {
    // ✅ send event_type & other_event_name to backend (model has fields)
    const payload = {
      ...form,
      duration_hours: Number(form.duration_hours) || 0,
      start_time: form.start_time || null,
    };

    // If not "Other", clear the other_event_name
    if (payload.event_type !== "Other") {
      payload.other_event_name = "";
    }

    // If event_type empty, also clear other_event_name
    if (!payload.event_type) {
      payload.other_event_name = "";
    }

    return payload;
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await axios.put(`${resolvedURL}${editingId}/`, payload, { headers });
        setSuccessMsg("Videography booking updated.");
      } else {
        await axios.post(resolvedURL, payload, { headers });
        setSuccessMsg("Videography booking created.");
      }
      resetForm();
      if (tab === "VIEW") fetchRows();
      else setTab("VIEW");
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? `404: ${resolvedURL} not found. Backend route missing.`
          : typeof err?.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : err?.response?.data?.detail || err?.message || "Failed to save booking."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setTab("ADD");

    setForm({
      ...initialForm,
      client_name: row.client_name || row.client || "",
      email: row.email || "",
      mobile_no: row.mobile_no || row.contact_number || "",
      project: row.project || "",
      editor: row.editor || "",
      shoot_date: row.shoot_date || row.date || "",
      start_time: row.start_time || "",
      duration_hours: row.duration_hours ?? 2,
      location: row.location || "",
      // ✅ load from backend
      event_type: row.event_type || "",
      other_event_name: row.other_event_name || "",
      package_type: row.package_type || "Standard",
      package_price: row.package_price || "",
      payment_method: row.payment_method || "Cash",
      notes: row.notes || "",
    });
  };

  const onDelete = async (row) => {
    if (
      !confirm(
        `Delete videography booking for ${
          row.project || row.client_name || "this client"
        }?`
      )
    )
      return;
    try {
      await axios.delete(`${resolvedURL}${row.id}/`, { headers });
      setRows((s) => s.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? `404: ${resolvedURL}${row.id}/ not found.`
          : err?.response?.data?.detail || "Delete failed."
      );
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.project || ""} ${r.editor || ""} ${
        r.client_name || r.client || ""
      } ${r.email || ""} ${r.mobile_no || r.contact_number || ""} ${
        r.location || ""
      } ${r.package_type || ""} ${r.payment_method || ""} ${r.notes || ""} ${
        r.event_type || ""
      } ${r.other_event_name || ""}`
        .toLowerCase()
        .trim();
      return hay.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // helper to display event type nicely
  const renderEventTypeCell = (row) => {
    if (!row.event_type) return "-";
    if (row.event_type === "Other") {
      return row.other_event_name
        ? `Other – ${row.other_event_name}`
        : "Other";
    }
    return row.event_type;
  };

  // ---------- UI ----------
  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <h2>Videography Service</h2>
        <div className="pf-tabs">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={() => setTab("ADD")}
          >
            Add Booking
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
          >
            View Bookings
          </button>
        </div>
      </div>

      {error && <div className="pf-banner pf-error">{error}</div>}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}

      {tab === "ADD" && (
        <form className="pf-form" onSubmit={onSubmit}>
          {/* CLIENT & PROJECT */}
          <section className="pf-card">
            <h3>Client & Project</h3>
            <div className="pf-grid">
              <label>
                Client Name
                <input
                  name="client_name"
                  value={form.client_name}
                  onChange={onChange}
                  placeholder="Full name"
                />
              </label>
              <label>
                Mobile
                <input
                  name="mobile_no"
                  value={form.mobile_no}
                  onChange={onChange}
                  placeholder="98765 43210"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="client@email.com"
                />
              </label>

              <label>
                Project / Event Name*
                <input
                  name="project"
                  value={form.project}
                  onChange={onChange}
                  placeholder="Wedding film, music video..."
                  required
                />
              </label>

              <label>
                Editor*
                <input
                  name="editor"
                  value={form.editor}
                  onChange={onChange}
                  placeholder="Editor name"
                  required
                />
              </label>

              {/* EVENT TYPE + OTHER NAME */}
              <label>
                Event Type
                <select
                  name="event_type"
                  value={form.event_type}
                  onChange={onChange}
                >
                  <option value="">Select event type</option>
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              {form.event_type === "Other" && (
                <label>
                  Other Event Name*
                  <input
                    name="other_event_name"
                    value={form.other_event_name}
                    onChange={onChange}
                    placeholder="e.g. Corporate launch, TV promo..."
                  />
                </label>
              )}

              <label>
                Package
                <select
                  name="package_type"
                  value={form.package_type}
                  onChange={onChange}
                >
                  {packageOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Package Price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="package_price"
                  value={form.package_price}
                  onChange={onChange}
                  placeholder="e.g. 20000"
                />
              </label>
            </div>
          </section>

          {/* SCHEDULE */}
          <section className="pf-card">
            <h3>Schedule</h3>
            <div className="pf-grid">
              <label>
                Shoot Date*
                <input
                  type="date"
                  name="shoot_date"
                  value={form.shoot_date}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Start Time
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={onChange}
                />
              </label>
              <label>
                Duration (hours)*
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  name="duration_hours"
                  value={form.duration_hours}
                  onChange={onChange}
                  placeholder="e.g. 2"
                  required
                />
              </label>
              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  placeholder="Studio / On-location"
                />
              </label>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="pf-card">
            <h3>Payment Method</h3>
            <div className="pf-methods">
              <div className="pf-tags">
                {methodOptions.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={form.payment_method === m ? "tag active" : "tag"}
                    onClick={() => toggleMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* NOTES */}
          <section className="pf-card">
            <h3>Notes</h3>
            <div className="pf-grid">
              <label className="pf-notes-label">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  placeholder="Any special requirements, deliverables, style preferences..."
                />
              </label>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pf-actions">
            <button className="btn" disabled={saving}>
              {editingId
                ? saving
                  ? "Updating..."
                  : "Update Booking"
                : saving
                ? "Saving..."
                : "Create Booking"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={resetForm}
              disabled={saving}
            >
              Reset
            </button>
            {onClose && (
              <button
                type="button"
                className="btn ghost"
                onClick={onClose}
                disabled={saving}
              >
                Close
              </button>
            )}
          </div>
        </form>
      )}

      {/* VIEW TABLE */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search project, editor, client, email, phone, location, event type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" onClick={fetchRows} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Event Type</th>
                  <th>Editor</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Package</th>
                  <th>Payment</th>
                  <th className="c">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.project || "-"}</td>
                    <td>{renderEventTypeCell(r)}</td>
                    <td>{r.editor || "-"}</td>
                    <td>{r.client_name || r.client || "-"}</td>
                    <td>{r.shoot_date || r.date || "-"}</td>
                    <td>{r.duration_hours ?? "-"}</td>
                    <td>
                      {r.package_type || "-"}
                      {r.package_price ? ` (₹${r.package_price})` : ""}
                    </td>
                    <td>{r.payment_method || "-"}</td>
                    <td className="c">
                      <button className="mini" onClick={() => onEdit(r)}>
                        Edit
                      </button>
                      <button
                        className="mini danger"
                        onClick={() => onDelete(r)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!pageRows.length && (
                  <tr>
                    <td colSpan="9" className="c muted">
                      {loading ? "Loading..." : "No records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pf-pager">
            <button
              className="mini"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              className="mini"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideographyForm;
