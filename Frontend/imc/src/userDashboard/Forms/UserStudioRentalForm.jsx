import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../components/Forms/Forms.css"; // adjust path if needed

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
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

  /* Fetch data */
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

  // Pre-select studio if passed from card
  useEffect(() => {
    if (!initialStudio || !masters.length) return;
    if (formData.studio_id) return;

    const found = masters.find(
      (m) => String(m.id) === String(initialStudio.id)
    ) || masters.find(
      (m) => (m.name || "").toLowerCase() === (initialStudio.name || "").toLowerCase()
    );

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

  /* ── Time Slots Logic ──────────────────────────────────────── */

  const SLOT_STEP_MIN = 60;
  const allSlots = useMemo(() => makeSlots("08:00", "22:00", SLOT_STEP_MIN), []);

  const slotsInfo = useMemo(() => {
    const base = allSlots.map((s) => ({ time: s, booked: false }));
    if (!formData.date || !formData.studio_id) return base;

    const master = selectedStudio;
    const taken = bookings.filter(
      (b) =>
        b.date === formData.date &&
        (String(b.studio_id || "") === String(formData.studio_id) ||
          (b.studio_name || "").toLowerCase() === (master?.name || "").toLowerCase())
    );

    return base.map((slotObj) => {
      const overlappedBy = taken.filter((b) =>
        overlaps(slotObj.time, 1, b.time_slot, Number(b.duration) || 1)
      );
      return { ...slotObj, booked: overlappedBy.length > 0 };
    });
  }, [allSlots, bookings, formData.date, formData.studio_id, selectedStudio]);

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
    const needed = Math.ceil(Number(formData.duration || 0) / (SLOT_STEP_MIN / 60));
    if (range.length < needed) {
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
  }, [formData.duration, formData.date, formData.studio_id, formData.time_slot, bookings, slotsInfo]);

  const canStartAt = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const needed = Math.ceil(Number(formData.duration || 0) / (SLOT_STEP_MIN / 60));
    if (range.length < needed) return false;
    return !range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
  };

  /* Handlers */

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

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

    setSaving(true);
    try {
      const res = await api.post(BOOKINGS_URL, payload);

      const totalAmount = priceToSend * Number(formData.duration || 1);

      navigate("/payment", {
        state: {
          booking: res.data,
          studio: selectedStudio,
          amount: totalAmount,
        },
      });
    } catch (err) {
      setError(humanizeErr(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="pf-wrap" style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div className="pf-header" style={{ marginBottom: "1.8rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Studio Booking</h2>
          <p className="pf-subtitle" style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>
            Choose your studio, date, time and enjoy professional sound quality.
          </p>
        </div>
        {onClose && (
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      {/* ── Studio Selection (no filters) ────────────────────────────── */}
      {loading ? (
        <div className="pf-banner" style={{ textAlign: "center" }}>Loading studios...</div>
      ) : masters.length === 0 ? (
        <div className="pf-banner pf-error" style={{ textAlign: "center" }}>
          No studios available at the moment
        </div>
      ) : (
        <section className="pf-card" style={{ marginBottom: "1.8rem" }}>
          <h3 style={{ marginTop: 0 }}>Available Studios ({masters.length})</h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}>
            {masters.map((studio) => {
              const isSelected = String(studio.id) === String(formData.studio_id);
              return (
                <div
                  key={studio.id}
                  onClick={() => {
                    setFormData((p) => ({
                      ...p,
                      studio_id: String(studio.id),
                      studio_name: studio.name || "",
                    }));
                  }}
                  style={{
                    padding: "1rem",
                    border: isSelected ? "2px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: "12px",
                    background: isSelected ? "#fef2f2" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    {studio.name}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.3rem" }}>
                    {studio.full_location || studio.location || "—"}
                  </div>
                  <div style={{ marginTop: "0.6rem", fontWeight: 700, color: "#b91c1c" }}>
                    {studio.hourly_rate ? `₹${studio.hourly_rate}/hr` : "Contact for price"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedStudio && (
        <section className="pf-card" style={{ margin: "1.6rem 0", background: "#f0fdfa" }}>
          <h3>Selected Studio</h3>
          <div className="pf-grid" style={{ gap: "1.2rem" }}>
            <div>
              <strong>{selectedStudio.name}</strong>
              <div style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                {selectedStudio.full_location || selectedStudio.location}
              </div>
            </div>
            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Capacity</div>
              <strong>{selectedStudio.capacity ? `${selectedStudio.capacity} pax` : "—"}</strong>
            </div>
            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Price</div>
              <strong style={{ color: "#b91c1c" }}>
                {pricePerHour ? `₹${pricePerHour}/hr` : "On request"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {error && <div className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}

      {/* ── Booking Form ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="pf-form">
        <section className="pf-card">
          <h3>Personal Information</h3>
          <div className="pf-grid">
            <label className={formData.full_name ? "" : "required-highlight"}>
              Full Name *
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </label>

            <label className={formData.mobile ? "" : "required-highlight"}>
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
                rows={2}
                style={{ resize: "vertical" }}
              />
            </label>
          </div>
        </section>

        <section className="pf-card">
          <h3>Booking Details</h3>
          <div className="pf-grid">
            <label className={!formData.date ? "required-highlight" : ""}>
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

            <label className={!formData.duration || formData.duration < 0.5 ? "required-highlight" : ""}>
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

            <label className={!formData.time_slot ? "required-highlight" : ""}>
              Start Time *
              <div className="slot-grid" style={{ marginTop: "0.5rem" }}>
                {!formData.date || !formData.studio_id ? (
                  <div className="muted">Select date & studio first</div>
                ) : slotsInfo.filter((s) => !s.booked).length === 0 ? (
                  <div className="empty">No available slots for this date</div>
                ) : (
                  <div className="slot-list" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {slotsInfo.map(({ time, booked }) => {
                      const isStart = formData.time_slot === time;
                      const inRange = selectedRange.includes(time);
                      const valid = canStartAt(time);

                      let className = "slot";
                      if (booked) className += " booked";
                      else if (!valid) className += " disabled-start";
                      else if (isStart) className += " selected-start";
                      else if (inRange) className += " selected-range";

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
          </div>

          <p style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "1rem", lineHeight: 1.4 }}>
            • The full time range will be reserved based on duration<br />
            • Gray = booked &nbsp; • Red = selected &nbsp; • Light red = range
          </p>
        </section>

        <div className="pf-actions" style={{ marginTop: "2rem", gap: "1rem" }}>
          <button type="submit" className="btn" disabled={saving || loading || !formData.studio_id}>
            {saving ? "Processing..." : "Proceed to Payment"}
          </button>

          <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserStudioRentalForm;