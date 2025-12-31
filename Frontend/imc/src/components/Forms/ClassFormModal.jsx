// src/components/Forms/ClassFormModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const TEACHER_API = `${BASE.replace(/\/$/, "")}/auth/teachers/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ClassFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  isEdit,
  saving = false,
}) {
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await api.get(TEACHER_API);
      setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to load teachers", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Class" : "Add Class"}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CLASS NAME */}
          <label>
            Class Name *
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="e.g. Beginner Vocal Training"
              required
            />
          </label>

          {/* TRAINER */}
          <label>
            Trainer *
            <select
              name="trainer"
              value={form.trainer || ""}
              onChange={handleChange}
              disabled={loadingTeachers}
              required
            >
              <option value="">
                {loadingTeachers ? "Loading trainers..." : "Select Trainer"}
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || `${t.first_name} ${t.last_name}`.trim()}
                </option>
              ))}
            </select>
          </label>

          {/* FEE PER MONTH */}
          <label>
            Fee Per Month (₹) *
            <input
              type="number"
              name="fee"
              value={form.fee || ""}
              onChange={handleChange}
              placeholder="e.g. 2500"
              min="0"
              required
            />
          </label>

          {/* DESCRIPTION */}
          <label>
            Description
            <textarea
              name="description"
              rows="4"
              value={form.description || ""}
              onChange={handleChange}
              placeholder="Class syllabus, goals, etc."
            />
          </label>

          {/* ACTIONS */}
          <div className="actions">
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? "Saving..." : "Save Class"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>

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
            background: #fff;
            width: 480px;
            max-width: 95%;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            overflow: hidden;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem 1rem;
          }

          .modal-header h2 {
            font-size: 1.6rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }

          .close-btn {
            background: #ea580c;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
          }

          .close-btn:hover {
            background: #dc4d05;
          }

          form {
            padding: 0 2rem 2rem;
          }

          label {
            display: block;
            margin-bottom: 1.2rem;
            font-weight: 600;
            color: #374151;
          }

          input,
          select,
          textarea {
            width: 100%;
            padding: 0.9rem 1rem;
            margin-top: 0.5rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            font-size: 1rem;
            transition: all 0.2s;
          }

          input:focus,
          select:focus,
          textarea:focus {
            outline: none;
            border-color: #ea580c;
            background: white;
            box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
          }

          input::placeholder,
          textarea::placeholder {
            color: #94a3b8;
          }

          textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }

          .actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1rem;
          }

          .save-btn {
            background: #ea580c;
            color: white;
            padding: 0.9rem 2.5rem;
            border-radius: 999px;
            border: none;
            font-weight: 600;
            font-size: 1.05rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .save-btn:hover:not(:disabled) {
            background: #dc4d05;
            transform: translateY(-2px);
          }

          .save-btn:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
          }

          .cancel-btn {
            background: #e2e8f0;
            color: #475569;
            padding: 0.9rem 2rem;
            border-radius: 999px;
            border: none;
            font-weight: 600;
            cursor: pointer;
          }

          .cancel-btn:hover {
            background: #cbd5e1;
          }
        `}</style>
      </div>
    </div>
  );
}