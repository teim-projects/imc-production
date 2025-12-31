// src/components/Forms/SingingClassForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Forms.css";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE.replace(/\/$/, "")}/auth/singing-classes/`;
const BATCH_API = `${BASE.replace(/\/$/, "")}/auth/batches/`;
const PAGE_SIZE = 10;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token)
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});

const humanizeErr = (err) => {
  const data = err?.response?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const k = Object.keys(data)[0];
    const v = data[k];
    if (Array.isArray(v)) return `${k}: ${v[0]}`;
    if (typeof v === "string") return `${k}: ${v}`;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
  return err?.message || "Unknown error";
};

const PAYMENT_OPTIONS = [
  { key: "card", label: "Card" },
  { key: "upi", label: "UPI" },
  { key: "netbanking", label: "NetBanking" },
];

export default function SingingClassForm({ onSuccess }) {
  const [tab, setTab] = useState("ADD");

  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    address1: "", address2: "", city: "", state: "", postal_code: "",
    batch: "",
    reference_by: "", fee: "",
    payment_method: "", agreed_terms: false,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [errorBanner, setErrorBanner] = useState("");
  const [search, setSearch] = useState("");

  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load batches and admissions
  useEffect(() => {
    fetchBatches();
    fetchList(1);
  }, []);

  useEffect(() => {
    if (tab === "VIEW") fetchList(1);
  }, [tab]);

  const fetchBatches = async () => {
    setBatchesLoading(true);
    try {
      const res = await api.get(BATCH_API, { params: { page_size: 100 } });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setBatches(data);
    } catch (err) {
      console.error("Failed to load batches", err);
    } finally {
      setBatchesLoading(false);
    }
  };

  // Selected batch using serialized fields
  const selectedBatch = useMemo(() => {
    return batches.find(b => String(b.id) === String(form.batch));
  }, [form.batch, batches]);

  // Auto-fill fee when batch is selected
  useEffect(() => {
    if (selectedBatch && selectedBatch.class_fee) {
      setForm(prev => ({ ...prev, fee: selectedBatch.class_fee }));
    }
  }, [selectedBatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
    setErrorBanner("");
  };

  const setPayment = (key) => {
    setForm((f) => ({
      ...f,
      payment_method: f.payment_method === key ? "" : key,
    }));
    setErrors((s) => ({ ...s, payment_method: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.batch) e.batch = "Please select a batch";
    if (!form.fee.toString().trim()) e.fee = "Fee is required";
    else if (isNaN(Number(form.fee)) || Number(form.fee) < 0) e.fee = "Fee must be a valid amount";
    if (!form.payment_method) e.payment_method = "Select a payment option";
    if (!form.agreed_terms) e.agreed_terms = "You must accept terms";
    return e;
  };

  const resetForm = () => {
    setForm({
      first_name: "", last_name: "", phone: "", email: "",
      address1: "", address2: "", city: "", state: "", postal_code: "",
      batch: "", reference_by: "", fee: "",
      payment_method: "", agreed_terms: false,
    });
    setErrors({});
    setErrorBanner("");
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (tab !== "ADD") return;

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address1: form.address1.trim() || null,
      address2: form.address2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      batch: Number(form.batch),
      reference_by: form.reference_by.trim() || null,
      fee: Number(form.fee),
      payment_method: form.payment_method,
      agreed_terms: form.agreed_terms,
    };

    setSaving(true);
    setErrorBanner("");
    try {
      const resp = await api.post(API_URL, payload);
      await fetchList(1);
      resetForm();
      onSuccess?.();
      console.info("Saved admission id:", resp.data?.id);
      setTab("VIEW");
    } catch (err) {
      if (err?.response?.data) {
        const mapped = {};
        Object.keys(err.response.data).forEach((k) => {
          mapped[k] = Array.isArray(err.response.data[k])
            ? err.response.data[k].join(" ")
            : String(err.response.data[k]);
        });
        setErrors(mapped);
      } else {
        setErrorBanner("Network/server error — check console.");
        console.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchList = async (pageNo = 1) => {
    setListLoading(true);
    setErrorBanner("");
    try {
      const res = await api.get(API_URL, {
        params: { page: pageNo, page_size: PAGE_SIZE },
      });
      if (Array.isArray(res.data)) {
        setItems(res.data);
        setCount(res.data.length);
      } else {
        setItems(res.data.results || []);
        setCount(res.data.count || 0);
      }
      setPage(pageNo);
    } catch (err) {
      setErrorBanner(humanizeErr(err));
      setItems([]);
      setCount(0);
    } finally {
      setListLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admission?")) return;
    const before = items.slice();
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
    setCount((c) => Math.max(0, c - 1));
    try {
      await api.delete(`${API_URL}${id}/`);
      await fetchList(page);
    } catch (err) {
      setItems(before);
      setCount(before.length);
      setErrorBanner(humanizeErr(err));
    }
  };

  const handleEdit = (row) => {
    setForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      phone: row.phone || "",
      email: row.email || "",
      address1: row.address1 || "",
      address2: row.address2 || "",
      city: row.city || "",
      state: row.state || "",
      postal_code: row.postal_code || "",
      batch: row.batch || "",
      reference_by: row.reference_by || "",
      fee: row.fee || "",
      payment_method: row.payment_method || "",
      agreed_terms: !!row.agreed_terms,
    });
    setTab("ADD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDetail = (row) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const closeDetail = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 220);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((r) => {
      const batchInfo = batches.find(b => b.id === r.batch);
      const batchStr = batchInfo ? `${batchInfo.day} ${batchInfo.time_slot} ${batchInfo.trainer_name || ""} ${batchInfo.class_name || ""}` : "";
      const hay = `${r.first_name || ""} ${r.last_name || ""} ${r.phone || ""} ${r.email || ""} ${batchStr} ${r.fee || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, batches]);

  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Singing Class Admissions</h2>
          <p className="pf-subtitle">
            Enroll students into existing batches.
          </p>
        </div>
        <div className="pf-tabs">
          <button className={tab === "ADD" ? "active" : ""} onClick={() => setTab("ADD")} type="button">
            Add Admission
          </button>
          <button className={tab === "VIEW" ? "active" : ""} onClick={() => setTab("VIEW")} type="button">
            View Admissions
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {errorBanner}
        </div>
      )}

      {/* ADD MODE */}
      {tab === "ADD" && (
        <form className="pf-form" onSubmit={submit} noValidate>
          {/* STUDENT DETAILS */}
          <section className="pf-card">
            <h3>Student Details</h3>
            <div className="pf-grid">
              <label>First Name* <input name="first_name" value={form.first_name} onChange={handleChange} />
                {errors.first_name && <div className="field-error">{errors.first_name}</div>}
              </label>
              <label>Last Name* <input name="last_name" value={form.last_name} onChange={handleChange} />
                {errors.last_name && <div className="field-error">{errors.last_name}</div>}
              </label>
              <label>Contact Number* <input name="phone" value={form.phone} onChange={handleChange} />
                {errors.phone && <div className="field-error">{errors.phone}</div>}
              </label>
              <label>Email (optional) <input name="email" value={form.email} onChange={handleChange} /></label>
              <label>Street Address <input name="address1" value={form.address1} onChange={handleChange} /></label>
              <label>Address Line 2 <input name="address2" value={form.address2} onChange={handleChange} /></label>
              <label>City <input name="city" value={form.city} onChange={handleChange} /></label>
              <label>State <input name="state" value={form.state} onChange={handleChange} /></label>
              <label>Postal Code <input name="postal_code" value={form.postal_code} onChange={handleChange} /></label>
            </div>
          </section>

          {/* BATCH SELECTION */}
          <section className="pf-card">
            <h3>Select Batch *</h3>
            <div className="pf-grid">
              <label>
                Available Batch
                <select name="batch" value={form.batch} onChange={handleChange} disabled={batchesLoading}>
                  <option value="">-- Select a Batch --</option>
                  {batchesLoading ? (
                    <option disabled>Loading batches...</option>
                  ) : batches.length === 0 ? (
                    <option disabled>No batches created yet</option>
                  ) : (
                    batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.day} | {b.time_slot} | Teacher: {b.trainer_name || "Unassigned"} | 
                        Class: {b.class_name || "Unknown"} | 
                        Fee: ₹{b.class_fee || "Not set"} | 
                        Capacity: {b.capacity}
                      </option>
                    ))
                  )}
                </select>
                {errors.batch && <div className="field-error">{errors.batch}</div>}
              </label>

              {selectedBatch && (
                <div style={{ gridColumn: "1 / -1", padding: "1.2rem", background: "#fefce8", borderRadius: "12px", border: "1px solid #fde68a" }}>
                  <strong>Selected Batch Details:</strong><br />
                  <strong>Class:</strong> {selectedBatch.class_name || "Not set"}<br />
                  <strong>Day & Time:</strong> {selectedBatch.day} | {selectedBatch.time_slot}<br />
                  <strong>Teacher:</strong> {selectedBatch.trainer_name || "Not assigned"}<br />
                  <strong>Monthly Fee:</strong> ₹{selectedBatch.class_fee || "Not set"}
                  {selectedBatch.class_fee && <span style={{ color: "#16a34a", marginLeft: "8px" }}>→ Auto-filled below</span>}<br />
                  <strong>Capacity:</strong> {selectedBatch.capacity}
                </div>
              )}
            </div>
          </section>

          {/* FEE & PAYMENT */}
          <section className="pf-card">
            <h3>Fee & Payment</h3>
            <div className="pf-grid">
              <label>
                Fee (₹)*
                <input
                  type="number"
                  min="0"
                  name="fee"
                  value={form.fee}
                  onChange={handleChange}
                  placeholder="e.g. 2500"
                />
                {errors.fee && <div className="field-error">{errors.fee}</div>}
                {selectedBatch?.class_fee && (
                  <small style={{ color: "#059669", fontWeight: "600" }}>
                    Suggested: ₹{selectedBatch.class_fee} (from selected class)
                  </small>
                )}
              </label>

              <label>Payment Method*
                <div className="pf-methods">
                  <div className="pf-tags">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={form.payment_method === opt.key ? "tag active" : "tag"}
                        onClick={() => setPayment(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.payment_method && <div className="field-error">{errors.payment_method}</div>}
              </label>

              <label className="pf-checkbox-row">
                <input type="checkbox" name="agreed_terms" checked={form.agreed_terms} onChange={handleChange} />
                <span>I accept terms &amp; conditions</span>
                {errors.agreed_terms && <div className="field-error">{errors.agreed_terms}</div>}
              </label>

              <label>Reference By <input name="reference_by" value={form.reference_by} onChange={handleChange} /></label>
            </div>
          </section>

          <div className="pf-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Enroll Student"}
            </button>
            <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
              Reset
            </button>
          </div>
        </form>
      )}

      {/* VIEW MODE */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search by name, phone, batch, fee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" onClick={() => fetchList(1)} disabled={listLoading}>
              {listLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="pf-table-wrap">
            {listLoading ? (
              <div style={{ padding: 24 }}>Loading admissions…</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: 24, color: "#6b7280" }}>No admissions yet.</div>
            ) : (
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Teacher</th>
                    <th>Class</th>
                    <th>Fee Paid</th>
                    <th>Phone</th>
                    <th className="c">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((r) => {
                    const batchInfo = batches.find(b => b.id === r.batch);
                    return (
                      <tr key={r.id}>
                        <td onClick={() => openDetail(r)} style={{ cursor: "pointer" }}>
                          {r.first_name} {r.last_name}
                        </td>
                        <td>{batchInfo ? `${batchInfo.day} ${batchInfo.time_slot}` : "-"}</td>
                        <td>{batchInfo?.trainer_name || "-"}</td>
                        <td>{batchInfo?.class_name || "-"}</td>
                        <td>{r.fee ? `₹${r.fee}` : "-"}</td>
                        <td>{r.phone || "-"}</td>
                        <td className="c">
                          <button className="mini" onClick={() => handleEdit(r)}>Edit</button>
                          <button className="mini danger" onClick={() => handleDelete(r.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="pf-pager">
            <button onClick={() => fetchList(Math.max(1, page - 1))} disabled={page === 1}>Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button onClick={() => fetchList(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      <div className={`sc-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="sc-drawer-inner" role="dialog" aria-modal={drawerOpen}>
          <button className="drawer-close" onClick={closeDetail}>✕</button>
          {selected && (() => {
            const batchInfo = batches.find(b => b.id === selected.batch);
            return (
              <>
                <h3>{selected.first_name} {selected.last_name} <span className="muted small">#{selected.id}</span></h3>
                <p><strong>Batch:</strong> {batchInfo ? `${batchInfo.day} ${batchInfo.time_slot}` : "-"}</p>
                <p><strong>Teacher:</strong> {batchInfo?.trainer_name || "-"}</p>
                <p><strong>Class:</strong> {batchInfo?.class_name || "-"}</p>
                <p><strong>Monthly Fee Paid:</strong> {selected.fee ? `₹${selected.fee}` : "-"}</p>
                <p><strong>Phone:</strong> {selected.phone || "-"}</p>
                <p><strong>Email:</strong> {selected.email || "-"}</p>
                <p className="muted">{selected.address1} {selected.address2}</p>
              </>
            );
          })()}
        </div>
        <div className="sc-drawer-backdrop" onClick={closeDetail} />
      </div>
    </div>
  );
}