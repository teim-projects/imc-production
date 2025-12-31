// src/components/Forms/EventsForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE}/auth/events/`;

// Small axios client that injects JWT if present
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Reusable time slot options
const TIME_SLOT_OPTIONS = [
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
];

const EventsForm = ({ onClose }) => {
  const [tab, setTab] = useState("ADD");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    time_slot: "",
    event_type: "",
    // ⭐ seats (total & available)
    total_seats: "",
    available_seats: "",
    // prices
    ticket_price: "",
    basic_price: "",
    premium_price: "",
    vip_price: "",
    // ⭐ seats per tier
    basic_seats: "",
    premium_seats: "",
    vip_seats: "",
    description: "",
  });

  // ---------------- Helpers ----------------
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

  const toast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 1800);
  };

  const clearStatus = () => {
    setError(null);
    setSuccess("");
  };

  // ---------------- Fetch ----------------
  const fetchEvents = async () => {
    setLoading(true);
    clearStatus();
    try {
      const res = await api.get(API_URL);
      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.results ?? res.data ?? [];
      setEvents(Array.isArray(rows) ? rows : []);
      const totalPagesAfter = Math.max(
        1,
        Math.ceil((rows?.length || 0) / pageSize)
      );
      if (page > totalPagesAfter) setPage(totalPagesAfter);
    } catch (err) {
      setError(humanizeErr(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Form handlers ----------------
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const setEventType = (type) => {
    setFormData((prev) => ({
      ...prev,
      event_type: prev.event_type === type ? "" : type, // toggle
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      date: "",
      time_slot: "",
      event_type: "",
      total_seats: "",
      available_seats: "",
      ticket_price: "",
      basic_price: "",
      premium_price: "",
      vip_price: "",
      basic_seats: "",
      premium_seats: "",
      vip_seats: "",
      description: "",
    });
    setEditingId(null);
  };

  const validatePrice = (val, fieldLabel) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    if (Number.isNaN(num) || num < 0) return `${fieldLabel} must be 0 or more.`;
    return null;
  };

  const validateSeats = () => {
    // total / available
    if (formData.total_seats === "" || formData.total_seats === null) {
      return "Total seats is required.";
    }
    const total = Number(formData.total_seats);
    if (Number.isNaN(total) || total < 0) {
      return "Total seats must be 0 or more.";
    }

    let avail;
    if (formData.available_seats === "" || formData.available_seats === null) {
      avail = total; // backend will also default
    } else {
      avail = Number(formData.available_seats);
      if (Number.isNaN(avail) || avail < 0) {
        return "Available seats must be 0 or more.";
      }
    }
    if (avail > total) {
      return "Available seats cannot be more than total seats.";
    }

    // per-tier seats
    const basicSeats =
      formData.basic_seats === "" || formData.basic_seats === null
        ? 0
        : Number(formData.basic_seats);
    const premiumSeats =
      formData.premium_seats === "" || formData.premium_seats === null
        ? 0
        : Number(formData.premium_seats);
    const vipSeats =
      formData.vip_seats === "" || formData.vip_seats === null
        ? 0
        : Number(formData.vip_seats);

    if (basicSeats < 0 || Number.isNaN(basicSeats)) {
      return "Basic seats must be 0 or more.";
    }
    if (premiumSeats < 0 || Number.isNaN(premiumSeats)) {
      return "Premium seats must be 0 or more.";
    }
    if (vipSeats < 0 || Number.isNaN(vipSeats)) {
      return "VIP seats must be 0 or more.";
    }

    const tierSum = basicSeats + premiumSeats + vipSeats;
    if (tierSum > total) {
      return "Sum of Basic + Premium + VIP seats cannot exceed total seats.";
    }

    return null;
  };

  const validate = () => {
    if (!formData.title?.trim()) return "Title is required.";
    if (!formData.location?.trim()) return "Location is required.";
    if (!formData.date?.trim()) return "Date is required.";
    if (!formData.time_slot?.trim()) return "Time slot is required.";
    if (!formData.event_type) return "Event type is required (Live or Karaoke).";

    const seatsErr = validateSeats();
    if (seatsErr) return seatsErr;

    const basePriceErr = validatePrice(
      formData.ticket_price === "" ? 0 : formData.ticket_price,
      "Ticket price"
    );
    if (basePriceErr) return basePriceErr;

    const basicErr = validatePrice(formData.basic_price, "Basic price");
    if (basicErr) return basicErr;

    const premiumErr = validatePrice(formData.premium_price, "Premium price");
    if (premiumErr) return premiumErr;

    const vipErr = validatePrice(formData.vip_price, "VIP price");
    if (vipErr) return vipErr;

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearStatus();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);

    const totalSeatsNum = Number(formData.total_seats || 0);
    const availableSeatsNum =
      formData.available_seats === "" || formData.available_seats === null
        ? totalSeatsNum
        : Number(formData.available_seats);

    const payload = {
      ...formData,
      total_seats: totalSeatsNum,
      available_seats: availableSeatsNum,
      ticket_price:
        formData.ticket_price === "" ? "0" : String(Number(formData.ticket_price)),
      basic_price:
        formData.basic_price === "" ? null : String(Number(formData.basic_price)),
      premium_price:
        formData.premium_price === "" ? null : String(Number(formData.premium_price)),
      vip_price:
        formData.vip_price === "" ? null : String(Number(formData.vip_price)),
      basic_seats:
        formData.basic_seats === "" ? null : Number(formData.basic_seats),
      premium_seats:
        formData.premium_seats === "" ? null : Number(formData.premium_seats),
      vip_seats:
        formData.vip_seats === "" ? null : Number(formData.vip_seats),
    };

    try {
      if (editingId) {
        await api.put(`${API_URL}${editingId}/`, payload);
        toast("✅ Event updated successfully!");
      } else {
        await api.post(API_URL, payload);
        toast("✅ Event added successfully!");
      }
      await fetchEvents();
      resetForm();
      setTab("VIEW");
    } catch (err) {
      setError(humanizeErr(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev) => {
    setFormData({
      title: ev.title || "",
      location: ev.location || "",
      date: ev.date || "",
      time_slot: ev.time_slot || "",
      event_type: ev.event_type || "",
      total_seats: ev.total_seats ?? "",
      available_seats: ev.available_seats ?? "",
      ticket_price: ev.ticket_price ?? "",
      basic_price: ev.basic_price ?? "",
      premium_price: ev.premium_price ?? "",
      vip_price: ev.vip_price ?? "",
      basic_seats: ev.basic_seats ?? "",
      premium_seats: ev.premium_seats ?? "",
      vip_seats: ev.vip_seats ?? "",
      description: ev.description || "",
    });
    setEditingId(ev.id);
    setTab("ADD");
    clearStatus();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`${API_URL}${id}/`);
      const after = events.length - 1;
      const pages = Math.max(1, Math.ceil(after / pageSize));
      if (page > pages) setPage(pages);
      await fetchEvents();
      toast("🗑️ Deleted");
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  // ---------------- Derived ----------------
  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.location || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q)
    );
  }, [events, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search]);

  const renderEventTypeLabel = (type) => {
    if (type === "live") return "Live";
    if (type === "karaoke") return "Karaoke";
    return "-";
  };

  // ---------------- UI (pf style) ----------------
  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Events (Live & Karaoke)</h2>
          <p className="pf-subtitle">
            Create and manage music events with seats and multiple ticket tiers.
          </p>
        </div>
        <div className="pf-tabs">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={() => setTab("ADD")}
            type="button"
          >
            Add Event
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
            type="button"
          >
            View Events
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
      {success && <div className="pf-banner pf-success">{success}</div>}
      {error && (
        <pre className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}

      {/* ADD FORM */}
      {tab === "ADD" && (
        <form onSubmit={handleSubmit} className="pf-form">
          {/* 1) EVENT DETAILS */}
          <section className="pf-card">
            <h3>Event Details</h3>
            <div className="pf-grid">
              <label>
                Event Title*
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Music Fest 2025"
                  required
                />
              </label>

              <label>
                Location*
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Mumbai / Delhi / Bangalore"
                  required
                />
              </label>

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
                Time Slot*
                <select
                  name="time_slot"
                  value={formData.time_slot}
                  onChange={handleChange}
                >
                  <option value="">-- Select Time Slot --</option>
                  {TIME_SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Event Type*
                <div className="pf-methods">
                  <div className="pf-tags">
                    <button
                      type="button"
                      className={
                        formData.event_type === "live" ? "tag active" : "tag"
                      }
                      onClick={() => setEventType("live")}
                    >
                      Live
                    </button>
                    <button
                      type="button"
                      className={
                        formData.event_type === "karaoke"
                          ? "tag active"
                          : "tag"
                      }
                      onClick={() => setEventType("karaoke")}
                    >
                      Karaoke
                    </button>
                  </div>
                </div>
              </label>

              {/* ⭐ Seats */}
              <label>
                Total Seats*
                <input
                  type="number"
                  min="0"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleChange}
                  placeholder="100"
                />
              </label>

              <label>
                Available Seats
                <input
                  type="number"
                  min="0"
                  name="available_seats"
                  value={formData.available_seats}
                  onChange={handleChange}
                  placeholder="Leave blank to use total seats"
                />
              </label>

              <label>
                Base Ticket Price (₹)*
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="ticket_price"
                  value={formData.ticket_price}
                  onChange={handleChange}
                  placeholder="500"
                />
              </label>
            </div>
          </section>

          {/* 2) TICKET TIERS */}
          <section className="pf-card">
            <h3>Ticket Tiers</h3>
            <div className="tier-grid pretty-tiers">
              {/* BASIC */}
              <div className="tier-card tier-basic">
                <div className="tier-header">
                  <span className="tier-name">Basic</span>
                  <span className="tier-badge">Popular</span>
                </div>
                <div className="tier-sub">Good for single entry</div>
                <div className="tier-price-row">
                  <span className="tier-currency">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="basic_price"
                    value={formData.basic_price}
                    onChange={handleChange}
                    placeholder="799"
                    className="tier-input"
                  />
                  <span className="tier-suffix">/ person</span>
                </div>
                <div className="tier-seat-row">
                  <span className="tier-seat-label">Seats</span>
                  <input
                    type="number"
                    min="0"
                    name="basic_seats"
                    value={formData.basic_seats}
                    onChange={handleChange}
                    placeholder="e.g. 40"
                    className="tier-input small"
                  />
                </div>
              </div>

              {/* PREMIUM */}
              <div className="tier-card tier-premium">
                <div className="tier-header">
                  <span className="tier-name">Premium</span>
                  <span className="tier-badge highlight">Best value</span>
                </div>
                <div className="tier-sub">Better seats & perks</div>
                <div className="tier-price-row">
                  <span className="tier-currency">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="premium_price"
                    value={formData.premium_price}
                    onChange={handleChange}
                    placeholder="1499"
                    className="tier-input"
                  />
                  <span className="tier-suffix">/ person</span>
                </div>
                <div className="tier-seat-row">
                  <span className="tier-seat-label">Seats</span>
                  <input
                    type="number"
                    min="0"
                    name="premium_seats"
                    value={formData.premium_seats}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    className="tier-input small"
                  />
                </div>
              </div>

              {/* VIP */}
              <div className="tier-card tier-vip">
                <div className="tier-header">
                  <span className="tier-name">VIP</span>
                  <span className="tier-badge">Exclusive</span>
                </div>
                <div className="tier-sub">Front row + backstage</div>
                <div className="tier-price-row">
                  <span className="tier-currency">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="vip_price"
                    value={formData.vip_price}
                    onChange={handleChange}
                    placeholder="2499"
                    className="tier-input"
                  />
                  <span className="tier-suffix">/ person</span>
                </div>
                <div className="tier-seat-row">
                  <span className="tier-seat-label">Seats</span>
                  <input
                    type="number"
                    min="0"
                    name="vip_seats"
                    value={formData.vip_seats}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="tier-input small"
                  />
                </div>
              </div>
            </div>
            <p className="hint">
              Leave any tier blank if you don&apos;t offer that option. Seat
              counts across tiers should not exceed total seats.
            </p>
          </section>

          {/* 3) DESCRIPTION */}
          <section className="pf-card">
            <h3>Description</h3>
            <div className="pf-grid">
              <label className="pf-notes-label">
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short event details..."
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
                ? "Update Event"
                : "Save Event"}
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
              Editing Event <strong>#{editingId}</strong>
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
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" onClick={fetchEvents} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="loader">Loading events...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No events found.</div>
          ) : (
            <>
              <div className="pf-table-wrap">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Seats</th>
                      <th>Type / Ticket Prices</th>
                      <th>Description</th>
                      <th className="c">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((ev) => (
                      <tr key={ev.id}>
                        <td>{ev.title}</td>
                        <td>{ev.location}</td>
                        <td>{ev.date}</td>
                        <td>{ev.time_slot || "-"}</td>
                        <td>
                          <div>Total: {ev.total_seats ?? 0}</div>
                          <div>Available: {ev.available_seats ?? 0}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {ev.basic_seats != null && (
                              <div>Basic: {ev.basic_seats}</div>
                            )}
                            {ev.premium_seats != null && (
                              <div>Premium: {ev.premium_seats}</div>
                            )}
                            {ev.vip_seats != null && (
                              <div>VIP: {ev.vip_seats}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{renderEventTypeLabel(ev.event_type)}</strong>
                          </div>
                          {ev.ticket_price !== undefined &&
                            ev.ticket_price !== null && (
                              <div>General: ₹ {ev.ticket_price}</div>
                            )}
                          {ev.basic_price && <div>Basic: ₹ {ev.basic_price}</div>}
                          {ev.premium_price && (
                            <div>Premium: ₹ {ev.premium_price}</div>
                          )}
                          {ev.vip_price && <div>VIP: ₹ {ev.vip_price}</div>}
                        </td>
                        <td>{ev.description || "-"}</td>
                        <td className="c">
                          <button
                            className="mini"
                            onClick={() => handleEdit(ev)}
                            disabled={saving}
                          >
                            Edit
                          </button>
                          <button
                            className="mini danger"
                            onClick={() => handleDelete(ev.id)}
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

export default EventsForm;
