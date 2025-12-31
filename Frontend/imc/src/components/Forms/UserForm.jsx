import React, { useState } from "react";
import "./Forms.css";
export default function UserForm({ onClose }) {
  const [data, setData] = useState({ username: "", email: "", role: "" });
  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); alert("User Added!"); onClose(); };
  return (
    <div className="form-container">
      <h3>👥 User Management</h3>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input name="role" placeholder="Role (Admin/User)" onChange={handleChange} required />
        <div className="form-buttons"><button type="submit">Submit</button><button className="cancel-btn" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}
