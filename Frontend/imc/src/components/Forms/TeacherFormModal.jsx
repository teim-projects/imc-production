import React from "react";
import axios from "axios";
import { X } from "lucide-react";

/* ================= API CONFIG ================= */
const API_URL = import.meta.env.VITE_BASE_API_URL || "https://www.imcpune.in/api";
const TEACHER_API = `${API_URL}/auth/teachers/`;

export default function TeacherFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access");

      const config = {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      if (isEdit && form.id) {
        await axios.put(`${TEACHER_API}${form.id}/`, form, config);
      } else {
        await axios.post(TEACHER_API, form, config);
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Teacher save error:", error.response?.data || error);
      alert("Failed to save teacher. Please check the fields.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Teacher" : "Add Teacher"}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Teacher Name *
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              required
              placeholder="Full name"
            />
          </label>

          <label>
            Expertise
            <input
              name="expertise"
              value={form.expertise || ""}
              onChange={handleChange}
              placeholder="e.g. Classical, Bollywood"
            />
          </label>

          <div className="row">
            <label className="half">
              Experience (years)
              <input
                type="number"
                name="experience"
                value={form.experience || ""}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </label>

            <label className="half">
              Phone
              <input
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder="Mobile number"
              />
            </label>
          </div>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              placeholder="teacher@example.com"
            />
          </label>

          <label>
            Bio
            <textarea
              name="bio"
              rows="2"
              value={form.bio || ""}
              onChange={handleChange}
              placeholder="Short description..."
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={saving} className="primary">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1200;
          }

          .modal-box {
            background: white;
            width: 380px;           /* reduced from 450px */
            max-width: 92%;
            border-radius: 12px;
            padding: 1.2rem;        /* tighter padding */
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          h2 {
            margin: 0;
            font-size: 1.3rem;
            font-weight: 600;
            color: #1f2937;
          }

          .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
          }

          label {
            display: block;
            margin-bottom: 0.9rem;   /* reduced spacing */
            font-size: 0.9rem;
            font-weight: 500;
            color: #374151;
          }

          input,
          textarea {
            width: 100%;
            padding: 0.55rem 0.8rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.95rem;
            margin-top: 0.3rem;
          }

          input:focus,
          textarea:focus {
            outline: none;
            border-color: #fb923c;
            box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
          }

          textarea {
            resize: vertical;
          }

          .row {
            display: flex;
            gap: 0.8rem;
          }

          .half {
            flex: 1;
          }

          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.8rem;
            margin-top: 1.2rem;
          }

          button {
            padding: 0.55rem 1.2rem;
            border-radius: 999px;
            font-size: 0.95rem;
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
    </div>
  );
}