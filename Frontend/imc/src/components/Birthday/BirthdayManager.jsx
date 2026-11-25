// src/components/Birthday/BirthdayManager.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FaBirthdayCake,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEnvelope,
  FaPalette,
  FaCheckCircle,
  FaClock,
  FaSync,
  FaMicrophone,
  FaUserGraduate,
  FaUsers,
  FaStar,
  FaExclamationCircle,
  FaCalendarDay,
} from "react-icons/fa";
import BirthdayPosterModal from "./BirthdayPosterModal";
import { fireCelebrationConfetti, renderPosterToCanvas } from "./posterUtils";

const BASE_URL = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000/api";
const BIRTHDAY_LIST_API = `${BASE_URL.replace(/\/$/, "")}/auth/birthdays/`;
const SEND_WISH_API = `${BASE_URL.replace(/\/$/, "")}/auth/birthdays/send-wish/`;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function BirthdayManager({ onClose = null }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    today_count: 0,
    upcoming_week_count: 0,
    upcoming_month_count: 0,
    total_with_birthdays: 0,
    today_birthdays: [],
    upcoming_birthdays: [],
    results: [],
  });

  // Filters & State
  const [activeTab, setActiveTab] = useState("all"); // 'today', 'upcoming_7', 'upcoming_30', 'all'
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // 'all', 'singer', 'student'
  const [monthFilter, setMonthFilter] = useState(""); // '', '1'..'12'

  // Modal State
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Hidden offscreen renderer for quick download
  const [quickDownloadingId, setQuickDownloadingId] = useState(null);

  // Fetch Birthday Data
  const fetchBirthdays = async (tab = activeTab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {
        filter: tab,
        role: roleFilter,
        search: search.trim(),
      };
      if (monthFilter) params.month = monthFilter;

      const res = await axios.get(BIRTHDAY_LIST_API, { headers, params });
      setData(res.data);

      // Auto-switch to today tab on initial load if today has birthdays
      if (tab === "all" && res.data.today_count > 0 && !search && !monthFilter && roleFilter === "all") {
        setActiveTab("today");
      }
    } catch (err) {
      console.error("Birthday list fetch error:", err);
      toast.error("Failed to load birthdays: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays(activeTab);
  }, [activeTab, roleFilter, monthFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBirthdays(activeTab);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Quick Celebration Trigger
  const triggerCelebration = () => {
    fireCelebrationConfetti();
  };

  // Open Poster Studio
  const handleOpenPoster = (person) => {
    setSelectedPerson(person);
    setIsPosterModalOpen(true);
  };

  // Quick HD Poster Download without opening modal
  const handleQuickDownload = async (person) => {
    try {
      setQuickDownloadingId(person.unique_id);
      setSelectedPerson(person);
      toast.info(`Generating poster for ${person.name}...`);

      const canvas = await renderPosterToCanvas({
        name: person.name,
        role: person.role,
        photo: person.photo,
        birthDate: person.display_dob || person.formatted_birth_date || "Today",
        turningAge: person.turning_age,
        message: "May your special day shine with happiness and laughter always.",
        themeId: "yellow_classic",
      });

      const safeName = (person.name || "Member").replace(/\s+/g, "_");
      const link = document.createElement("a");
      link.download = `IMC_Birthday_Poster_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success(`Poster for ${person.name} downloaded successfully! 📥`);
    } catch (err) {
      console.error("Quick download error:", err);
      toast.error("Failed to download poster: " + (err.message || "Unknown error"));
    } finally {
      setQuickDownloadingId(null);
    }
  };

  // Quick Direct Email Send
  const handleQuickEmail = async (person) => {
    if (!person.email) {
      toast.error(`No email address on file for ${person.name}. Open poster to enter one!`);
      handleOpenPoster(person);
      return;
    }

    try {
      setQuickDownloadingId(person.unique_id);
      setSelectedPerson(person);
      toast.info(`Preparing poster & sending email to ${person.email}...`);

      const canvas = await renderPosterToCanvas({
        name: person.name,
        role: person.role,
        photo: person.photo,
        birthDate: person.display_dob || person.formatted_birth_date || "Today",
        turningAge: person.turning_age,
        message: "May your special day shine with happiness and laughter always.",
        themeId: "yellow_classic",
      });

      const posterBase64 = canvas.toDataURL("image/png");
      const token = localStorage.getItem("access");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        email: person.email,
        name: person.name,
        role: person.role,
        subject: `🎉 Happy Birthday ${person.name}! - Musical Wishes from IMC Music Hub 🎂🎶`,
        message: `Wishing you a wonderful Birthday! May your special day and the year ahead be blessed with melodious harmonies, success, and pure joy. Thank you for being a cherished part of IMC Music Hub!`,
        poster_base64: posterBase64,
        person_id: person.source_id,
        person_type: person.role_type,
      };

      const res = await axios.post(SEND_WISH_API, payload, { headers });
      if (res.data?.success) {
        toast.success(`Birthday email sent to ${person.email}! 📧🎉`);
        fetchBirthdays(activeTab);
      } else {
        toast.error(res.data?.error || "Failed to send email");
      }
    } catch (err) {
      console.error("Quick email error:", err);
      toast.error("Email send failed: " + (err.response?.data?.error || err.message));
    } finally {
      setQuickDownloadingId(null);
    }
  };

  const records = data.results || [];

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. TOP HEADER BANNER */}
      <div
        style={{
          background: "linear-gradient(90deg, #fffdf5 0%, #ffffff 50%, #f0f7ff 100%)",
          border: "1.5px solid #e2e8f0",
          borderRadius: "18px",
          padding: "20px 24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "1.5px solid #f59e0b",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.2)",
              flexShrink: 0,
            }}
          >
            🎂
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.2px" }}>
                Birthday Automation & Wishes Studio
              </h1>
              {data.today_count > 0 && (
                <span
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "999px",
                  }}
                >
                  🎉 {data.today_count} Today!
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#64748b" }}>
              Automated birthday tracking, HD poster generator, and email delivery for all registered Singers & Students.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {data.today_count > 0 && (
            <button
              type="button"
              onClick={triggerCelebration}
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(236, 72, 153, 0.25)",
              }}
            >
              🎉 Confetti Party
            </button>
          )}

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("imc_trigger_birthday_popup"))}
            title="Preview how the automatic Birthday Alert Popup looks upon Admin Login"
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              color: "#b45309",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 5px rgba(245, 158, 11, 0.08)",
              transition: "all 0.15s",
            }}
          >
            <span>🔔</span>
            <span>Alert Popup Preview</span>
          </button>

          <button
            type="button"
            onClick={() => fetchBirthdays(activeTab)}
            disabled={loading}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#334155",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
              transition: "all 0.15s",
            }}
          >
            <FaSync className={loading ? "animate-spin" : ""} size={12} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Card 1: Today's Birthdays */}
        <div
          onClick={() => setActiveTab("today")}
          style={{
            background: activeTab === "today" ? "#fffdf5" : "#ffffff",
            border: activeTab === "today" ? "2px solid #f59e0b" : "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            cursor: "pointer",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: activeTab === "today" ? "0 8px 24px -4px rgba(245, 158, 11, 0.2)" : "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Today's Birthdays
            </span>
            <h3 style={{ margin: "4px 0 2px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
              {data.today_count}
            </h3>
            <span style={{ fontSize: "11.5px", color: data.today_count > 0 ? "#059669" : "#64748b", fontWeight: 600 }}>
              {data.today_count > 0 ? "✨ Needs wishing today!" : "None today"}
            </span>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "1.5px solid #fde68a",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            🎂
          </div>
        </div>

        {/* Card 2: Upcoming 7 Days */}
        <div
          onClick={() => setActiveTab("upcoming_7")}
          style={{
            background: activeTab === "upcoming_7" ? "#faf5ff" : "#ffffff",
            border: activeTab === "upcoming_7" ? "2px solid #a855f7" : "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            cursor: "pointer",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: activeTab === "upcoming_7" ? "0 8px 24px -4px rgba(168, 85, 247, 0.2)" : "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Next 7 Days
            </span>
            <h3 style={{ margin: "4px 0 2px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
              {data.upcoming_week_count}
            </h3>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>
              Coming up this week
            </span>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
              border: "1.5px solid #e9d5ff",
              color: "#7e22ce",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            <FaCalendarDay />
          </div>
        </div>

        {/* Card 3: Upcoming 30 Days */}
        <div
          onClick={() => setActiveTab("upcoming_30")}
          style={{
            background: activeTab === "upcoming_30" ? "#f0f7ff" : "#ffffff",
            border: activeTab === "upcoming_30" ? "2px solid #0284c7" : "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            cursor: "pointer",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: activeTab === "upcoming_30" ? "0 8px 24px -4px rgba(2, 132, 199, 0.2)" : "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Next 30 Days
            </span>
            <h3 style={{ margin: "4px 0 2px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
              {data.upcoming_month_count}
            </h3>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>
              Coming this month
            </span>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
              border: "1.5px solid #bae6fd",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            <FaCalendarAlt />
          </div>
        </div>

        {/* Card 4: Total Records with DOB */}
        <div
          onClick={() => setActiveTab("all")}
          style={{
            background: activeTab === "all" ? "#f0fdf4" : "#ffffff",
            border: activeTab === "all" ? "2px solid #10b981" : "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            cursor: "pointer",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: activeTab === "all" ? "0 8px 24px -4px rgba(16, 185, 129, 0.2)" : "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Members
            </span>
            <h3 style={{ margin: "4px 0 2px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
              {data.total_with_birthdays}
            </h3>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>
              Singers & Students
            </span>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              border: "1.5px solid #bbf7d0",
              color: "#047857",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            <FaUsers />
          </div>
        </div>
      </div>

      {/* 3. TABS AND SEARCH / FILTER BAR */}
      <div
        style={{
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          borderRadius: "16px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "today", label: "Today's Birthdays", badge: data.today_count, icon: "🎂", accent: "#d97706" },
            { id: "upcoming_7", label: "Next 7 Days", badge: data.upcoming_week_count, icon: "⚡", accent: "#7c3aed" },
            { id: "upcoming_30", label: "Next 30 Days", badge: data.upcoming_month_count, icon: "📅", accent: "#0284c7" },
            { id: "all", label: "All Members", badge: data.total_with_birthdays, icon: "📜", accent: "#059669" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#0f172a" : "#475569",
                  border: isActive ? "1.5px solid #cbd5e1" : "1.5px solid transparent",
                  fontSize: "12.5px",
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isActive ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && (
                  <span
                    style={{
                      background: isActive ? "#f1f5f9" : "#e2e8f0",
                      color: isActive ? tab.accent : "#475569",
                      border: isActive ? "1px solid #cbd5e1" : "none",
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters: Search, Role, Month */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                fontSize: "12px",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 14px 8px 34px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1.5px solid #cbd5e1",
                color: "#0f172a",
                fontSize: "12.5px",
                width: "200px",
                outline: "none",
                fontWeight: 500,
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#0f172a",
              fontSize: "12.5px",
              outline: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <option value="all">All Roles</option>
            <option value="singer">Singers Only</option>
            <option value="student">Students Only</option>
          </select>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#0f172a",
              fontSize: "12.5px",
              outline: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <option value="">All Months</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. BIRTHDAY RECORDS TABLE / LIST */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {records.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎂</div>
            <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>
              {activeTab === "today" ? "No Birthdays Today!" : "No Records Found"}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              {activeTab === "today"
                ? "No singers or students have a birthday today. Check upcoming birthdays in the next 7 or 30 days!"
                : "Try adjusting your search or filters to see more members."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1.5px solid #e2e8f0",
                    color: "#475569",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>Member</th>
                  <th style={{ padding: "14px 16px" }}>Role</th>
                  <th style={{ padding: "14px 16px" }}>Birth Date</th>
                  <th style={{ padding: "14px 16px" }}>Timing / Countdown</th>
                  <th style={{ padding: "14px 16px" }}>Contact</th>
                  <th style={{ padding: "14px 16px" }}>Wish Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((person) => {
                  const isToday = person.is_today;
                  const isSent = person.wish_status === "sent";

                  return (
                    <tr
                      key={person.unique_id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isToday ? "#fffbeb" : "#ffffff",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* 1. Member Column */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "50%",
                              padding: "2px",
                              background: isToday
                                ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                                : "linear-gradient(135deg, #38bdf8, #818cf8)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: isToday ? "0 0 10px rgba(245, 158, 11, 0.35)" : "none",
                            }}
                          >
                            {person.photo ? (
                              <img
                                src={person.photo}
                                alt={person.name}
                                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%",
                                  background: "#f1f5f9",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: isToday ? "#d97706" : "#6366f1",
                                  fontSize: "16px",
                                }}
                              >
                                {person.role_type === "singer" ? <FaMicrophone /> : <FaUserGraduate />}
                              </div>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                              {person.name}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                              {person.city ? `📍 ${person.city}` : person.source_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role Column */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "8px",
                            background: person.role_type === "singer" ? "#f3e8ff" : "#e0f2fe",
                            color: person.role_type === "singer" ? "#7e22ce" : "#0369a1",
                            border: `1px solid ${person.role_type === "singer" ? "#e9d5ff" : "#bae6fd"}`,
                          }}
                        >
                          {person.role}
                        </span>
                      </td>

                      {/* 3. Birth Date Column */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {person.display_dob || person.formatted_birth_date}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {person.turning_age ? `Turning ${person.turning_age}` : "DOB recorded"}
                        </div>
                      </td>

                      {/* 4. Timing / Countdown */}
                      <td style={{ padding: "14px 16px" }}>
                        {isToday ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                              color: "#ffffff",
                              fontWeight: 800,
                              fontSize: "11.5px",
                              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                            }}
                          >
                            🎂 TODAY!
                          </span>
                        ) : person.days_until === 1 ? (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              background: "#fef3c7",
                              color: "#92400e",
                              fontWeight: 700,
                              fontSize: "11.5px",
                              border: "1px solid #fde68a",
                            }}
                          >
                            ⚡ Tomorrow!
                          </span>
                        ) : person.days_until <= 7 ? (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              background: "#f3e8ff",
                              color: "#7e22ce",
                              fontWeight: 700,
                              fontSize: "11.5px",
                              border: "1px solid #e9d5ff",
                            }}
                          >
                            In {person.days_until} days
                          </span>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
                            In {person.days_until} days
                          </span>
                        )}
                      </td>

                      {/* 5. Contact Column */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 500 }}>
                          {person.email || "—"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {person.phone || "—"}
                        </div>
                      </td>

                      {/* 6. Wish Status */}
                      <td style={{ padding: "14px 16px" }}>
                        {isSent ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#059669",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <FaCheckCircle size={12} /> Wish Sent!
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#d97706",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <FaClock size={11} /> Pending
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {/* Generate Poster Studio Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPoster(person)}
                            title="Generate and customize attractive birthday poster"
                            style={{
                              padding: "8px 14px",
                              borderRadius: "9px",
                              background: isToday
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : "linear-gradient(135deg, #6366f1, #4f46e5)",
                              border: "none",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: isToday ? "0 2px 10px rgba(245, 158, 11, 0.3)" : "0 2px 8px rgba(79, 70, 229, 0.25)",
                              transition: "all 0.15s",
                            }}
                          >
                            <FaPalette size={12} />
                            <span>Poster Studio</span>
                          </button>

                          {/* Quick Download */}
                          <button
                            type="button"
                            onClick={() => handleQuickDownload(person)}
                            disabled={quickDownloadingId === person.unique_id}
                            title="Quick Download HD Poster"
                            style={{
                              padding: "8px 11px",
                              borderRadius: "9px",
                              background: "#ffffff",
                              border: "1.5px solid #a7f3d0",
                              color: "#059669",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                          >
                            <FaDownload size={12} />
                          </button>

                          {/* Quick Email */}
                          <button
                            type="button"
                            onClick={() => handleQuickEmail(person)}
                            disabled={quickDownloadingId === person.unique_id}
                            title={person.email ? `Send birthday email to ${person.email}` : "No email available"}
                            style={{
                              padding: "8px 11px",
                              borderRadius: "9px",
                              background: "#ffffff",
                              border: "1.5px solid #bae6fd",
                              color: "#0284c7",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                          >
                            <FaEnvelope size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POSTER STUDIO MODAL */}
      {selectedPerson && isPosterModalOpen && (
        <BirthdayPosterModal
          person={selectedPerson}
          isOpen={isPosterModalOpen}
          onClose={() => {
            setIsPosterModalOpen(false);
            setSelectedPerson(null);
          }}
          onWishSent={() => {
            fetchBirthdays(activeTab);
          }}
        />
      )}
    </div>
  );
}
