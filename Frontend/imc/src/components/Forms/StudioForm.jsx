// src/components/Forms/StudioForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";        // 👈 ADDED
import axios from "axios";
import { Download } from "lucide-react";
import "./Forms.css";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "https://www.imcpune.in/api";
const BOOKINGS_URL = `${BASE}/auth/studios/`;
const MASTERS_URL = `${BASE}/auth/studio-master/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

// generate slots at given step (minutes). default 60min (1 hour)
const makeSlots = (start = "08:00", end = "22:00", stepMin = 60) => {
  stepMin = Number(stepMin) || 60;
  if (stepMin <= 0 || stepMin > 1440) stepMin = 60;

  const out = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (Number(sh) || 0) * 60 + (Number(sm) || 0);
  const endMins = (Number(eh) || 0) * 60 + (Number(em) || 0);

  while (mins <= endMins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
    mins += stepMin;
  }
  return out;
};

// does interval A (startA + durAhr) overlap B (startB + durBhr)?
const overlaps = (startA, durAhr, startB, durBhr) => {
  const toMin = (s) => {
    if (!s) return null;
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const a0 = toMin(startA);
  const b0 = toMin(startB);
  if (a0 === null || b0 === null) return false;
  const a1 = a0 + Math.round((Number(durAhr) || 0) * 60);
  const b1 = b0 + Math.round((Number(durBhr) || 0) * 60);
  return a0 < b1 && b0 < a1;
};

const format12 = (time24) => {
  if (!time24) return "";
  const [hh, mm] = time24.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
};

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

// Payment status chip styles
const getPaymentStatusChipStyles = (status) => {
  const isPaid = status === "paid";
  return {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    backgroundColor: isPaid ? "#dcfce7" : "#fee2e2",
    color: isPaid ? "#166534" : "#991b1b",
  };
};

// Slot status chip styles (available/booked/blocked)
const getSlotStatusChipStyles = (status) => {
  const colorMap = {
    available: { bg: "#dcfce7", text: "#166534" },
    booked: { bg: "#e0f2fe", text: "#1e3a8a" },
    blocked: { bg: "#fef3c7", text: "#92400e" },
  };
  const style = colorMap[status] || colorMap.booked;
  return {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    backgroundColor: style.bg,
    color: style.text,
  };
};

const StudioForm = ({ onClose, viewOnly = false }) => {
  const location = useLocation();                       // 👈 ADDED

  const [tab, setTab] = useState(viewOnly ? "VIEW" : "ADD");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [bookings, setBookings] = useState([]);
  const [masters, setMasters] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const emptyForm = {
    customer: "",
    contact_number: "",
    email: "",
    address: "",
    studio_id: "",
    studio_name: "",
    date: "",
    time_slot: "",
    duration: 1,
    payment_methods: [],
    custom_price: "",
    payment_status: "pending",
  };
  const [formData, setFormData] = useState(emptyForm);

  // 👇 PREFILL from location.state (if any)
  useEffect(() => {
    if (location.state) {
      setFormData((prev) => ({
        ...prev,
        studio_name: location.state.studio_name || "",
        date: location.state.date || "",
        time_slot: location.state.time_slot || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedRange, setSelectedRange] = useState([]);

  const selectedStudio = useMemo(
    () => masters.find((m) => String(m.id) === String(formData.studio_id)),
    [masters, formData.studio_id]
  );
  const masterPrice = selectedStudio?.hourly_rate ?? "";

  const finalPrice = useMemo(() => {
    if (
      formData.custom_price !== "" &&
      formData.custom_price !== null &&
      formData.custom_price !== undefined
    ) {
      return String(formData.custom_price);
    }
    return masterPrice === null || masterPrice === undefined ? "" : String(masterPrice);
  }, [formData.custom_price, masterPrice]);

  const clearStatus = () => {
    setError(null);
    setSuccessMsg("");
  };
  const toast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 1800);
  };

  const fetchAll = async () => {
    setLoading(true);
    clearStatus();
    try {
      const [b, m] = await Promise.all([api.get(BOOKINGS_URL), api.get(MASTERS_URL)]);
      const bRows = Array.isArray(b.data) ? b.data : b.data?.results ?? b.data ?? [];
      const mRows = Array.isArray(m.data) ? m.data : m.data?.results ?? m.data ?? [];
      setBookings(Array.isArray(bRows) ? bRows : []);
      setMasters((mRows || []).filter((s) => s.is_active !== false));
      const pages = Math.max(1, Math.ceil(((bRows || []).length) / pageSize));
      if (page > pages) setPage(pages);
    } catch (e) {
      setError(humanizeErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let rows = [...bookings];
    if (dateFilter) rows = rows.filter((r) => r.date === dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.customer || "").toLowerCase().includes(q) ||
          (r.studio_name || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.contact_number || "").toLowerCase().includes(q) ||
          (r.payment_status || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [bookings, search, dateFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [search, dateFilter]);

  const SLOT_STEP_MIN = 60;
  const allSlots = useMemo(() => makeSlots("08:00", "22:00", SLOT_STEP_MIN), []);

  const slotsInfo = useMemo(() => {
    const base = allSlots.map((s) => ({ time: s, booked: false, sources: [] }));

    if (!formData.date || !formData.studio_id) return base;

    const master = masters.find((m) => String(m.id) === String(formData.studio_id));
    // Only consider bookings that are NOT 'available'
    const taken = bookings.filter(
      (b) =>
        b.date === formData.date &&
        ((master &&
          (b.studio_name || "").toLowerCase() === (master.name || "").toLowerCase()) ||
          String(b.studio_id || "") === String(formData.studio_id)) &&
        b.status !== "available"
    );

    return base.map((slotObj) => {
      const overlappedBy = taken.filter((b) => {
        if (!b.time_slot) return false;
        return overlaps(
          slotObj.time,
          1,
          b.time_slot,
          Number(b.duration) || 1
        );
      });
      return {
        ...slotObj,
        booked: overlappedBy.length > 0,
        sources: overlappedBy,
      };
    });
  }, [allSlots, formData.date, formData.studio_id, bookings, masters]);

  const computeRangeForStart = (startTime, durationHours) => {
    const stepMin = SLOT_STEP_MIN;
    const perSlotHr = stepMin / 60;
    const count = Math.ceil((Number(durationHours) || 0) / perSlotHr) || 1;
    const startIndex = allSlots.indexOf(startTime);
    if (startIndex === -1) return [];
    const arr = [];
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      if (idx >= allSlots.length) break;
      arr.push(allSlots[idx]);
    }
    return arr;
  };

  useEffect(() => {
    if (!formData.time_slot) {
      setSelectedRange([]);
      return;
    }
    const range = computeRangeForStart(formData.time_slot, formData.duration);
    const perSlotHr = SLOT_STEP_MIN / 60;
    const neededCount = Math.ceil((Number(formData.duration) || 0) / perSlotHr) || 1;
    if (range.length < neededCount) {
      setFormData((p) => ({ ...p, time_slot: "" }));
      setSelectedRange([]);
      return;
    }
    const conflict = range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
    if (conflict) {
      setFormData((p) => ({ ...p, time_slot: "" }));
      setSelectedRange([]);
      return;
    }
    setSelectedRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.duration, formData.date, formData.studio_id, allSlots, bookings]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "custom_price") {
      setFormData((prev) => ({ ...prev, custom_price: value }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleStudioChange = (e) => {
    const studio_id = e.target.value;
    const master = masters.find((m) => String(m.id) === String(studio_id));
    setFormData((prev) => ({
      ...prev,
      studio_id,
      studio_name: master?.name || "",
      time_slot: "",
    }));
    setSelectedRange([]);
  };

  const handlePaymentChange = (method) => {
    setFormData((prev) => {
      const set = new Set(prev.payment_methods);
      if (set.has(method)) set.delete(method);
      else set.add(method);
      return { ...prev, payment_methods: Array.from(set) };
    });
  };

  const handlePaymentStatusChange = (status) => {
    setFormData((prev) => ({ ...prev, payment_status: status }));
  };

  const onSlotClick = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const perSlotHr = SLOT_STEP_MIN / 60;
    const neededCount = Math.ceil((Number(formData.duration) || 0) / perSlotHr) || 1;
    if (range.length < neededCount) return;
    const conflict = range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
    if (conflict) return;
    setFormData((p) => ({ ...p, time_slot: time }));
    setSelectedRange(range);
  };

  const handleEdit = (row) => {
    setTab("ADD");
    setEditingId(row.id);
    const master = masters.find(
      (m) => (m.name || "").toLowerCase() === (row.studio_name || "").toLowerCase()
    );
    setFormData({
      customer: row.customer || "",
      contact_number: row.contact_number || "",
      email: row.email || "",
      address: row.address || "",
      studio_id: master?.id ? String(master.id) : "",
      studio_name: row.studio_name || master?.name || "",
      date: row.date || "",
      time_slot: row.time_slot || "",
      duration: row.duration ?? 1,
      payment_methods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
      custom_price: row.price_per_hour ?? row.price ?? (master?.hourly_rate ?? ""),
      payment_status: row.payment_status || "pending",
    });
    setSelectedRange([]);
    clearStatus();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    clearStatus();
    try {
      await api.delete(`${BOOKINGS_URL}${id}/`);
      setBookings((prev) => prev.filter((r) => r.id !== id));
      toast("🗑️ Deleted");
      const after = bookings.length - 1;
      const pages = Math.max(1, Math.ceil(after / pageSize));
      if (page > pages) setPage(pages);
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  // ---------- SLOT ADMIN FUNCTIONS ----------
  const openSlot = async (id) => {
    if (!window.confirm("Make this slot available?")) return;
    clearStatus();
    try {
      await api.patch(`${BOOKINGS_URL}${id}/`, { status: "available" });
      await fetchAll();
      toast("✅ Slot is now available");
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  const blockSlot = async (id) => {
    if (!window.confirm("Block this slot?")) return;
    clearStatus();
    try {
      await api.patch(`${BOOKINGS_URL}${id}/`, { status: "blocked" });
      await fetchAll();
      toast("🚫 Slot blocked");
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  const createBlockedSlot = async (time) => {
    if (!formData.studio_name || !formData.date) {
      toast("Select studio and date first");
      return;
    }
    if (!window.confirm(`Block ${format12(time)}?`)) return;
    clearStatus();
    try {
      await api.post(BOOKINGS_URL, {
        customer: "ADMIN BLOCK",
        studio_name: formData.studio_name,
        studio_id: formData.studio_id,
        date: formData.date,
        time_slot: time,
        duration: 1,
        status: "blocked",
        payment_status: "pending",
        payment_methods: [],
        price: 0,
        price_per_hour: 0,
      });
      await fetchAll();
      toast("🚫 Slot blocked");
    } catch (err) {
      setError(humanizeErr(err));
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setSelectedRange([]);
  };

  const validate = () => {
    if (!formData.customer?.trim()) return "Customer is required.";
    if (!formData.studio_name?.trim()) return "Studio name is required.";
    if (!formData.date?.trim()) return "Date is required.";
    const d = Number(formData.duration);
    if (Number.isNaN(d) || d <= 0) return "Duration must be greater than 0.";
    if (!formData.time_slot) return "Please choose an available time slot.";
    if (!finalPrice || String(finalPrice).trim() === "") return "Price is required.";
    const pnum = Number(finalPrice);
    if (Number.isNaN(pnum) || pnum < 0) return "Price must be a valid number ≥ 0.";
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

    const isEdit = Boolean(editingId);
    const priceToSend = Number(finalPrice) || 0;

    const payload = {
      ...formData,
      duration: Number(formData.duration),
      time_slot: formData.time_slot ? formData.time_slot : null,
      payment_methods: Array.isArray(formData.payment_methods)
        ? formData.payment_methods
        : [],
      price_per_hour: priceToSend,
      price: priceToSend,
      studio_name: formData.studio_name,
      payment_status: formData.payment_status || "pending",
      // status not sent; default 'booked' will be used on creation
    };

    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticBooking = { id: tempId, ...payload };

    try {
      if (!isEdit) {
        setBookings((prev) => [optimisticBooking, ...prev]);
        const resp = await api.post(BOOKINGS_URL, payload);
        setBookings((prev) => prev.map((x) => (x.id === tempId ? resp.data : x)));
        toast("✅ Booking added");
      } else {
        const resp = await api.put(`${BOOKINGS_URL}${editingId}/`, payload);
        setBookings((prev) => prev.map((x) => (x.id === editingId ? resp.data : x)));
        toast("✅ Booking updated");
      }
      await fetchAll();
      resetForm();
      setTab("VIEW");
    } catch (err) {
      if (!isEdit) setBookings((prev) => prev.filter((x) => x.id !== tempId));
      setError(humanizeErr(err));
    } finally {
      setSaving(false);
    }
  };

  const canStartAt = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const perSlotHr = SLOT_STEP_MIN / 60;
    const neededCount = Math.ceil((Number(formData.duration) || 0) / perSlotHr) || 1;
    if (range.length < neededCount) return false;
    return !range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
  };

  const exportBookingsToCSV = () => {
    if (!filtered.length) {
      alert("No bookings to export");
      return;
    }
    if (loading) {
      alert("Please wait while data is loading...");
      return;
    }

    const headers = [
      "Sr No",
      "Customer",
      "Studio",
      "Date",
      "Time",
      "Duration (hrs)",
      "Price (₹/hr)",
      "Total Amount (₹)",
      "Payment Methods",
      "Payment Status",
      "Slot Status",
      "Contact Number",
      "Email",
    ];

    const csvRows = [
      headers.join(","),
      ...filtered.map((b, index) => {
        const price = b.price_per_hour ?? b.price ?? 0;
        const total = (Number(b.duration) || 0) * Number(price);

        const row = [
          index + 1,
          `"${(b.customer || "").replace(/"/g, '""')}"`,
          `"${(b.studio_name || "").replace(/"/g, '""')}"`,
          b.date || "-",
          b.time_slot ? format12(b.time_slot) : "-",
          b.duration || "-",
          price ? `₹${price}` : "-",
          total ? `₹${total.toFixed(2)}` : "-",
          Array.isArray(b.payment_methods) && b.payment_methods.length
            ? `"${b.payment_methods.join(", ")}"`
            : "-",
          b.payment_status === "paid" ? "Paid" : "Pending",
          b.status || "booked",
          b.contact_number || "-",
          b.email || "-",
        ];
        return row.join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `studio_bookings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────
  return (
    <div className="pf-wrap">
      {/* HEADER */}
      <div className="pf-header">
        <div>
          <h2>Studio Booking</h2>
          <p className="pf-subtitle">
            Manage hourly studio reservations with smart time-slot blocking.
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
              style={{ marginLeft: "8px" }}
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* BANNERS */}
      {error && (
        <pre className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}

      {/* ADD FORM */}
      {tab === "ADD" && (
        <form onSubmit={handleSubmit} className="pf-form">
          {/* Customer Details */}
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

          {/* Studio & Pricing */}
          <section className="pf-card">
            <h3>Studio & Pricing</h3>
            <div className="pf-grid">
              <label>
                Studio Name*
                <select
                  name="studio_id"
                  value={formData.studio_id}
                  onChange={handleStudioChange}
                  required
                >
                  <option value="">— Select studio —</option>
                  {masters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.hourly_rate ? `— ₹${m.hourly_rate}/hr` : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  name="studio_name"
                  value={formData.studio_name}
                  readOnly
                />
              </label>

              <label>
                Price (₹/hr)
                <input
                  name="custom_price"
                  value={finalPrice}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "custom_price", value: e.target.value, type: "text" },
                    })
                  }
                  placeholder={masterPrice ? `Master: ₹${masterPrice}` : "Enter price"}
                />
              </label>

              <label>
                Duration (hours)*
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  name="duration"
                  value={formData.duration}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedRange([]);
                    setFormData((p) => ({ ...p, time_slot: "" }));
                  }}
                  placeholder="e.g., 2"
                  required
                />
              </label>

              <label>
                Payment Options
                <div className="pf-methods">
                  <div className="pf-tags">
                    {["Card", "UPI", "NetBanking"].map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={
                          formData.payment_methods.includes(m) ? "tag active" : "tag"
                        }
                        onClick={() => handlePaymentChange(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </label>

              <label>
                Payment Status
                <div className="pf-methods">
                  <div className="pf-tags">
                    <button
                      type="button"
                      className={`tag ${formData.payment_status === "pending" ? "active" : ""}`}
                      onClick={() => handlePaymentStatusChange("pending")}
                      style={{
                        backgroundColor: formData.payment_status === "pending" ? "#fee2e2" : "",
                        color: formData.payment_status === "pending" ? "#991b1b" : "",
                      }}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      className={`tag ${formData.payment_status === "paid" ? "active" : ""}`}
                      onClick={() => handlePaymentStatusChange("paid")}
                      style={{
                        backgroundColor: formData.payment_status === "paid" ? "#dcfce7" : "",
                        color: formData.payment_status === "paid" ? "#166534" : "",
                      }}
                    >
                      Paid
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Schedule & Slots */}
          <section className="pf-card">
            <h3>Schedule & Slots</h3>
            <div className="pf-grid">
              <label>
                Date*
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedRange([]);
                    setFormData((p) => ({ ...p, time_slot: "" }));
                  }}
                  required
                />
              </label>

              <label>
                Time Slot*
                <div className="slot-grid">
                  {!formData.date || !formData.duration || !formData.studio_id ? (
                    <div className="muted">Pick studio, date and duration first</div>
                  ) : (
                    <>
                      {slotsInfo.filter((s) => !s.booked).length === 0 &&
                      slotsInfo.length > 0 ? (
                        <div className="empty">
                          No free slots for the selected date/duration.
                        </div>
                      ) : null}

                      <div
                        className="slot-list"
                        role="list"
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {slotsInfo.map(({ time, booked, sources }) => {
                          const isSelectedStart = formData.time_slot === time;
                          const inSelectedRange = selectedRange.includes(time);
                          const validStart = canStartAt(time);
                          const cls = [
                            "slot",
                            booked ? "booked" : "available",
                            !booked && !validStart ? "disabled-start" : "",
                            isSelectedStart ? "selected-start" : "",
                            inSelectedRange ? "selected-range" : "",
                          ].join(" ");

                          // Determine status label
                          let status = "";
                          let label = "";
                          if (booked && sources && sources.length > 0) {
                            status = sources[0].status || "booked";
                            label = status === "blocked" ? "blocked" : "booked";
                          }

                          const title = booked
                            ? label === "blocked" ? "Blocked" : "Already booked"
                            : inSelectedRange
                            ? `Covers ${selectedRange.length} slot(s)`
                            : `Start at ${format12(time)}`;
                          return (
                            <button
                              key={time}
                              type="button"
                              role="listitem"
                              className={cls}
                              onClick={() => {
                                if (booked) return;
                                if (!validStart) return;
                                onSlotClick(time);
                              }}
                              disabled={booked || !validStart}
                              title={title}
                              style={{ flexDirection: "column", alignItems: "center" }}
                            >
                              <div style={{ fontWeight: 800 }}>{format12(time)}</div>
                              {booked && (
                                <div style={{ fontSize: 11, color: "#9aa6b2" }}>
                                  {label}
                                </div>
                              )}
                              {!booked && !validStart && (
                                <div style={{ fontSize: 11, color: "#c07" }}>
                                  not enough free slots
                                </div>
                              )}

                              {/* ADMIN CONTROLS INSIDE SLOT - UPDATED AS PER REQUEST */}
                              {booked && sources && sources.length > 0 && (
                                <>
                                  {status === "booked" && (
                                    <div style={{ marginTop: 5 }}>
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: "#2563eb",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Booked
                                      </span>
                                    </div>
                                  )}
                                  {status === "blocked" && (
                                    <div style={{ marginTop: 5 }}>
                                      <button
                                        type="button"
                                        className="mini"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openSlot(sources[0].id);
                                        }}
                                        style={{ fontSize: 10, padding: "2px 6px" }}
                                      >
                                        Unblock
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}

                              {!booked && (
                                <div style={{ marginTop: 5 }}>
                                  <button
                                    type="button"
                                    className="mini warning"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createBlockedSlot(time);
                                    }}
                                    style={{ fontSize: 10, padding: "2px 6px" }}
                                  >
                                    Block
                                  </button>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Selecting a start time will highlight the full reserved range based on the
              duration. Admin buttons appear directly on each slot.
            </p>
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
          </div>

          {editingId && (
            <div className="pf-hint">
              Editing booking <strong>#{editingId}</strong>
            </div>
          )}
        </form>
      )}

      {/* ────────────────────────────────────────────────
          VIEW TABLE – with Slot Status column and admin actions
      ──────────────────────────────────────────────── */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-top">
            <input
              className="pf-search"
              placeholder="Search: customer, studio, email, phone, payment status, slot status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="date"
              className="pf-search"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <button className="btn" onClick={fetchAll} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              className="btn ghost"
              onClick={exportBookingsToCSV}
              disabled={loading || filtered.length === 0}
              title="Export filtered bookings to CSV"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
              }}
            >
              <Download size={18} />
              Export
            </button>
          </div>

          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Studio</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Price (₹/hr)</th>
                  <th>Total Amount (₹)</th>
                  <th>Payment</th>
                  <th>Payment Status</th>
                  <th>Slot Status</th>
                  <th className="c">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => {
                  const price = s.price_per_hour ?? s.price ?? 0;
                  const totalAmount = (Number(s.duration) || 0) * Number(price);

                  return (
                    <tr key={s.id}>
                      <td>{s.customer || "-"}</td>
                      <td>{s.studio_name || "-"}</td>
                      <td>{s.date || "-"}</td>
                      <td>{s.time_slot ? format12(s.time_slot) : "-"}</td>
                      <td>{s.duration || "-"}</td>
                      <td>
                        {price > 0 ? `₹${Number(price).toFixed(2)}` : "-"}
                      </td>
                      <td>
                        {totalAmount > 0 ? (
                          <strong>₹{totalAmount.toFixed(2)}</strong>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {Array.isArray(s.payment_methods) && s.payment_methods.length
                          ? s.payment_methods.join(", ")
                          : "-"}
                      </td>
                      <td>
                        <span style={getPaymentStatusChipStyles(s.payment_status)}>
                          {s.payment_status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <span style={getSlotStatusChipStyles(s.status || "booked")}>
                          {(s.status || "booked").toUpperCase()}
                        </span>
                      </td>
                      <td className="c" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <button
                          className="mini"
                          onClick={() => handleEdit(s)}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          className="mini danger"
                          onClick={() => handleDelete(s.id)}
                          disabled={saving}
                        >
                          Delete
                        </button>

                        {/* Open/Unblock Slot */}
                        {s.status !== "available" && (
                          <button
                            className="mini"
                            onClick={() => openSlot(s.id)}
                            disabled={saving}
                            title="Make this slot available"
                          >
                            {s.status === "blocked" ? "Unblock" : "Open Slot"}
                          </button>
                        )}

                        {/* Block Slot */}
                        {s.status !== "blocked" && (
                          <button
                            className="mini warning"
                            onClick={() => blockSlot(s.id)}
                            disabled={saving}
                            title="Block this slot"
                          >
                            Block Slot
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!paged.length && (
                  <tr>
                    <td colSpan="11" className="c muted">
                      {loading ? "Loading bookings…" : "No bookings found."}
                    </td>
                  </tr>
                )}
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
        </div>
      )}
    </div>
  );
};

export default StudioForm;