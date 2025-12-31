import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

/**
 * PhotographyForm – with:
 * ✅ Payment Method section
 * ✅ Event Type "Other" → extra fields (other name + add-on price)
 * ✅ Package price field
 */

const BASE_API = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const CANDIDATE_API_URLS = [
  `${BASE_API}/auth/photography/`,
  `${BASE_API}/photography/`,
  `${BASE_API}//photography-bookings/`,
];
const PAGE_SIZE = 10;

const initialForm = {
  client_name: "",
  email: "",
  mobile_no: "",
  event_type: "Wedding",
  event_type_other: "",      // when event_type === "Other"
  shoot_date: "",
  start_time: "",
  duration_hours: 2,
  location: "",
  package_type: "Standard",
  package_price: "",         // ₹ price for selected package
  photographers_count: 1,

  // optional add-on when user chooses Other / anything extra
  addon_name: "",
  addon_price: "",           // ₹

  drone_needed: false,
  equipment_needed: "",
  notes: "",
  payment_methods: [], // single-select wrapper ["Cash"|"Card"|"UPI"]
};

const methodOptions = ["Cash", "Card", "UPI"];
const eventTypes = ["theatre music events", "private music events", "Birthday", "Other"];
const packages = ["Basic", "Standard", "Premium", "Custom"];

const PhotographyForm = ({ onClose, viewOnly = false }) => {
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

  // ---------- Resolve endpoint once to avoid 404s ----------
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
    // none worked – keep first so UI shows clear message
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
              "Failed to load photography bookings."
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
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? !!checked : value,
    }));
  };

  // only one method selectable
  const toggleMethod = (m) => {
    setForm((s) => {
      const current = s.payment_methods?.[0] || null;
      const next = current === m ? [] : [m];
      return { ...s, payment_methods: next };
    });
  };

  const validate = () => {
    if (!form.client_name?.trim()) return "Client name is required.";
    if (!form.shoot_date) return "Shoot date is required.";
    if (!form.start_time) return "Start time is required.";
    if (!form.location?.trim()) return "Location is required.";
    if (!form.payment_methods?.length) return "Select a payment method.";

    if (form.event_type === "Other" && !form.event_type_other.trim()) {
      return 'Please specify "Other" event type.';
    }
    return null;
  };

  const buildPayload = () => {
    const alias = {
      client_name: "client",
      mobile_no: "contact_number",
      shoot_date: "date",
    };
    const p = {};
    Object.entries(form).forEach(([k, v]) => {
      const key = alias[k] || k;
      if (key === "payment_methods") {
        p["payment_methods_list"] = v || [];
      } else {
        p[key] = v ?? "";
      }
    });
    return p;
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
        setSuccessMsg("Booking updated.");
      } else {
        await axios.post(resolvedURL, payload, { headers });
        setSuccessMsg("Booking created.");
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

    const pm =
      row.payment_methods_list ||
      (row.payment_methods || row.payment_methods_csv || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const pmOne = pm.length ? [pm[0]] : [];

    setForm({
      ...initialForm,
      client_name: row.client || row.client_name || "",
      email: row.email || "",
      mobile_no: row.contact_number || row.mobile_no || "",
      event_type: row.event_type || "Wedding",
      event_type_other: row.event_type_other || "",
      shoot_date: row.date || row.shoot_date || "",
      start_time: row.start_time || "",
      duration_hours: row.duration_hours ?? 2,
      location: row.location || "",
      package_type: row.package_type || "Standard",
      package_price: row.package_price || "",
      photographers_count: row.photographers_count ?? 1,

      addon_name: row.addon_name || "",
      addon_price: row.addon_price || "",

      drone_needed: !!row.drone_needed,
      equipment_needed: row.equipment_needed || "",
      notes: row.notes || "",
      payment_methods: pmOne,
    });
  };

  const onDelete = async (row) => {
    if (!confirm(`Delete booking for ${row.client || row.client_name}?`)) return;
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
      const hay = `${r.client || r.client_name} ${
        r.contact_number || r.mobile_no
      } ${r.email || ""} ${r.event_type || ""} ${
        r.event_type_other || ""
      } ${r.location || ""} ${r.package_type || ""} ${
        r.package_price || ""
      } ${r.addon_name || ""}`
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

  // helper to display Event in table
  const displayEvent = (r) => {
    if (r.event_type === "Other" && r.event_type_other) {
      return `Other - ${r.event_type_other}`;
    }
    return r.event_type;
  };

  const displayAddon = (r) => {
    if (!r.addon_name && !r.addon_price) return "";
    if (r.addon_name && r.addon_price) {
      return `${r.addon_name} (₹${r.addon_price})`;
    }
    return r.addon_name || `₹${r.addon_price}`;
  };

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

      {tab === "ADD" && (
        <form className="pf-form" onSubmit={onSubmit}>
          <section className="pf-card">
            <h3>Client & Event</h3>
            <div className="pf-grid">
              <label>
                Client Name*
                <input
                  name="client_name"
                  value={form.client_name}
                  onChange={onChange}
                  placeholder="Full name"
                  required
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
                    placeholder="Describe event (e.g. corporate, ceremony...)"
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
                Package Price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="package_price"
                  value={form.package_price}
                  onChange={onChange}
                  placeholder="e.g. 15000"
                />
              </label>
            </div>
          </section>

          <section className="pf-card">
            <h3>Schedule & Team</h3>
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
                  name="duration_hours"
                  value={form.duration_hours}
                  onChange={onChange}
                />
              </label>
              <label>
                Location*
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  placeholder="Venue / Address"
                  required
                />
              </label>
              <label>
                Photographers
                <input
                  type="number"
                  min="0"
                  name="photographers_count"
                  value={form.photographers_count}
                  onChange={onChange}
                />
              </label>
            </div>
          </section>

          <section className="pf-card">
            <h3>Add-on (Optional)</h3>
            <div className="pf-grid">
              <label>
                Add-on Name
                <input
                  name="addon_name"
                  value={form.addon_name}
                  onChange={onChange}
                  placeholder="e.g. Extra album, drone, reels..."
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
          </section>

          {/* ✅ Payment Method Section */}
          <section className="pf-card">
            <h3>Payment Method</h3>
            <div className="pf-methods">
              <div className="pf-tags">
                {methodOptions.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={
                      form.payment_methods.includes(m) ? "tag active" : "tag"
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

export default PhotographyForm;
