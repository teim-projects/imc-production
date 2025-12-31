// src/components/Forms/BatchFormModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

const CLASS_API = `${BASE}/auth/classes/`;
const TEACHER_API = `${BASE}/auth/teachers/`;
const BATCH_API = `${BASE}/auth/batches/`;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMES = [
  "07:00 - 08:00",
  "08:00 - 09:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
];

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function BatchFormModal({ onClose, onSaved, editData }) {
  const [form, setForm] = useState({
    class_obj: "",
    trainer: "",
    day: "",
    time_slot: "",
    capacity: "",
  });

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (editData) {
      setForm({
        class_obj: editData.class_obj ?? "",
        trainer: editData.trainer ?? "",
        day: editData.day ?? "",
        time_slot: editData.time_slot ?? "",
        capacity: editData.capacity ?? "",
      });
    }
  }, [editData]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(CLASS_API);
      setClasses(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get(TEACHER_API);
      setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to load teachers", err);
    }
  };

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      class_obj: Number(form.class_obj),
      trainer: Number(form.trainer),
      day: form.day,
      time_slot: form.time_slot,
      capacity: Number(form.capacity),
    };

    try {
      if (editData?.id) {
        await api.put(`${BATCH_API}${editData.id}/`, payload);
      } else {
        await api.post(BATCH_API, payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
      setError("Failed to save batch. Please check all fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{editData ? "Edit Batch" : "Add Batch"}</h3>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          {/* CLASS */}
          <label>
            Class *
            <select
              name="class_obj"
              value={form.class_obj}
              onChange={handleChange}
              required
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {/* TRAINER */}
          <label>
            Trainer *
            <select
              name="trainer"
              value={form.trainer}
              onChange={handleChange}
              required
            >
              <option value="">Select Trainer</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {/* DAY */}
          <label>
            Day *
            <select name="day" value={form.day} onChange={handleChange} required>
              <option value="">Select Day</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          {/* TIME */}
          <label>
            Time Slot *
            <select
              name="time_slot"
              value={form.time_slot}
              onChange={handleChange}
              required
            >
              <option value="">Select Time</option>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* CAPACITY */}
          <label>
            Capacity *
            <input
              type="number"
              min="1"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              required
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Batch"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-box {
          background: white;
          padding: 2rem;
          border-radius: 14px;
          width: 440px;
          max-width: 95%;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        input,
        select {
          padding: 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        button {
          padding: 0.6rem 1.4rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        button:not(.secondary) {
          background: #ea580c;
          color: white;
        }

        .secondary {
          background: #e5e7eb;
        }

        .error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.6rem;
          border-radius: 0.4rem;
          margin-bottom: 0.6rem;
        }
      `}</style>
    </div>
  );
}
