import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Forms.css"; // Same beautiful style

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE}/auth/trainers/`;

export default function TrainerForm({ onClose }) {
  const [tab, setTab] = useState("ADD");
  const [formData, setFormData] = useState({
    trainer_name: "",
    mobile: "",
    email: "",
    batch_day: "",
    batch_start_time: "",
    batch_end_time: "",
    fee: "",
    notes: "",
  });
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  /* ---------------- FETCH TRAINERS ---------------- */
  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setTrainers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      setMessage("❌ Failed to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "VIEW") fetchTrainers();
  }, [tab]);

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    setFormData({
      trainer_name: "",
      mobile: "",
      email: "",
      batch_day: "",
      batch_start_time: "",
      batch_end_time: "",
      fee: "",
      notes: "",
    });
    setEditingId(null);
    setMessage("");
  };

  /* ---------------- SUBMIT (ADD / EDIT) ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!formData.batch_day) {
      setMessage("❌ Please select a day.");
      setSaving(false);
      return;
    }
    if (!formData.batch_start_time || !formData.batch_end_time) {
      setMessage("❌ Please select both start and end time.");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const method = editingId ? "patch" : "post";
      const url = editingId ? `${API_URL}${editingId}/` : API_URL;

      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMessage(`✅ Trainer ${editingId ? "updated" : "added"} successfully!`);
      resetForm();
      if (tab === "VIEW") fetchTrainers();
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.detail || "❌ Failed to save trainer. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- EDIT ---------------- */
  const startEdit = (trainer) => {
    setEditingId(trainer.id);
    setFormData({
      trainer_name: trainer.trainer_name || "",
      mobile: trainer.mobile || "",
      email: trainer.email || "",
      batch_day: trainer.batch_day || "",
      batch_start_time: trainer.batch_start_time || "",
      batch_end_time: trainer.batch_end_time || "",
      fee: trainer.fee || "",
      notes: trainer.notes || "",
    });
    setTab("ADD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- DELETE ---------------- */
  const deleteTrainer = async (id) => {
    if (!window.confirm("Delete this trainer permanently?")) return;

    try {
      const token = localStorage.getItem("access");
      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrainers((prev) => prev.filter((t) => t.id !== id));
      setMessage("✅ Trainer deleted");
    } catch (err) {
      setMessage("❌ Failed to delete trainer");
    }
  };

  /* ---------------- TIME INPUT COMPONENT ---------------- */
  const TimeInput = ({ name, value }) => (
    <div style={{ position: "relative" }}>
      <input
        type="time"
        name={name}
        value={value}
        onChange={handleChange}
        required
        style={{
          width: "100%",
          padding: "12px 40px 12px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 15,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#666",
          fontSize: "18px",
        }}
      >
        🕒
      </span>
    </div>
  );

  return (
    <div className="pf-wrap">
      {/* HEADER WITH TABS */}
      <div className="pf-header">
        <div className="sm-left">
          <div className="sm-icon">🎤</div>
          <div>
            <h2>Trainer Management</h2>
            <div className="pf-subtitle">
              Add and manage singing class trainers
            </div>
          </div>
        </div>

        <div className="pf-tabs sm-actions">
          <button
            className={tab === "ADD" ? "active" : ""}
            onClick={() => {
              setTab("ADD");
              resetForm();
            }}
          >
            Add Trainer
          </button>
          <button
            className={tab === "VIEW" ? "active" : ""}
            onClick={() => setTab("VIEW")}
          >
            View Trainers
          </button>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      {tab === "ADD" && (
        <form className="sm-form" onSubmit={handleSubmit}>
          <div className="grid two">
            <div className="field">
              <label>Trainer Name *</label>
              <input
                type="text"
                name="trainer_name"
                value={formData.trainer_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Mobile</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label>Batch Day *</label>
              <select
                name="batch_day"
                value={formData.batch_day}
                onChange={handleChange}
                required
                className="pf-select"
              >
                <option value="" disabled>Select day</option>
                {daysOfWeek.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Batch Start Time *</label>
              <TimeInput name="batch_start_time" value={formData.batch_start_time} />
            </div>

            <div className="field">
              <label>Batch End Time *</label>
              <TimeInput name="batch_end_time" value={formData.batch_end_time} />
            </div>

            <div className="field">
              <label>Monthly Fee (₹) *</label>
              <input
                type="number"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
              />
              <div className="sm-help-text">
                Optional: Experience, style, certifications...
              </div>
            </div>
          </div>

          {message && (
            <div className={`banner ${message.includes("✅") ? "pf-success" : "pf-error"}`}>
              {message}
            </div>
          )}

          <div className="sm-footer">
            <div className="note muted">
              Batch schedule example: Wednesday 6:00 PM – 7:30 PM
            </div>

            <div className="cta">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Trainer" : "Add Trainer"}
              </button>
              <button
                type="button"
                className="btn outline"
                onClick={resetForm}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW TRAINERS TABLE */}
      {tab === "VIEW" && (
        <div className="pf-table-card">
          <div className="pf-table-wrap">
            {loading ? (
              <div className="loader">Loading trainers...</div>
            ) : trainers.length === 0 ? (
              <div className="muted center">No trainers added yet</div>
            ) : (
              <table className="pf-table nice-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Batch Schedule</th>
                    <th>Fee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((t) => (
                    <tr key={t.id}>
                      <td className="td-main">{t.trainer_name}</td>
                      <td>
                        {t.mobile && <div>{t.mobile}</div>}
                        {t.email && <div>{t.email}</div>}
                      </td>
                      <td>
                        {t.batch_day} {t.batch_start_time} - {t.batch_end_time}
                      </td>
                      <td>₹{t.fee || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="mini" onClick={() => startEdit(t)}>
                            Edit
                          </button>
                          <button
                            className="mini danger"
                            onClick={() => deleteTrainer(t.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}