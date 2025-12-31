import React from "react";
import { X } from "lucide-react";

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Teacher" : "Add Teacher"}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={onSave}>
          <label>
            Teacher Name *
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Expertise
            <input
              name="expertise"
              value={form.expertise || ""}
              onChange={handleChange}
              placeholder="Classical / Bollywood / Guitar"
            />
          </label>

          <label>
            Experience (years)
            <input
              type="number"
              name="experience"
              value={form.experience || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Bio
            <textarea
              name="bio"
              rows="3"
              value={form.bio || ""}
              onChange={handleChange}
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Teacher"}
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
            background: rgba(0, 0, 0, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-box {
            background: #fff;
            width: 450px;
            max-width: 95%;
            border-radius: 14px;
            padding: 1.5rem;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          label {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-bottom: 1rem;
            font-weight: 500;
          }

          input,
          textarea {
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
        `}</style>
      </div>
    </div>
  );
}
