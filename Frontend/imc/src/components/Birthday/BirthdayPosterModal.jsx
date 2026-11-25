// src/components/Birthday/BirthdayPosterModal.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FaDownload,
  FaEnvelope,
  FaTimes,
  FaCamera,
  FaUndo,
  FaPalette,
  FaSpinner,
  FaMusic,
  FaCopy,
  FaEye,
  FaFileImage,
  FaSlidersH,
  FaQuoteLeft,
  FaUser,
  FaBirthdayCake,
  FaCheckCircle,
} from "react-icons/fa";
import BirthdayPoster, { POSTER_THEMES } from "./BirthdayPoster";
import { renderPosterToCanvas } from "./posterUtils";

const BASE_URL = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000/api";
const SEND_WISH_URL = `${BASE_URL.replace(/\/$/, "")}/auth/birthdays/send-wish/`;

export default function BirthdayPosterModal({
  person,
  isOpen,
  onClose,
  onWishSent = () => {},
}) {
  if (!isOpen || !person) return null;

  // Active Tab in Studio: 'style', 'details', 'wishes', 'email'
  const [activeTab, setActiveTab] = useState("style");

  // Initial values from selected person
  const [name, setName] = useState(person.name || "");
  const [role, setRole] = useState(person.role || (person.role_type === "singer" ? "Singer" : "Student"));
  const [birthDate, setBirthDate] = useState(person.display_dob || person.formatted_birth_date || "Today");
  const [turningAge, setTurningAge] = useState(person.turning_age || "");
  const [email, setEmail] = useState(person.email || "");
  const [phone, setPhone] = useState(person.phone || "");
  const [themeId, setThemeId] = useState("yellow_classic");
  const [photo, setPhoto] = useState(person.photo || null);
  const [photoScale, setPhotoScale] = useState(1);
  const [customPhotoFile, setCustomPhotoFile] = useState(null);

  const [message, setMessage] = useState(
    "May your special day shine with happiness and laughter always."
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    `🎉 Happy Birthday ${person.name || ""}! - Special Wishes from IMC Music Hub 🎂🎶`
  );

  // Full-size HD Canvas Preview State
  const [showHdPreview, setShowHdPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const posterRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP)");
        return;
      }
      setCustomPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
        toast.success("Photo loaded successfully! Adjust Face Zoom if needed.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate Canvas
  const generatePosterCanvas = async () => {
    return await renderPosterToCanvas({
      name: name || "Member",
      role: role || "Star",
      photo,
      birthDate: birthDate || "Today",
      turningAge,
      message,
      themeId,
      photoScale,
    });
  };

  // Inspect HD Render
  const handleOpenHdPreview = async () => {
    try {
      setIsPreviewLoading(true);
      setShowHdPreview(true);
      const canvas = await generatePosterCanvas();
      if (canvas) {
        setPreviewDataUrl(canvas.toDataURL("image/png"));
      }
    } catch (e) {
      toast.error("Could not preview HD render: " + e.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Download Poster as PNG or JPG using Blob
  const handleDownload = async (format = "png") => {
    try {
      setIsExporting(true);
      toast.info("Generating crystal-clear HD Birthday Poster (1080x1350)...");
      const canvas = await generatePosterCanvas();
      if (!canvas) throw new Error("Could not capture poster canvas");

      const mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
      const ext = format === "jpg" || format === "jpeg" ? "jpg" : "png";
      const safeName = (name || "Member").replace(/\s+/g, "_");

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const link = document.createElement("a");
            link.download = `IMC_Birthday_Poster_${safeName}.${ext}`;
            link.href = canvas.toDataURL(mimeType, 0.95);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `IMC_Birthday_Poster_${safeName}.${ext}`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }, 1500);
          }
          toast.success(`HD Birthday Poster downloaded successfully! (${ext.toUpperCase()}) 📥✨`);
          setIsExporting(false);
        },
        mimeType,
        0.95
      );
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export poster: " + (err.message || "Unknown error"));
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      toast.info("Generating poster for clipboard...");
      const canvas = await generatePosterCanvas();
      if (!canvas) throw new Error("Could not create poster canvas");

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob creation failed");
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            toast.success("Poster copied to clipboard! Paste (Ctrl+V) directly in WhatsApp or Email 📋🎉");
          } else {
            toast.info("Clipboard API not supported in this browser. Please use Download button.");
          }
        } catch (copyErr) {
          console.warn("Clipboard write error:", copyErr);
          toast.info("Could not copy directly. Please use Download button instead.");
        }
      }, "image/png");
    } catch (err) {
      toast.error("Failed to copy poster: " + err.message);
    }
  };

  // Send Poster via Email
  const handleSendEmail = async () => {
    if (!email) {
      toast.error("Please provide a recipient email address!");
      setActiveTab("email");
      return;
    }

    try {
      setIsSendingEmail(true);
      toast.info("Generating poster and sending email...");

      const canvas = await generatePosterCanvas();
      if (!canvas) throw new Error("Could not capture poster canvas");

      const posterBase64 = canvas.toDataURL("image/png");

      const token = localStorage.getItem("access");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        email: email.trim(),
        name: name.trim(),
        role: role.trim(),
        subject: emailSubject.trim(),
        message: message.trim(),
        poster_base64: posterBase64,
        person_id: person.source_id || person.unique_id,
        person_type: person.role_type || "singer",
      };

      const response = await axios.post(SEND_WISH_URL, payload, { headers });

      if (response.data?.success) {
        toast.success(`Birthday wish email sent successfully to ${email}! 📧🎉`);
        onWishSent(person.unique_id);
      } else {
        toast.error(response.data?.error || "Failed to send email");
      }
    } catch (err) {
      console.error("Email send error:", err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message;
      toast.error(`Error sending email: ${msg}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1220px",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
          color: "#0f172a",
        }}
      >
        {/* Studio Top Header */}
        <div
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, #f8fafc 0%, #ffffff 50%, #fffdfa 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1.5px solid #f59e0b",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "22px",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
              }}
            >
              🎂
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.2px" }}>
                  IMC Birthday Poster Studio
                </h3>
                <span
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    color: "#92400e",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                  }}
                >
                  HD 1080×1350
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#475569" }}>
                Select official designer template, customize celebrant photo & details, and export instantly
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                color: "#334155",
                cursor: "pointer",
                borderRadius: "10px",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                transition: "all 0.15s",
              }}
              title="Close"
            >
              <FaTimes size={14} /> Close
            </button>
          </div>
        </div>

        {/* Studio Body: Left Stage (Poster) + Right Controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: "24px",
            padding: "22px 28px",
            overflowY: "auto",
            flex: 1,
            background: "#ffffff",
          }}
        >
          {/* LEFT: Poster Exhibition Artboard Stage */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Stage Bar */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "0 4px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaMusic color="#f59e0b" /> Real Graphic Poster Preview
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleOpenHdPreview}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#b45309",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Inspect Full 1080x1350 Canvas Output"
                >
                  <FaEye /> Inspect HD
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    color: "#0369a1",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Copy Poster to Clipboard for WhatsApp/Gmail (Ctrl+V)"
                >
                  <FaCopy /> Copy
                </button>
              </div>
            </div>

            {/* Poster Mount Container */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                paddingBottom: "10px",
              }}
            >
              <div
                style={{
                  transform: "scale(0.88)",
                  transformOrigin: "top center",
                  margin: "-15px 0",
                  filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.18))",
                }}
              >
                <BirthdayPoster
                  ref={posterRef}
                  name={name}
                  role={role}
                  photo={photo}
                  birthDate={birthDate}
                  turningAge={turningAge}
                  message={message}
                  themeId={themeId}
                  photoScale={photoScale}
                  width={490}
                />
              </div>
            </div>

            {/* Quick Export Bar under the poster */}
            <div
              style={{
                width: "100%",
                display: "flex",
                gap: "10px",
                marginTop: "14px",
                paddingTop: "14px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={isExporting}
                style={{
                  flex: 2,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: isExporting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)",
                  transition: "all 0.15s",
                }}
              >
                {isExporting ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                <span>Download HD Poster (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload("jpg")}
                disabled={isExporting}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#1e293b",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isExporting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
                }}
                title="Download in compressed JPG format"
              >
                <FaFileImage /> JPG
              </button>
            </div>
          </div>

          {/* RIGHT: Studio Control Center */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
              paddingRight: "6px",
            }}
          >
            {/* Studio Navigation Tabs (4 Clear Pastel Steps) */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                padding: "5px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                gap: "4px",
              }}
            >
              {[
                { id: "style", label: "1. Poster Styles", icon: <FaPalette />, accent: "#d97706" },
                { id: "details", label: "2. Celebrant & Photo", icon: <FaUser />, accent: "#0284c7" },
                { id: "wishes", label: "3. Custom Wish", icon: <FaQuoteLeft />, accent: "#7c3aed" },
                { id: "email", label: "4. Send Email", icon: <FaEnvelope />, accent: "#059669" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: isActive ? "1.5px solid #cbd5e1" : "1.5px solid transparent",
                      background: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#0f172a" : "#475569",
                      fontSize: "12px",
                      fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: isActive ? "0 3px 10px rgba(15, 23, 42, 0.08)" : "none",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: isActive ? tab.accent : "#64748b", display: "flex", alignItems: "center" }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: POSTER STYLES */}
            {activeTab === "style" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                    Select Official IMC Birthday Poster Style:
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>
                    3 Designer Layouts
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                  {[
                    {
                      id: "yellow_classic",
                      tag: "Ref 1 • Polaroid",
                      title: "Sunshine Gold (Polaroid & Gold Balloons)",
                      desc: "Yellow backdrop, blue polaroid frame, musical doodles & metallic 3D gold balloons",
                      emoji: "☀️",
                      selectedBg: "#fffdf5",
                      selectedBorder: "#f59e0b",
                      selectedShadow: "0 6px 20px -3px rgba(245, 158, 11, 0.22)",
                      iconBg: "linear-gradient(135deg, #fef3c7, #fde68a)",
                      iconBorder: "#f59e0b",
                      badgeBg: "#fef3c7",
                      badgeBorder: "#fde68a",
                      badgeColor: "#92400e",
                      accentColor: "#f59e0b",
                      defaultMsg: POSTER_THEMES.yellow_classic.defaultMessage,
                    },
                    {
                      id: "ivory_celebration",
                      tag: "Ref 2 • Festive Cake",
                      title: "Ivory Celebration (Cake & Royal Gifts)",
                      desc: "Soft cream backdrop, rounded orange frame, 3D gold cake & royal gifts",
                      emoji: "🎂",
                      selectedBg: "#fffaf5",
                      selectedBorder: "#ea580c",
                      selectedShadow: "0 6px 20px -3px rgba(234, 88, 12, 0.22)",
                      iconBg: "linear-gradient(135deg, #ffedd5, #fed7aa)",
                      iconBorder: "#ea580c",
                      badgeBg: "#ffedd5",
                      badgeBorder: "#fed7aa",
                      badgeColor: "#9a3412",
                      accentColor: "#ea580c",
                      defaultMsg: POSTER_THEMES.ivory_celebration.defaultMessage,
                    },
                    {
                      id: "royal_blue_blast",
                      tag: "Ref 3 • Ribbon Banner",
                      title: "Royal Blue & Gold (Party Poppers & Ribbon)",
                      desc: "Royal blue backdrop, circular gold frame, orange ribbon banner & balloons",
                      emoji: "🎆",
                      selectedBg: "#f0f7ff",
                      selectedBorder: "#2563eb",
                      selectedShadow: "0 6px 20px -3px rgba(37, 99, 235, 0.22)",
                      iconBg: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                      iconBorder: "#2563eb",
                      badgeBg: "#dbeafe",
                      badgeBorder: "#bfdbfe",
                      badgeColor: "#1e40af",
                      accentColor: "#2563eb",
                      defaultMsg: POSTER_THEMES.royal_blue_blast.defaultMessage,
                    },
                  ].map((style) => {
                    const isSelected = themeId === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => {
                          setThemeId(style.id);
                          if (!message || Object.values(POSTER_THEMES).some((t) => t.defaultMessage === message)) {
                            setMessage(style.defaultMsg);
                          }
                        }}
                        style={{
                          padding: "15px 18px",
                          borderRadius: "15px",
                          border: isSelected ? `2px solid ${style.selectedBorder}` : "1.5px solid #e2e8f0",
                          background: isSelected ? style.selectedBg : "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.18s ease",
                          boxShadow: isSelected ? style.selectedShadow : "0 1px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "12px",
                              background: isSelected ? style.iconBg : "#f8fafc",
                              border: isSelected ? `1.5px solid ${style.iconBorder}` : "1.5px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              flexShrink: 0,
                              boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                            }}
                          >
                            {style.emoji}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: "14.5px",
                                  color: "#0f172a",
                                  letterSpacing: "0.1px",
                                }}
                              >
                                {style.title}
                              </span>
                              <span
                                style={{
                                  background: style.badgeBg,
                                  border: `1px solid ${style.badgeBorder}`,
                                  color: style.badgeColor,
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {style.tag}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "12.5px",
                                color: isSelected ? "#334155" : "#64748b",
                                fontWeight: 500,
                                lineHeight: "1.4",
                              }}
                            >
                              {style.desc}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginLeft: "12px", flexShrink: 0 }}>
                          {isSelected ? (
                            <FaCheckCircle color={style.accentColor} size={20} />
                          ) : (
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                border: "2px solid #cbd5e1",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 1 Next Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    style={{
                      padding: "11px 20px",
                      borderRadius: "11px",
                      background: "#0f172a",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    <span>Next: Celebrant & Photo</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CELEBRANT & PHOTO */}
            {activeTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Photo Upload & Zoom */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px dashed #cbd5e1",
                    borderRadius: "14px",
                    padding: "15px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaCamera color="#0284c7" /> Celebrant Photo
                    </span>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setCustomPhotoFile(null);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FaUndo size={10} /> Reset Photo
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #0284c7",
                      color: "#0284c7",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 6px rgba(2, 132, 199, 0.08)",
                      transition: "all 0.15s",
                    }}
                  >
                    <FaCamera /> {photo ? "Change / Upload New Photo" : "Upload Celebrant Photo (PNG, JPG)"}
                  </button>

                  {photo && (
                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#ffffff",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>Face Zoom:</span>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.05"
                        value={photoScale}
                        onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: "#0284c7", cursor: "pointer" }}
                      />
                      <span
                        style={{
                          background: "#e0f2fe",
                          color: "#0369a1",
                          border: "1px solid #bae6fd",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {Math.round(photoScale * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Celebrant Name */}
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#1e293b", fontWeight: 700, marginBottom: "5px" }}>
                    Celebrant Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Role with Quick Preset Pills */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                    <label style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 700 }}>Role / Title</label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick Presets:</span>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {["Singer", "Student", "VIP Star", "Rockstar", "Maestro"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: role === r ? "#e0f2fe" : "#f1f5f9",
                          border: role === r ? "1.5px solid #0284c7" : "1px solid #e2e8f0",
                          color: role === r ? "#0369a1" : "#475569",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Singer, Student, Star..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Date & Milestone */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", color: "#1e293b", fontWeight: 700, marginBottom: "5px" }}>
                      Display Birth Date
                    </label>
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="e.g. 29 / 12 / 2022"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#0f172a",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", color: "#1e293b", fontWeight: 700, marginBottom: "5px" }}>
                      Milestone Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={turningAge}
                      onChange={(e) => setTurningAge(e.target.value)}
                      placeholder="e.g. 25"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#0f172a",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Step 2 Navigation Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("style")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1.5px solid #e2e8f0",
                      color: "#334155",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Styles
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("wishes")}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      background: "#0f172a",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>Next: Custom Wish</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM WISH */}
            {activeTab === "wishes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13.5px", color: "#0f172a", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaQuoteLeft color="#7c3aed" size={13} /> Celebration Message (Shown on Poster)
                    </label>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick Presets:</span>
                  </div>

                  <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#475569" }}>
                    Select a greeting preset or write your own personalized celebration wish:
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    {[
                      {
                        label: "🎤 Singer Star",
                        text: "Wishing our incredible singing star a very Happy Birthday! May your melodious voice keep touching hearts always!",
                        accent: "#92400e",
                        bg: "#fef3c7",
                        border: "#fde68a",
                      },
                      {
                        label: "🎓 Student Joy",
                        text: "Happy Birthday to our brightest academy student! May this year elevate your vocal mastery and musical dreams!",
                        accent: "#0369a1",
                        bg: "#e0f2fe",
                        border: "#bae6fd",
                      },
                      {
                        label: "🌟 VIP Harmony",
                        text: "May your special day and the year ahead be filled with harmonious melodies, boundless success, and glorious health!",
                        accent: "#6b21a8",
                        bg: "#f3e8ff",
                        border: "#e9d5ff",
                      },
                      {
                        label: "🎂 Classic Joy",
                        text: "May your special day shine with happiness, beautiful moments, and laughter always.",
                        accent: "#065f46",
                        bg: "#ecfdf5",
                        border: "#a7f3d0",
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessage(preset.text)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: message === preset.text ? preset.bg : "#ffffff",
                          border: message === preset.text ? `1.5px solid ${preset.accent}` : "1.5px solid #e2e8f0",
                          color: message === preset.text ? preset.accent : "#334155",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          boxShadow: message === preset.text ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter personalized birthday message..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "13px",
                      outline: "none",
                      resize: "vertical",
                      lineHeight: "1.5",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{message.length} characters</span>
                  </div>
                </div>

                {/* Step 3 Navigation Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1.5px solid #e2e8f0",
                      color: "#334155",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Celebrant
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("email")}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      background: "#0f172a",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>Next: Send Email</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SEND EMAIL */}
            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  Direct Birthday Wish Dispatch:
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#1e293b", fontWeight: 700, marginBottom: "5px" }}>
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. celebrant@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#1e293b", fontWeight: 700, marginBottom: "5px" }}>
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "12.5px",
                    color: "#0369a1",
                    lineHeight: 1.5,
                  }}
                >
                  ℹ️ The generated 1080x1350 HD poster will be automatically embedded inline into the email HTML and also attached as a high-resolution downloadable image file.
                </div>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: isSendingEmail ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(5, 150, 105, 0.35)",
                    transition: "all 0.15s",
                    marginTop: "6px",
                  }}
                >
                  {isSendingEmail ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                  <span>Send Birthday Wish with Poster Attachment</span>
                </button>

                {/* Step 4 Back Button */}
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("wishes")}
                    style={{
                      padding: "9px 15px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1.5px solid #e2e8f0",
                      color: "#334155",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Custom Wish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL 1080x1350 HD CANVAS INSPECTION MODAL */}
      {showHdPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(0, 0, 0, 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              <span>🔍 1080×1350 Crystal-Clear HD Canvas Export Preview</span>
              <button
                onClick={() => setShowHdPreview(false)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Close ✕
              </button>
            </div>

            {isPreviewLoading ? (
              <div style={{ color: "#fbbf24", padding: "50px", fontSize: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <FaSpinner className="animate-spin" /> Rendering Full HD 1080×1350 Canvas...
              </div>
            ) : previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="HD Poster Preview"
                style={{
                  maxHeight: "82vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                  borderRadius: "14px",
                  boxShadow: "0 25px 70px rgba(0,0,0,0.95)",
                  border: "2px solid rgba(251, 191, 36, 0.5)",
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
