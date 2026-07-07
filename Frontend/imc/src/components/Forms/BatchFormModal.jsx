// src/components/Forms/BatchFormModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API_URL || "https://www.imcpune.in/api";

const CLASS_API   = `${BASE}/auth/classes/`;
const TEACHER_API = `${BASE}/auth/teachers/`;
const BATCH_API   = `${BASE}/auth/batches/`;

const DAYS = [
  "Wednesday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMES = [
  "10:00 am - 12:00 pm",   // Saturday morning
  "9:00 am - 11:00 am",   // Saturday morning
  "8:00 am - 10:00 am",   // Saturday morning
  "10:00 am - 01:00 pm",   // Saturday morning
  "5:00 pm - 7:00 pm",     // Saturday evening
  "6:00 pm - 8:00 pm",     // Wednesday & Friday evening
];

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function BatchFormModal({ onClose, onSaved, editData = null }) {
  const [form, setForm] = useState({
    class_obj: "",
    trainer:   "",
    day:       "",
    time_slot: "",
    capacity:  "",
  });

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (editData) {
      setForm({
        class_obj: editData.class_obj?.id?.toString() || editData.class_obj || "",
        trainer:   editData.trainer?.id?.toString()   || editData.trainer   || "",
        day:       editData.day       || "",
        time_slot: editData.time_slot || "",
        capacity:  editData.capacity != null ? String(editData.capacity) : "",
      });
    }
  }, [editData]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(CLASS_API);
      setClasses(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get(TEACHER_API);
      setTeachers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error("Failed to load teachers", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.class_obj || !form.trainer || !form.day || !form.time_slot) {
      setError("Please fill all required fields (*)");
      setSaving(false);
      return;
    }

    const payload = {
      class_obj: Number(form.class_obj),
      trainer:   Number(form.trainer),
      day:       form.day,
      time_slot: form.time_slot.trim(),
      ...(form.capacity.trim() !== "" && { capacity: Number(form.capacity) }),
    };

    try {
      if (editData?.id) {
        await api.put(`${BATCH_API}${editData.id}/`, payload);
      } else {
        await api.post(BATCH_API, payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Save error:", err.response?.data || err);
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" • ")
        : "Failed to save batch. Please check the fields.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>{editData ? "Edit Batch" : "Add New Batch"}</h3>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Class <span className="required">*</span>
            <select name="class_obj" value={form.class_obj} onChange={handleChange} required>
              <option value="">— Select Class —</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Trainer <span className="required">*</span>
            <select name="trainer" value={form.trainer} onChange={handleChange} required>
              <option value="">— Select Trainer —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Day <span className="required">*</span>
            <select name="day" value={form.day} onChange={handleChange} required>
              <option value="">— Select Day —</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label>
            Time Slot <span className="required">*</span>
            <select name="time_slot" value={form.time_slot} onChange={handleChange} required>
              <option value="">— Select Time —</option>
              {TIMES.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label>
            Capacity (optional)
            <input
              type="number"
              min="1"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              placeholder="e.g. 15"
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={saving} className="primary">
              {saving ? "Saving..." : editData ? "Update Batch" : "Create Batch"}
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-box {
          background: white;
          padding: 1.8rem 2rem;
          border-radius: 12px;
          width: 420px;
          max-width: 94%;
          max-height: 92vh;
          overflow-y: auto;
        }

        h3 {
          margin: 0 0 1.4rem;
          color: #1f2937;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.2rem;
          font-size: 0.95rem;
        }

        label {
          display: block;
          margin-bottom: 1.1rem;
          font-weight: 500;
          color: #374151;
        }

        .required {
          color: #ef4444;
          font-size: 0.9rem;
        }

        input,
        select {
          width: 100%;
          padding: 0.65rem 0.9rem;
          margin-top: 0.35rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #fb923c;
          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.15);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.6rem;
        }

        button {
          padding: 0.65rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .primary {
          background: #ea580c;
          color: white;
        }

        .primary:hover:not(:disabled) {
          background: #c2410c;
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .secondary:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}