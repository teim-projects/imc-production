// src/components/Forms/ClassFormModal.jsx

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

const BASE =
  import.meta.env.VITE_BASE_API_URL ||
  "https://www.imcpune.in/api";

// ✅ APIs
const TEACHER_API = `${BASE.replace(/\/$/, "")}/auth/teachers/`;
const CLASS_API = `${BASE.replace(/\/$/, "")}/auth/classes/`;

const api = axios.create();

// ✅ JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default function ClassFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  isEdit,
}) {
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);

  // =========================================
  // FETCH TEACHERS
  // =========================================
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);

    try {
      const res = await api.get(TEACHER_API);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setTeachers(data);

    } catch (err) {
      console.error("Failed to load teachers", err);

    } finally {
      setLoadingTeachers(false);
    }
  };

  // =========================================
  // HANDLE INPUT
  // =========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // SAVE CLASS TO DATABASE
  // =========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {

      const payload = {
        name: form.name,
        trainer: Number(form.trainer),
        fee: Number(form.fee),
        description: form.description || "",
      };

      console.log("CLASS PAYLOAD:", payload);

      // ✅ SAVE API
      const res = await api.post(CLASS_API, payload);

      console.log("CLASS SAVED:", res.data);

      alert("Class saved successfully");

      // optional refresh callback
      if (onSave) {
        onSave(res.data);
      }

      // reset form
      setForm({
        name: "",
        trainer: "",
        fee: "",
        description: "",
      });

      onClose();

    } catch (err) {

      console.error(
        "SAVE ERROR:",
        err.response?.data || err
      );

      alert("Failed to save class");

    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header">
          <h2>
            {isEdit ? "Edit Class" : "Add Class"}
          </h2>

          <button
            onClick={onClose}
            className="close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
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
                {loadingTeachers
                  ? "Loading trainers..."
                  : "Select Trainer"}
              </option>

              {teachers.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name ||
                    `${t.first_name} ${t.last_name}`.trim()}
                </option>
              ))}
            </select>
          </label>

          {/* FEE */}
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

            <button
              type="submit"
              disabled={saving}
              className="save-btn"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Class"
                : "Save Class"}
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
          }

          input:focus,
          select:focus,
          textarea:focus {
            outline: none;
            border-color: #ea580c;
            background: white;
            box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
          }

          textarea {
            resize: vertical;
            min-height: 100px;
          }

          .actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
          }

          .save-btn {
            background: #ea580c;
            color: white;
            padding: 0.9rem 2.5rem;
            border-radius: 999px;
            border: none;
            font-weight: 600;
            cursor: pointer;
          }

          .save-btn:hover:not(:disabled) {
            background: #dc4d05;
          }

          .save-btn:disabled {
            opacity: 0.6;
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