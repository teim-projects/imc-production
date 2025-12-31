// src/components/Forms/PrivateBookingForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

const BASE = import.meta.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_PATH = `${BASE}/auth/private-bookings/`;

// axios client with JWT (access) from localStorage
const axiosClient = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PrivateBookingForm = ({ onClose, viewOnly = false }) => {
  // ---------- UI State ----------
  const [tab, setTab] = useState(viewOnly ? "VIEW" : "ADD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // ---------- Data ----------
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ---------- Filters / Search / Pagination ----------
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // ---------- Form ----------
  const emptyForm = {
    customer: "",
    contact_number: "",
    email: "",
    address: "",
    event_type: "",
    venue: "",
    date: "",
    time_slot: "",
    duration: "",
    guest_count: "",
    notes: "",
    payment_methods: [],
  };
  const [formData, setFormData] = useState(emptyForm);

  // ---------- Helpers ----------
  const humanizeErr = (err) => {
    const data = err?.response?.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const key = Object.keys(data)[0];
      const val = data[key];
      if (Array.isArray(val)) return `${key}: ${val[0]}`;
      if (typeof val === "string") return `${key}: ${val}`;
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
      }
    }
    return err?.message || "Unknown error";
  };

  const clearStatus = () => {
    setError(null);
    setSuccessMsg("");
  };

  const toast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 1800);
  };

  // ---------- Fetch ----------
  const fetchRows = async () => {
    setLoading(true);
    clearStatus();
    try {
      const { data } = await axiosClient.get(API_PATH);
      const list = Array.isArray(data) ? data : data?.results ?? data ?? [];
      const safeList = Array.isArray(list) ? list : [];
      setRows(safeList);
      const totalPagesAfter = Math.max(
        1,
        Math.ceil((safeList.length || 0) / pageSize)
      );
      if (page > totalPagesAfter) setPage(totalPagesAfter);
    } catch (err) {
      setError(humanizeErr(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Derived ----------
  const filtered = useMemo(() => {
    let r = [...rows];
    if (dateFilter) r = r.filter((x) => x.date === dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          (x.customer || "").toLowerCase().includes(q) ||
          (x.event_type || "").toLowerCase().includes(q) ||
          (x.venue || "").toLowerCase().includes(q) ||
          (x.email || "").toLowerCase().includes(q) ||
          (x.contact_number || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, search, dateFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => setPage(1), [search, dateFilter]);

  // ---------- Form handlers ----------
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handlePaymentChange = (method) => {
    setFormData((prev) => {
      const set = new Set(prev.payment_methods);
      if (set.has(method)) set.delete(method);
      else set.add(method);
      return { ...prev, payment_methods: Array.from(set) };
    });
  };

  const handleEdit = (row) => {
    setTab("ADD");
    setEditingId(row.id);
    setFormData({
      customer: row.customer || "",
      contact_number: row.contact_number || "",
      email: row.email || "",
      address: row.address || "",
      event_type: row.event_type || "",
      venue: row.venue || "",
      date: row.date || "",
      time_slot: row.time_slot || "",
      duration: row.duration ?? "",
      guest_count:
        row.guest_count === 0 || row.guest_count ? Number(row.guest_count) : "",
      notes: row.notes || "",
      payment_methods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
    });
    clearStatus();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    clearStatus();
    try {
      await axiosClient.delete(`${API_PATH}${id}/`);
      const after = rows.length - 1;
      const pages = Math.max(1, Math.ceil(after / pageSize));
      if (page > pages) setPage(pages);
      setRows((prev) => prev.filter((x) => x.id !== id));
      toast("🗑️ Deleted");
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const validate = () => {
    if (!formData.customer?.trim()) return "Customer is required.";
    if (!formData.event_type?.trim()) return "Event type is required.";
    if (!formData.venue?.trim()) return "Venue is required.";
    if (!formData.date?.trim()) return "Date is required.";
    const d = Number(formData.duration);
    if (Number.isNaN(d) || d <= 0) return "Duration must be greater than 0.";
    if (formData.guest_count !== "" && Number(formData.guest_count) < 1)
      return "Guest count must be at least 1.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearStatus();

    const v = validate();
    if (v) return setError(v);

    const payload = {
      ...formData,
      duration: Number(formData.duration),
      time_slot: formData.time_slot ? formData.time_slot : null,
      guest_count: formData.guest_count === "" ? null : Number(formData.guest_count),
      payment_methods: Array.isArray(formData.payment_methods)
        ? formData.payment_methods
        : [],
    };

    setSaving(true);
    try {
      if (editingId) {
        await axiosClient.put(`${API_PATH}${editingId}/`, payload);
        toast("✅ Booking updated");
      } else {
        await axiosClient.post(API_PATH, payload);
        toast("✅ Booking added");
      }
      await fetchRows();
      resetForm();
      setTab("VIEW");
    } catch (err) {
      setError(humanizeErr(err));
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Private Music Events</h2>
          <p className="pf-subtitle">
            Manage private bookings like birthdays, weddings, and corporate parties.
          </p>
        </div>
        <div className="pf-tabs">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={() => setTab("ADD")}
            type="button"
          >
            Add Booking
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
            type="button"
          >
            View Bookings
          </button>
          {onClose && (
            <button
              type="button"
              className="btn ghost"
              style={{ marginLeft: 8 }}
              onClick={onClose}
              aria-label="Close"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* BANNERS */}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}
      {error && (
        <pre className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}

      {/* ADD FORM */}
      {tab === "ADD" && (
        <form onSubmit={handleSubmit} className="pf-form">
          {/* 1) CUSTOMER DETAILS */}
          <section className="pf-card">
            <h3>Customer Details</h3>
            <div className="pf-grid">
              <label>
                Customer Name*
                <input
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  placeholder="e.g., Rahul Verma"
                  required
                />
              </label>

              <label>
                Contact Number
                <input
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@email.com"
                />
              </label>

              <label>
                Address
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, City"
                />
              </label>
            </div>
          </section>

          {/* 2) EVENT DETAILS */}
          <section className="pf-card">
            <h3>Event Details</h3>
            <div className="pf-grid">
              <label>
                Event Type*
                <input
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  placeholder="Birthday / Wedding / Corporate / Private Party"
                  required
                />
              </label>

              <label>
                Venue*
                <input
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="IMC Banquet Hall / Client Venue"
                  required
                />
              </label>

              <label>
                Guest Count
                <input
                  type="number"
                  min="1"
                  name="guest_count"
                  value={formData.guest_count}
                  onChange={handleChange}
                  placeholder="e.g., 120"
                />
              </label>
            </div>
          </section>

          {/* 3) SCHEDULE */}
          <section className="pf-card">
            <h3>Schedule</h3>
            <div className="pf-grid">
              <label>
                Date*
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Time
                <input
                  type="time"
                  name="time_slot"
                  value={formData.time_slot}
                  onChange={handleChange}
                />
              </label>

              <label>
                Duration (hours)*
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 3"
                  required
                />
              </label>
            </div>
          </section>

          {/* 4) PAYMENT & NOTES */}
          <section className="pf-card">
            <h3>Payment & Notes</h3>
            <div className="pf-grid">
              <label>
                Payment Options
                <div className="pf-methods">
                  <div className="pf-tags">
                    {["Card", "UPI", "NetBanking"].map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={
                          formData.payment_methods.includes(m)
                            ? "tag active"
                            : "tag"
                        }
                        onClick={() => handlePaymentChange(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </label>

              <label className="pf-notes-label">
                Special Notes
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special arrangements, artist requirements, A/V setup, etc."
                  rows={3}
                />
              </label>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pf-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                ? "Update Booking"
                : "Save Booking"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={resetForm}
              disabled={saving}
            >
              Reset
            </button>
          </div>

          {editingId && (
            <div className="pf-hint">
              Editing booking <strong>#{editingId}</strong>
            </div>
          )}
        </form>
      )}

      {/* VIEW TABLE */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search: customer, event, venue, email, phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="date"
              className="pf-search"
              style={{ maxWidth: 180 }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <button className="btn" onClick={fetchRows} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="loader">Loading bookings…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No bookings found.</div>
          ) : (
            <>
              <div className="pf-table-wrap">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Event</th>
                      <th>Venue</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Guests</th>
                      <th>Payment</th>
                      <th className="c">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((b) => (
                      <tr key={b.id}>
                        <td>{b.customer || "-"}</td>
                        <td>{b.event_type || "-"}</td>
                        <td>{b.venue || "-"}</td>
                        <td>{b.date || "-"}</td>
                        <td>{b.time_slot || "-"}</td>
                        <td>{b.duration || "-"}</td>
                        <td>
                          {b.guest_count === 0 || b.guest_count
                            ? b.guest_count
                            : "-"}
                        </td>
                        <td>
                          {Array.isArray(b.payment_methods) &&
                          b.payment_methods.length
                            ? b.payment_methods.join(", ")
                            : "-"}
                        </td>
                        <td className="c">
                          <button
                            className="mini"
                            onClick={() => handleEdit(b)}
                            disabled={saving}
                          >
                            Edit
                          </button>
                          <button
                            className="mini danger"
                            onClick={() => handleDelete(b.id)}
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pf-pager">
                <button
                  className="mini"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  className="mini"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateBookingForm;
