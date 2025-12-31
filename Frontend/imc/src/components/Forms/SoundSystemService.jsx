// src/components/Forms/SoundSystemService.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE}/auth/sound/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token)
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  return config;
});

// util
const toInt = (v) => (v === "" || v == null ? 0 : parseInt(v, 10) || 0);
const toMoney = (v) => (v === "" || v == null ? "0" : String(Number(v) || 0));
const normPayment = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (s === "upi") return "UPI";
  if (s === "card") return "Card";
  return "Cash";
};

// options
const SYSTEM_OPTIONS = [
  "DJ Sound System",
  "PA Sound System",
  "Live Band Setup",
  "Conference Audio System",
  "Outdoor Concert Setup",
  "Indoor Event System",
  "Corporate Sound Setup",
  "Wedding Sound Package",
  "Stage Performance Setup",
  "Custom Hybrid Sound",
];

export default function SoundSystemService() {
  const [tab, setTab] = useState("VIEW"); // ADD | VIEW
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // search + paging (client-side)
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    client_name: "",
    email: "",
    mobile_no: "",
    event_date: "",
    location: "",
    system_type: "",
    speakers_count: "",
    microphones_count: "",
    mixer_model: "",
    price: "",
    payment_method: "Cash",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ================= API =================
  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`${API_URL}?page_size=1000`);
      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setRows(Array.isArray(list) ? list : []);
      setPage(1);
    } catch (e) {
      setErr("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const save = async () => {
    const payload = {
      client_name: (form.client_name || "").trim() || "Unnamed",
      email: (form.email || "").trim() || null,
      mobile_no: (form.mobile_no || "").trim() || null,
      event_date: (form.event_date || "").trim() || null,
      location: (form.location || "").trim() || null,
      system_type: (form.system_type || "").trim() || null,
      speakers_count: toInt(form.speakers_count),
      microphones_count: toInt(form.microphones_count),
      mixer_model: (form.mixer_model || "").trim() || null,
      price: toMoney(form.price),
      payment_method: normPayment(form.payment_method),
      notes: (form.notes || "").trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`${API_URL}${editingId}/`, payload);
        setMsg("Updated successfully ✅");
      } else {
        await api.post(API_URL, payload);
        setMsg("Saved successfully ✅");
      }
      await fetchAll();
      reset();
      setTab("VIEW");
    } catch (e) {
      setErr(
        "Save failed: " + JSON.stringify(e?.response?.data || e.message)
      );
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await api.delete(`${API_URL}${id}/`);
      await fetchAll();
    } catch (e) {
      setErr(
        "Delete failed: " + JSON.stringify(e?.response?.data || e.message)
      );
    }
  };

  // ================= UI helpers =================
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.client_name, r.email, r.mobile_no, r.system_type, r.location, r.mixer_model, r.notes]
        .filter(Boolean)
        .map(String)
        .map((x) => x.toLowerCase())
        .some((x) => x.includes(s))
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMsg("");
    setErr("");
  };

  const startAdd = () => {
    reset();
    setTab("ADD");
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      client_name: r.client_name || "",
      email: r.email || "",
      mobile_no: r.mobile_no || "",
      event_date: r.event_date || "",
      location: r.location || "",
      system_type: r.system_type || "",
      speakers_count: String(r.speakers_count ?? ""),
      microphones_count: String(r.microphones_count ?? ""),
      mixer_model: r.mixer_model || "",
      price: String(r.price ?? ""),
      payment_method: r.payment_method || "Cash",
      notes: r.notes || "",
    });
    setTab("ADD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ================= UI (pf style) =================
  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Sound System Service</h2>
          <p className="pf-subtitle">
            Manage DJ, PA, live band and custom sound setups for events.
          </p>
        </div>
        <div className="pf-tabs">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={startAdd}
            type="button"
          >
            Add Service
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
            type="button"
          >
            View Services
          </button>
        </div>
      </div>

      {/* BANNERS */}
      {msg && <div className="pf-banner pf-success">{msg}</div>}
      {err && (
        <pre className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {err}
        </pre>
      )}

      {/* ADD / EDIT FORM */}
      {tab === "ADD" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="pf-form"
        >
          {/* 1) CLIENT & CONTACT */}
          <section className="pf-card">
            <h3>Client & Contact</h3>
            <div className="pf-grid">
              <label>
                Customer Name*
                <input
                  id="client_name"
                  name="client_name"
                  placeholder="e.g., Rahul Verma"
                  value={form.client_name}
                  onChange={onChange}
                  required
                />
              </label>

              <label>
                Contact Number
                <input
                  id="mobile_no"
                  name="mobile_no"
                  placeholder="+91XXXXXXXXXX"
                  value={form.mobile_no}
                  onChange={onChange}
                />
              </label>

              <label>
                Email
                <input
                  id="email"
                  name="email"
                  placeholder="customer@email.com"
                  value={form.email}
                  onChange={onChange}
                />
              </label>

              <label>
                Address
                <input
                  id="location"
                  name="location"
                  placeholder="Street, City"
                  value={form.location}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          {/* 2) SETUP & DATE */}
          <section className="pf-card">
            <h3>Setup & Schedule</h3>
            <div className="pf-grid">
              <label>
                System Type*
                <select
                  id="system_type"
                  name="system_type"
                  value={form.system_type}
                  onChange={onChange}
                  required
                >
                  <option value="">— Select —</option>
                  {SYSTEM_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Event Date*
                <input
                  id="event_date"
                  type="date"
                  name="event_date"
                  value={form.event_date}
                  onChange={onChange}
                  required
                />
              </label>

              <label>
                Mixer Model
                <input
                  id="mixer_model"
                  name="mixer_model"
                  placeholder="e.g., X32 / DJM-900"
                  value={form.mixer_model}
                  onChange={onChange}
                />
              </label>

              <label>
                Price (₹)
                <input
                  id="price"
                  name="price"
                  placeholder="e.g., 15000"
                  value={form.price}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          {/* 3) EQUIPMENT */}
          <section className="pf-card">
            <h3>Equipment Details</h3>
            <div className="pf-grid">
              <label>
                Speakers Count
                <input
                  id="speakers_count"
                  name="speakers_count"
                  placeholder="e.g., 2"
                  value={form.speakers_count}
                  onChange={onChange}
                />
              </label>

              <label>
                Microphones Count
                <input
                  id="microphones_count"
                  name="microphones_count"
                  placeholder="e.g., 4"
                  value={form.microphones_count}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          {/* 4) PAYMENT & NOTES */}
          <section className="pf-card">
            <h3>Payment & Notes</h3>
            <div className="pf-grid">
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

              <label className="pf-notes-label">
                Notes
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional details…"
                  value={form.notes}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="pf-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={reset}
              disabled={loading}
            >
              Reset
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {editingId ? "Save Changes" : "Save Service"}
            </button>
          </div>
        </form>
      )}

      {/* VIEW TABLE */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search services…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <button className="btn" onClick={fetchAll} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="loader">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No records found.</div>
          ) : (
            <>
              <div className="pf-table-wrap">
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Date</th>
                      <th>System</th>
                      <th>Price</th>
                      <th>Payment</th>
                      <th>Location</th>
                      <th className="c">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>
                          {r.client_name || "-"}
                        </td>
                        <td>{r.event_date || "-"}</td>
                        <td>{r.system_type || "-"}</td>
                        <td>{Number(r.price || 0).toFixed(2)}</td>
                        <td>{r.payment_method || "-"}</td>
                        <td>{r.location || "-"}</td>
                        <td className="c">
                          <button
                            className="mini"
                            onClick={() => startEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            className="mini danger"
                            onClick={() => del(r.id)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
