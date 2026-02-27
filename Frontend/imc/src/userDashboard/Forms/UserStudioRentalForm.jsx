// UserStudioRentalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// You can keep this import if you want to separate CSS file
// import "../../components/Forms/Forms.css";

// ─────────────────────────────────────────────────────────────
// If you prefer inline / single-file style for development/testing,
// paste the entire CSS below into a <style> tag or dedicated file
// ─────────────────────────────────────────────────────────────

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const BOOKINGS_URL = `${BASE}/auth/studios/`;
const MASTERS_URL = `${BASE}/auth/studio-master/`;
const PAYMENT_CREATE_API = `${BASE}/payments/create-payment/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

/* Helpers ──────────────────────────────────────────────── */

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

/* ───────────────────────────────────────────────────────────── */

const UserStudioRentalForm = ({ initialStudio = null, onClose }) => {
  const navigate = useNavigate();

  const [masters, setMasters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const emptyForm = {
    full_name: "",
    mobile: "",
    email: "",
    notes: "",
    date: "",
    time_slot: "",
    duration: 1,
    studio_id: "",
    studio_name: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [selectedRange, setSelectedRange] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, bRes] = await Promise.all([
        api.get(MASTERS_URL),
        api.get(BOOKINGS_URL),
      ]);

      const mRows = Array.isArray(mRes.data) ? mRes.data : mRes.data?.results ?? [];
      const bRows = Array.isArray(bRes.data) ? bRes.data : bRes.data?.results ?? [];

      setMasters(mRows.filter((s) => s.is_active !== false));
      setBookings(bRows);
    } catch (e) {
      setError(humanizeErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!initialStudio || !masters.length) return;
    if (formData.studio_id) return;

    const found = masters.find((m) => String(m.id) === String(initialStudio.id))
      || masters.find((m) => (m.name || "").toLowerCase() === (initialStudio.name || "").toLowerCase());

    if (found) {
      setFormData((prev) => ({
        ...prev,
        studio_id: String(found.id),
        studio_name: found.name || "",
      }));
    }
  }, [initialStudio, masters]);

  const selectedStudio = useMemo(
    () => masters.find((m) => String(m.id) === String(formData.studio_id)),
    [masters, formData.studio_id]
  );

  const pricePerHour = selectedStudio?.hourly_rate ?? null;

  const SLOT_STEP_MIN = 60;
  const allSlots = useMemo(() => makeSlots("08:00", "22:00", SLOT_STEP_MIN), []);

  const slotsInfo = useMemo(() => {
    const base = allSlots.map((s) => ({ time: s, booked: false }));
    if (!formData.date || !formData.studio_id) return base;

    const taken = bookings.filter(
      (b) =>
        b.date === formData.date &&
        (String(b.studio_id || "") === String(formData.studio_id) ||
          (b.studio_name || "").toLowerCase() === (selectedStudio?.name || "").toLowerCase())
    );

    return base.map((slotObj) => {
      const overlappedBy = taken.filter((b) =>
        overlaps(slotObj.time, 1, b.time_slot, Number(b.duration) || 1)
      );
      return { ...slotObj, booked: overlappedBy.length > 0 };
    });
  }, [allSlots, bookings, formData.date, formData.studio_id, selectedStudio]);

  const computeRangeForStart = (startTime, durationHours) => {
    const count = Math.ceil((Number(durationHours) || 0) / (SLOT_STEP_MIN / 60)) || 1;
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
    const needed = Math.ceil(Number(formData.duration || 0) / (SLOT_STEP_MIN / 60));
    if (range.length < needed || range.some((t) => slotsInfo.find((s) => s.time === t)?.booked)) {
      setFormData((p) => ({ ...p, time_slot: "" }));
      setSelectedRange([]);
      return;
    }
    setSelectedRange(range);
  }, [formData.time_slot, formData.duration, formData.date, formData.studio_id, slotsInfo]);

  const canStartAt = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const needed = Math.ceil(Number(formData.duration || 0) / (SLOT_STEP_MIN / 60));
    if (range.length < needed) return false;
    return !range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const onSlotClick = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const needed = Math.ceil(Number(formData.duration || 0) / (SLOT_STEP_MIN / 60));
    if (range.length < needed) return;
    if (range.some((t) => slotsInfo.find((s) => s.time === t)?.booked)) return;
    setFormData((p) => ({ ...p, time_slot: time }));
    setSelectedRange(range);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedRange([]);
  };

  const validate = () => {
    if (!formData.full_name.trim()) return "Full name is required.";
    if (!formData.mobile.trim()) return "Mobile number is required.";
    if (!formData.studio_id) return "Please select a studio.";
    if (!formData.date) return "Date is required.";
    if (!formData.time_slot) return "Please select a time slot.";
    const d = Number(formData.duration);
    if (isNaN(d) || d < 0.5) return "Duration must be at least 0.5 hours.";
    return null;
  };

  const createBooking = async () => {
    const priceToSend = pricePerHour != null ? Number(pricePerHour) : 0;

    const payload = {
      customer: formData.full_name,
      contact_number: formData.mobile,
      email: formData.email,
      address: "",
      studio_id: formData.studio_id,
      studio_name: formData.studio_name,
      date: formData.date,
      time_slot: formData.time_slot,
      duration: Number(formData.duration),
      payment_methods: [],
      price_per_hour: priceToSend,
      price: priceToSend,
      notes: formData.notes || "",
    };

    const res = await api.post(BOOKINGS_URL, payload);
    if (res.status === 201 || res.status === 200) {
      return res.data.id || res.data.pk || res.data._id || res.data.booking_id;
    }
    throw new Error("Booking creation failed");
  };

  const initiatePayment = async (bookingId) => {
    const totalAmount = (pricePerHour || 0) * Number(formData.duration || 1);
    if (totalAmount <= 0) throw new Error("Invalid amount");

    const payload = {
      amount: totalAmount * 100,           // many gateways expect paise / smallest unit
      customer_id: `STUDIO_${formData.mobile.replace(/\D/g, '') || 'guest'}`,
      email: formData.email.trim() || "booking@studio.com",
      phone: formData.mobile.trim(),
      description: `Studio Booking - ${selectedStudio?.name || "Selected Studio"} on ${formData.date} ${formData.time_slot}`,
      return_url: `${window.location.origin}/payment-callback?type=studio-booking&mobile=${formData.mobile.trim()}&booking_id=${bookingId}`,
    };

    const paymentRes = await api.post(PAYMENT_CREATE_API, payload);
    const pData = paymentRes.data;

    const paymentUrl = pData?.payment_url || pData?.payment_links?.web || pData?.redirect_url;

    if (paymentUrl) {
      window.location.href = paymentUrl;
      return;
    }

    // Fallback - if no redirect (some gateways show popup or success immediately)
    if (pData?.success === true || String(pData?.status || "").toUpperCase().includes("SUCCESS")) {
      setSuccessMsg("Payment initiated successfully! Redirecting shortly...");
      setTimeout(() => navigate("/booking-success"), 2500);
      return;
    }

    throw new Error("Payment initiation failed - no redirect URL received");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);

    try {
      const bookingId = await createBooking();
      await initiatePayment(bookingId);
      // If we reach here without redirect, show success (but usually redirect happens)
      setSuccessMsg("Booking & payment processed!");
    } catch (err) {
      console.error("Booking/Payment error:", err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <div>
          <h2>Studio Booking</h2>
          <p className="pf-subtitle">
            Choose your studio, date, time and enjoy professional sound quality.
          </p>
        </div>
        {onClose && (
          <button type="button" className="btn secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      {loading ? (
        <div className="pf-banner pf-loading">Loading studios...</div>
      ) : masters.length === 0 ? (
        <div className="pf-banner pf-error">No studios available at the moment</div>
      ) : (
        <section className="pf-card">
          <h3>Available Studios ({masters.length})</h3>
          <div className="studio-grid">
            {masters.map((studio) => {
              const isSelected = String(studio.id) === String(formData.studio_id);
              return (
                <div
                  key={studio.id}
                  className={`studio-card ${isSelected ? "selected" : ""}`}
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      studio_id: String(studio.id),
                      studio_name: studio.name || "",
                    }))
                  }
                >
                  <div className="studio-name">{studio.name}</div>
                  <div className="studio-location">
                    {studio.full_location || studio.location || "—"}
                  </div>
                  <div className="studio-price">
                    {studio.hourly_rate ? `₹${studio.hourly_rate}/hr` : "Contact for price"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedStudio && (
        <section className="pf-card selected-studio-card">
          <h3>Selected Studio</h3>
          <div className="pf-grid info-grid">
            <div>
              <strong>{selectedStudio.name}</strong>
              <div className="location-text">
                {selectedStudio.full_location || selectedStudio.location}
              </div>
            </div>
            <div>
              <div className="label-small">Capacity</div>
              <strong>{selectedStudio.capacity ? `${selectedStudio.capacity} pax` : "—"}</strong>
            </div>
            <div>
              <div className="label-small">Price</div>
              <strong className="price-highlight">
                {pricePerHour ? `₹${pricePerHour}/hr` : "On request"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {error && <div className="pf-banner pf-error">{error}</div>}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="pf-form">
        <section className="pf-card">
          <h3>Personal Information</h3>
          <div className="pf-grid">
            <label className={!formData.full_name.trim() ? "required" : ""}>
              Full Name *
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </label>

            <label className={!formData.mobile.trim() ? "required" : ""}>
              Mobile Number *
              <input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 XXXXXXXXXX"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Notes / Requirements
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special requests? (optional)"
                rows={3}
              />
            </label>
          </div>
        </section>

        <section className="pf-card">
          <h3>Booking Details</h3>
          <div className="pf-grid two-cols">
            <label className={!formData.date ? "required" : ""}>
              Date *
              <input
                type="date"
                name="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.date}
                onChange={(e) => {
                  handleChange(e);
                  setFormData((p) => ({ ...p, time_slot: "" }));
                  setSelectedRange([]);
                }}
                required
              />
            </label>

            <label className={Number(formData.duration) < 0.5 ? "required" : ""}>
              Duration (hours) *
              <input
                type="number"
                step="0.5"
                min="0.5"
                name="duration"
                value={formData.duration}
                onChange={(e) => {
                  handleChange(e);
                  setFormData((p) => ({ ...p, time_slot: "" }));
                  setSelectedRange([]);
                }}
                required
              />
            </label>
          </div>

          <label className={`start-time-label ${!formData.time_slot ? "required" : ""}`}>
            Start Time *
            <div className="slot-container">
              {!formData.date || !formData.studio_id ? (
                <div className="placeholder-text">Select date & studio first</div>
              ) : slotsInfo.filter((s) => !s.booked).length === 0 ? (
                <div className="placeholder-text">No available slots for this date</div>
              ) : (
                <div className="slot-scroller">
                  {slotsInfo.map(({ time, booked }) => {
                    const isStart = formData.time_slot === time;
                    const inRange = selectedRange.includes(time);
                    const valid = canStartAt(time);

                    let className = "slot-btn";
                    if (booked) className += " booked";
                    else if (!valid) className += " invalid";
                    else if (isStart) className += " start-selected";
                    else if (inRange) className += " range-selected";

                    return (
                      <button
                        key={time}
                        type="button"
                        className={className}
                        onClick={() => !booked && valid && onSlotClick(time)}
                        disabled={booked || !valid}
                        title={booked ? "Booked" : format12(time)}
                      >
                        {format12(time)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </label>

          <p className="slot-hint">
            • Full range is reserved based on selected duration<br />
            • Gray = booked • Red = selected
          </p>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={saving || loading || !formData.studio_id}
          >
            {saving ? "Processing..." : "Proceed to Payment"}
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={resetForm}
            disabled={saving}
          >
            Clear Form
          </button>
        </div>
      </form>

      {/* ──────────────────────────────────────────────── */}
      {/*               CSS (recommended in Forms.css)      */}
      {/* ──────────────────────────────────────────────── */}
      <style>{`
        .pf-wrap {
          padding: 1rem;
          max-width: 1100px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .pf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .pf-header h2 {
          margin: 0;
          font-size: 1.6rem;
        }

        .pf-subtitle {
          margin: 0.4rem 0 0;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .pf-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .pf-grid {
          display: grid;
          gap: 1.25rem;
        }

        /* Studio cards */
        .studio-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .studio-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .pf-grid.two-cols {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .studio-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .pf-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .pf-wrap {
            padding: 1.5rem 2rem;
          }
        }

        .studio-card {
          padding: 1.1rem;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .studio-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .studio-card.selected {
          border: 2px solid #ef4444;
          background: #fef2f2;
        }

        .studio-name {
          font-weight: 600;
          font-size: 1.05rem;
        }

        .studio-location {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.3rem;
        }

        .studio-price {
          margin-top: 0.7rem;
          font-weight: 700;
          color: #b91c1c;
        }

        .selected-studio-card {
          background: #f0fdfa;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .info-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .location-text {
          color: #6b7280;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .label-small {
          font-size: 0.82rem;
          color: #6b7280;
        }

        .price-highlight {
          color: #b91c1c;
        }

        /* Form fields */
        label {
          display: block;
        }

        label.required::after {
          content: " *";
          color: #ef4444;
        }

        input, textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          margin-top: 0.35rem;
          box-sizing: border-box;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }

        /* Time slots */
        .start-time-label {
          display: block;
          margin-top: 1.25rem;
        }

        .slot-container {
          margin-top: 0.6rem;
        }

        .placeholder-text {
          color: #9ca3af;
          font-style: italic;
          padding: 1rem 0;
          text-align: center;
        }

        .slot-scroller {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-height: 240px;
          overflow-y: auto;
          padding: 0.4rem 0;
          -webkit-overflow-scrolling: touch;
        }

        .slot-btn {
          flex: 0 0 auto;
          min-width: 78px;
          padding: 0.65rem 0.5rem;
          font-size: 0.9rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          cursor: pointer;
          transition: all 0.14s;
        }

        @media (min-width: 480px) {
          .slot-btn {
            min-width: 86px;
            font-size: 0.94rem;
          }
        }

        .slot-btn.booked {
          background: #fee2e2;
          border-color: #fecaca;
          color: #991b1b;
          cursor: not-allowed;
        }

        .slot-btn.invalid {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .slot-btn.start-selected,
        .slot-btn.range-selected {
          background: #fee2e2;
          border-color: #f87171;
          color: #991b1b;
          font-weight: 600;
        }

        /* Actions */
        .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.85rem 1.6rem;
          font-size: 1rem;
          border-radius: 8px;
          cursor: pointer;
          flex: 1 1 160px;
          min-width: 140px;
          border: none;
        }

        .btn.primary {
          background: #ef4444;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn.secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn.secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Messages */
        .pf-banner {
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          text-align: center;
        }

        .pf-error  { background: #fee2e2; color: #991b1b; }
        .pf-success { background: #d1fae5; color: #065f46; }
        .pf-loading { background: #e0f2fe; color: #1e40af; }

        .slot-hint {
          font-size: 0.82rem;
          color: #6b7280;
          margin-top: 1.1rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default UserStudioRentalForm;