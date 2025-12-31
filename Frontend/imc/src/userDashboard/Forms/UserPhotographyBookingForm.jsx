// src/userDashboard/Forms/UserPhotographyBookingForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";


/**
 * UserPhotographyBookingForm – user-facing:
 * - Uses /user/photography-bookings/ endpoint
 * - Matches PhotographyBooking model fields
 * - Keeps your advanced UI (tabs + table)
 */

const BASE_API =
  import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

const API_URL = `${BASE_API}/user/photography-bookings/`;
const PAGE_SIZE = 10;

// Form state (aligned with backend model)
const initialForm = {
  client: "",
  email: "",
  contact_number: "",
  event_type: "Wedding",
  event_type_other: "",
  date: "",
  start_time: "",
  duration_hours: 2,
  location: "",
  city: "",
  package_type: "Standard",
  num_photographers: 1,
  need_videography: false,
  need_album: false,
  need_drone: false,
  budget_range: "",
  notes: "",
  payment_method: "",

  // UI-only extras (merged into notes on submit)
  addon_name: "",
  addon_price: "",
};

const methodOptions = ["Cash", "Card", "UPI"];
const eventTypes = [
  "Wedding",
  "Pre-wedding",
  "Birthday",
  "Corporate",
  "Portfolio",
  "Family",
  "Other",
];
const packages = ["Standard", "Premium", "Custom"];

