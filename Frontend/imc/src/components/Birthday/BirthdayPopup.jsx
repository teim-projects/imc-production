// src/components/Birthday/BirthdayPopup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FaTimes,
  FaBirthdayCake,
  FaEnvelope,
  FaDownload,
  FaPalette,
  FaCheckCircle,
  FaMicrophone,
  FaUserGraduate,
  FaClock,
} from "react-icons/fa";
import BirthdayPosterModal from "./BirthdayPosterModal";
import { fireCelebrationConfetti } from "./posterUtils";

const BASE_URL = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000/api";
const TODAY_API = `${BASE_URL.replace(/\/$/, "")}/auth/birthdays/today/`;

export default function BirthdayPopup({ onOpenFullList = () => {} }) {
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  // Check today's birthdays on mount and listen for custom trigger events
  useEffect(() => {
    checkBirthdays();

    const handleCustomTrigger = () => {
      checkBirthdays(true);
    };
    window.addEventListener("imc_trigger_birthday_popup", handleCustomTrigger);
    return () => {
      window.removeEventListener("imc_trigger_birthday_popup", handleCustomTrigger);
    };
  }, []);

  const fireConfettiCelebration = () => {
    fireCelebrationConfetti();
  };

  const checkBirthdays = async (forceOpen = false) => {
    try {
      const token = localStorage.getItem("access");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(TODAY_API, { headers });
      const data = res.data;

      if (data && data.today_birthdays && data.today_birthdays.length > 0) {
        setTodayBirthdays(data.today_birthdays);
        setUpcomingCount(data.upcoming_week_count || 0);

        const lastDismissed = localStorage.getItem("imc_birthday_popup_dismissed");
        const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

        if (forceOpen || !lastDismissed || parseInt(lastDismissed, 10) < fourHoursAgo) {
          setIsOpen(true);
          setTimeout(fireConfettiCelebration, 300);
          setHasTriggeredConfetti(true);
        }
      } else if (forceOpen) {
        // If force opened by admin preview button and no birthdays today:
        toast.info("No birthdays today, but showing sample preview of the alert popup!");
        setTodayBirthdays([
          {
            unique_id: "sample_celebrant",
            name: "Bharat Manoj Sharma",
            role: "Singer",
            role_type: "singer",
            turning_age: 24,
            display_dob: "Today",
            already_wished: false,
            email: "bharat@example.com",
            phone: "9834944461",
          },
        ]);
        setIsOpen(true);
        setTimeout(fireConfettiCelebration, 300);
      }
    } catch (err) {
      console.debug("Birthday popup check:", err?.message);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("imc_birthday_popup_dismissed", Date.now().toString());
  };

  const handleRemindLater = () => {
    setIsOpen(false);
    // Remind in 1 hour
    const oneHourFromNow = Date.now() - 3 * 60 * 60 * 1000;
    localStorage.setItem("imc_birthday_popup_dismissed", oneHourFromNow.toString());
    toast.info("Birthday reminder snoozed. We'll remind you later today!");
  };

  const handleOpenPoster = (person) => {
    setSelectedPerson(person);
    setIsPosterModalOpen(true);
  };

  if (!isOpen || todayBirthdays.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          animation: "fadeIn 0.25s ease-out",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #fde68a",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "640px",
            boxShadow: "0 25px 70px rgba(15, 23, 42, 0.25)",
            overflow: "hidden",
            color: "#0f172a",
            position: "relative",
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              padding: "26px 24px 18px",
              textAlign: "center",
              background: "linear-gradient(135deg, #fffdf5 0%, #ffffff 50%, #fef3c7 100%)",
              borderBottom: "1.5px solid #fde68a",
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                color: "#475569",
                cursor: "pointer",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                transition: "all 0.15s",
              }}
              title="Close"
            >
              <FaTimes size={14} />
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 18px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1.5px solid #f59e0b",
                color: "#92400e",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
                marginBottom: "10px",
              }}
            >
              <FaBirthdayCake /> TODAY'S CELEBRATION ALERT
            </div>

            <h2
              style={{
                margin: "4px 0 6px",
                fontSize: "24px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "0.2px",
              }}
            >
              🎉 Someone Has a Birthday Today! 🎂
            </h2>

            <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.5 }}>
              Celebrate your stars! Generate an official designer wish poster, download in HD, or send a personalized birthday email.
            </p>
          </div>

          {/* Birthday Celebrants List */}
          <div
            style={{
              padding: "18px 24px",
              maxHeight: "360px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#ffffff",
            }}
          >
            {todayBirthdays.map((person) => (
              <div
                key={person.unique_id}
                style={{
                  background: "#fffdf5",
                  border: "1.5px solid #fde68a",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
                  transition: "all 0.15s",
                }}
              >
                {/* Avatar & Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      padding: "2px",
                      background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
                    }}
                  >
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#92400e",
                          fontSize: "18px",
                        }}
                      >
                        {person.role_type === "singer" ? <FaMicrophone /> : <FaUserGraduate />}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: "15.5px", fontWeight: 800, color: "#0f172a" }}>
                        {person.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "8px",
                          background: person.role_type === "singer" ? "#f3e8ff" : "#e0f2fe",
                          color: person.role_type === "singer" ? "#7e22ce" : "#0369a1",
                          border: `1px solid ${person.role_type === "singer" ? "#e9d5ff" : "#bae6fd"}`,
                        }}
                      >
                        {person.role}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#b45309" }}>🎂 Today</span>
                      {person.turning_age && <span>• Turning {person.turning_age}</span>}
                      {person.already_wished ? (
                        <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "3px", fontWeight: 700 }}>
                          <FaCheckCircle size={11} /> Wish Sent!
                        </span>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 700 }}>• ⏳ Pending Wish</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenPoster(person)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <FaPalette size={13} />
                  <span>Open Poster</span>
                </button>
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: "16px 24px",
              background: "#f8fafc",
              borderTop: "1.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenFullList();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#0284c7",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              View Full Birthday Calendar →
            </button>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleRemindLater}
                style={{
                  padding: "8px 14px",
                  borderRadius: "9px",
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <FaClock size={11} /> Snooze (1h)
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  padding: "8px 18px",
                  borderRadius: "9px",
                  background: "#0f172a",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Poster Modal if selected */}
      {selectedPerson && (
        <BirthdayPosterModal
          person={selectedPerson}
          isOpen={isPosterModalOpen}
          onClose={() => {
            setIsPosterModalOpen(false);
            setSelectedPerson(null);
          }}
          onWishSent={() => {
            checkBirthdays();
          }}
        />
      )}
    </>
  );
}
