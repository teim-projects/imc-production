import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import "../../components/Forms/Forms.css"; // adjust path if needed

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const BOOKINGS_URL = `${BASE}/auth/studios/`;          // same as admin form
const MASTERS_URL = `${BASE}/auth/studio-master/`;     // to fetch studio info

// axios client with JWT
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

/* ------ helpers (same as admin form) ------ */

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

/* ===================================================================
   USER STUDIO RENTAL FORM
   - props.initialStudio: studio object from card (id, name, hourly_rate, etc.)
   - props.onClose: close modal
=================================================================== */

const UserStudioRentalForm = ({ initialStudio = null, onClose }) => {
  const navigate = useNavigate();   // ✅ ADD THIS LINE
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

  /* -------- fetch studio masters & existing bookings ---------- */

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, bRes] = await Promise.all([
        api.get(MASTERS_URL),
        api.get(BOOKINGS_URL),
      ]);

      const mRows = Array.isArray(mRes.data)
        ? mRes.data
        : mRes.data?.results ?? mRes.data ?? [];
      const bRows = Array.isArray(bRes.data)
        ? bRes.data
        : bRes.data?.results ?? bRes.data ?? [];

      setMasters((mRows || []).filter((s) => s.is_active !== false));
      setBookings(Array.isArray(bRows) ? bRows : []);
    } catch (e) {
      setError(humanizeErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when masters + initialStudio available, preselect studio
  useEffect(() => {
    if (!initialStudio || !masters.length) return;
    setFormData((prev) => {
      if (prev.studio_id) return prev;
      const byId = masters.find(
        (m) => String(m.id) === String(initialStudio.id)
      );
      const byName =
        byId ||
        masters.find(
          (m) =>
            (m.name || "").toLowerCase() ===
            (initialStudio.name || "").toLowerCase()
        );
      if (!byName) return prev;
      return {
        ...prev,
        studio_id: String(byName.id),
        studio_name: byName.name || "",
      };
    });
  }, [initialStudio, masters]);

  /* --------- derived selected studio + price ---------- */

  const selectedStudio = useMemo(
    () => masters.find((m) => String(m.id) === String(formData.studio_id)),
    [masters, formData.studio_id]
  );
  const pricePerHour = selectedStudio?.hourly_rate ?? null;

  /* --------- slots + availability ---------- */

  const SLOT_STEP_MIN = 60;
  const allSlots = useMemo(() => makeSlots("08:00", "22:00", SLOT_STEP_MIN), []);

  const slotsInfo = useMemo(() => {
    const base = allSlots.map((s) => ({ time: s, booked: false }));

    if (!formData.date || !formData.studio_id) return base;

    const master = selectedStudio;
    const taken = bookings.filter(
      (b) =>
        b.date === formData.date &&
        ((master &&
          (b.studio_name || "").toLowerCase() ===
            (master.name || "").toLowerCase()) ||
          String(b.studio_id || "") === String(formData.studio_id))
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
  }, [formData.duration, formData.date, formData.studio_id, bookings]);

  const canStartAt = (time) => {
    const range = computeRangeForStart(time, formData.duration);
    const perSlotHr = SLOT_STEP_MIN / 60;
    const neededCount = Math.ceil((Number(formData.duration) || 0) / perSlotHr) || 1;
    if (range.length < neededCount) return false;
    return !range.some((t) => slotsInfo.find((s) => s.time === t)?.booked);
  };

  /* --------- handlers ---------- */

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
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

  const resetForm = () => {
    setFormData((prev) => ({
      ...emptyForm,
      studio_id: prev.studio_id,
      studio_name: prev.studio_name,
    }));
    setSelectedRange([]);
  };

  const validate = () => {
    if (!formData.full_name.trim()) return "Name is required.";
    if (!formData.mobile.trim()) return "Mobile number is required.";
    if (!formData.studio_id) return "Studio is missing.";
    if (!formData.date) return "Date is required.";
    if (!formData.time_slot) return "Please choose a time slot.";
    const d = Number(formData.duration);
    if (Number.isNaN(d) || d <= 0) return "Duration must be greater than 0.";
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

    const priceToSend =
      pricePerHour !== undefined && pricePerHour !== null
        ? Number(pricePerHour)
        : 0;

    // payload shaped similar to admin StudioForm
    const payload = {
      customer: formData.full_name,
      contact_number: formData.mobile,
      email: formData.email,
      address: "", // optional, not used here
      studio_id: formData.studio_id,
      studio_name: formData.studio_name,
      date: formData.date,
      time_slot: formData.time_slot,
      duration: Number(formData.duration),
      payment_methods: [], // user does not choose here
      price_per_hour: priceToSend,
      price: priceToSend,
      notes: formData.notes || "",
    };

    setSaving(true);
try {
  // 1️⃣ Save booking first
  const res = await api.post(BOOKINGS_URL, payload);

  // 2️⃣ Calculate total amount
  const totalAmount =
    Number(priceToSend || 0) * Number(formData.duration || 1);

  // 3️⃣ Redirect to payment page
  navigate("/payment", {
    state: {
      booking: res.data,            // booking response
      studio: selectedStudio,       // studio details
      amount: totalAmount,          // total payment
    },
  });

} catch (err) {
  setError(humanizeErr(err));
} finally {
  setSaving(false);
}

  };

  /* --------- UI ---------- */

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <div>
          <h2>Studio Rental</h2>
          <p className="pf-subtitle">
            Fill your personal details and choose a time slot to rent this studio.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>

      {selectedStudio && (
        <section className="pf-card" style={{ marginBottom: 14 }}>
          <h3>Studio Details</h3>
          <div className="pf-grid">
            <div>
              <div style={{ fontWeight: 600 }}>{selectedStudio.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                {selectedStudio.full_location || selectedStudio.location}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Capacity</div>
              <div style={{ fontWeight: 600 }}>
                {selectedStudio.capacity
                  ? `${selectedStudio.capacity} people`
                  : "N/A"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Price</div>
              <div style={{ fontWeight: 700, color: "#b91c1c" }}>
                {pricePerHour ? `₹${pricePerHour} / hour` : "On request"}
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <pre className="pf-banner pf-error" style={{ whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}
      {successMsg && <div className="pf-banner pf-success">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="pf-form">
        {/* PERSONAL DETAILS */}
        <section className="pf-card">
          <h3>Personal Details</h3>
          <div className="pf-grid">
            <label>
              Full Name*
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Mobile Number*
              <input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
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
              Notes (optional)
              <input
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special request?"
              />
            </label>
          </div>
        </section>

        {/* SCHEDULE */}
        <section className="pf-card">
          <h3>Schedule</h3>
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
                required
              />
            </label>

            <label>
              Time Slot*
              <div className="slot-grid">
                {!formData.date || !formData.duration || !formData.studio_id ? (
                  <div className="muted">
                    Date & studio required to view slots.
                  </div>
                ) : (
                  <>
                    {slotsInfo.filter((s) => !s.booked).length === 0 &&
                    slotsInfo.length > 0 ? (
                      <div className="empty">
                        No free slots for this date and duration.
                      </div>
                    ) : null}

                    <div
                      className="slot-list"
                      role="list"
                      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                    >
                      {slotsInfo.map(({ time, booked }) => {
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

                        return (
                          <button
                            key={time}
                            type="button"
                            role="listitem"
                            className={cls}
                            onClick={() => {
                              if (booked || !validStart) return;
                              onSlotClick(time);
                            }}
                            disabled={booked || !validStart}
                            title={booked ? "Already booked" : format12(time)}
                          >
                            <div style={{ fontWeight: 800 }}>
                              {format12(time)}
                            </div>
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
            Start time will highlight the full reserved range based on duration.
          </p>
        </section>

        {/* ACTIONS */}
        <div className="pf-actions">
          <button type="submit" className="btn" disabled={saving || loading}>
            {saving ? "Submitting..." : "Confirm Booking"}
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
      </form>
    </div>
  );
};

export default UserStudioRentalForm;