const UserPhotographyBookingForm = ({ onClose, viewOnly = false }) => {
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

  const token = useMemo(() => localStorage.getItem("access"), []);
  const headers = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ---------- Fetch all bookings for this user ----------
  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRows(data);
    } catch (err) {
      console.error("Photography bookings fetch error:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load photography bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "VIEW") fetchRows();
  }, [tab]);

  // ---------- Handlers ----------
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? !!checked : value,
    }));
  };

  // Single payment method selection
  const toggleMethod = (m) => {
    setForm((s) => ({
      ...s,
      payment_method: s.payment_method === m ? "" : m,
    }));
  };

  const validate = () => {
    if (!form.client?.trim()) return "Client name is required.";
    if (!form.contact_number?.trim()) return "Mobile number is required.";
    if (!form.date) return "Event date is required.";
    if (!form.start_time) return "Start time is required.";
    if (!form.location?.trim()) return "Location is required.";
    if (!form.payment_method) return "Select a payment method.";

    if (form.event_type === "Other" && !form.event_type_other.trim()) {
      return 'Please specify "Other" event type.';
    }
    return null;
  };

  // Build payload matching PhotographyBooking model
  const buildPayload = () => {
    const payload = {
      client: form.client,
      email: form.email,
      contact_number: form.contact_number,
      event_type:
        form.event_type === "Other" && form.event_type_other
          ? form.event_type_other
          : form.event_type,
      date: form.date,
      start_time: form.start_time,
      duration_hours: form.duration_hours,
      location: form.location,
      city: form.city,
      package_type: form.package_type,
      num_photographers: form.num_photographers,
      need_videography: form.need_videography,
      need_album: form.need_album,
      need_drone: form.need_drone,
      budget_range: form.budget_range,
      notes: form.notes,
      payment_method: form.payment_method,
    };

    // Merge addon info into notes (so backend doesn’t need extra fields)
    if (form.addon_name || form.addon_price) {
      const addonText = `Add-on: ${form.addon_name || ""} ${
        form.addon_price ? `(₹${form.addon_price})` : ""
      }`.trim();
      payload.notes = payload.notes
        ? `${payload.notes}\n${addonText}`
        : addonText;
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
        await axios.put(`${API_URL}${editingId}/`, payload, { headers });
        setSuccessMsg("Booking updated.");
      } else {
        await axios.post(API_URL, payload, { headers });
        setSuccessMsg("Booking created.");
      }
      resetForm();
      if (tab === "VIEW") fetchRows();
      else setTab("VIEW");
    } catch (err) {
      console.error("Photography booking save error:", err);
      setError(
        typeof err?.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : err?.response?.data?.detail ||
              err?.message ||
              "Failed to save booking."
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
      client: row.client || "",
      email: row.email || "",
      contact_number: row.contact_number || "",
      event_type: row.event_type || "Wedding",
      event_type_other: "", // cannot know original "Other" vs predefined
      date: row.date || "",
      start_time: row.start_time || "",
      duration_hours: row.duration_hours ?? 2,
      location: row.location || "",
      city: row.city || "",
      package_type: row.package_type || "Standard",
      num_photographers: row.num_photographers ?? 1,
      need_videography: !!row.need_videography,
      need_album: !!row.need_album,
      need_drone: !!row.need_drone,
      budget_range: row.budget_range || "",
      notes: row.notes || "",
      payment_method: row.payment_method || "",
      addon_name: "",
      addon_price: "",
    });
  };

  const onDelete = async (row) => {
    if (!confirm(`Delete booking for ${row.client}?`)) return;
    try {
      await axios.delete(`${API_URL}${row.id}/`, { headers });
      setRows((s) => s.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err?.response?.status === 404
          ? `404: ${API_URL}${row.id}/ not found.`
          : err?.response?.data?.detail || "Delete failed."
      );
    }
  };

  // Search + pagination
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.client || ""} ${r.contact_number || ""} ${r.email || ""} ${
        r.event_type || ""
      } ${r.location || ""} ${r.city || ""} ${r.package_type || ""} ${
        r.budget_range || ""
      } ${r.notes || ""}`
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

  // For table display
  const displayEvent = (r) => r.event_type || "-";

  const displayPayment = (r) => r.payment_method || "-";

  // ---------- UI ----------
  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <h2>Photography Service</h2>
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

      {/* ADD / EDIT FORM */}
      {tab === "ADD" && (
        <form className="pf-form" onSubmit={onSubmit}>
          <section className="pf-card">
            <h3>Client & Event</h3>
            <div className="pf-grid">
              <label>
                Client Name*
                <input
                  name="client"
                  value={form.client}
                  onChange={onChange}
                  placeholder="Full name"
                  required
                />
              </label>
              <label>
                Mobile*
                <input
                  name="contact_number"
                  value={form.contact_number}
                  onChange={onChange}
                  placeholder="98765 43210"
                  required
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
                Event Type
                <select
                  name="event_type"
                  value={form.event_type}
                  onChange={onChange}
                >
                  {eventTypes.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>

              {form.event_type === "Other" && (
                <label>
                  Other Event Type
                  <input
                    name="event_type_other"
                    value={form.event_type_other}
                    onChange={onChange}
                    placeholder="Describe event"
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
                  {packages.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Budget Range (₹)
                <input
                  name="budget_range"
                  value={form.budget_range}
                  onChange={onChange}
                  placeholder="e.g. ₹20,000 – ₹40,000"
                />
              </label>
            </div>
          </section>

          <section className="pf-card">
            <h3>Schedule & Location</h3>
            <div className="pf-grid">
              <label>
                Event Date*
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Start Time*
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Duration (hours)
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  name="duration_hours"
                  value={form.duration_hours}
                  onChange={onChange}
                />
              </label>
              <label>
                Location (Venue)*
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  placeholder="Venue / Address"
                  required
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  placeholder="e.g. Jaipur"
                />
              </label>
              <label>
                Number of photographers
                <input
                  type="number"
                  min="1"
                  name="num_photographers"
                  value={form.num_photographers}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          <section className="pf-card">
            <h3>Requirements & Add-ons</h3>
            <div className="pf-grid">
              <label className="pf-checkbox">
                <input
                  type="checkbox"
                  name="need_videography"
                  checked={form.need_videography}
                  onChange={onChange}
                />
                <span>Also need videography</span>
              </label>
              <label className="pf-checkbox">
                <input
                  type="checkbox"
                  name="need_album"
                  checked={form.need_album}
                  onChange={onChange}
                />
                <span>Printed album</span>
              </label>
              <label className="pf-checkbox">
                <input
                  type="checkbox"
                  name="need_drone"
                  checked={form.need_drone}
                  onChange={onChange}
                />
                <span>Drone coverage</span>
              </label>
            </div>

            <div className="pf-grid">
              <label>
                Add-on Name (optional)
                <input
                  name="addon_name"
                  value={form.addon_name}
                  onChange={onChange}
                  placeholder="e.g. Extra album, reels, drone..."
                />
              </label>
              <label>
                Add-on Price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="addon_price"
                  value={form.addon_price}
                  onChange={onChange}
                  placeholder="e.g. 3000"
                />
              </label>
            </div>

            <label>
              Extra details / notes
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={onChange}
                placeholder="Important moments to cover, specific shots, references, etc."
              />
            </label>
          </section>

          {/* Payment Method */}
          <section className="pf-card">
            <h3>Payment Method</h3>
            <div className="pf-methods">
              <div className="pf-tags">
                {methodOptions.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={
                      form.payment_method === m ? "tag active" : "tag"
                    }
                    onClick={() => toggleMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </section>

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
        placeholder="Search client, contact_number, email, event, location, package..."
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
            <th>Client</th>
            <th>Event</th>
            <th>Date</th>
            <th>Location</th>
            <th>Package</th>
            <th>Budget</th>
            <th>Payment</th>
            <th className="c">Actions</th>
          </tr>
        </thead>

        <tbody>
          {pageRows.map((r) => (
            <tr key={r.id}>
              <td>{r.client}</td>
              <td>{displayEvent(r)}</td>
              <td>{r.date}</td>
              <td>{r.location}</td>

              {/* PACKAGE */}
              <td>{r.package_type || "-"}</td>

              {/* BUDGET (from package_price) */}
              <td>
                {r.package_price
                  ? `₹${Number(r.package_price).toLocaleString()}`
                  : "-"}
              </td>

              {/* PAYMENT (from payment_methods_list) */}
              <td>
                {Array.isArray(r.payment_methods_list) &&
                r.payment_methods_list.length > 0
                  ? r.payment_methods_list.join(", ")
                  : "-"}
              </td>

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
              <td colSpan="8" className="c muted">
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

export default UserPhotographyBookingForm;
