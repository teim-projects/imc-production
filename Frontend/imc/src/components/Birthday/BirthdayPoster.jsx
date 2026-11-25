// src/components/Birthday/BirthdayPoster.jsx
import React, { forwardRef } from "react";
import template1Master from "../../assets/template1_master.png";
import template2Master from "../../assets/template2_master.png";
import template3Master from "../../assets/template3_master.png";

/* ============================================================
   OFFICIAL IMC POSTER TEMPLATES & METADATA
============================================================ */
export const POSTER_TEMPLATES = {
  yellow_classic: {
    id: "yellow_classic",
    name: "Sunshine Gold (Polaroid & 3D Gold Balloons)",
    badge: "Official Ref 1",
    category: "classic",
    bgColor: "#f8ca44",
    bannerColor: "#f8ca44",
    borderGold: "#12437b",
    accentLight: "#fef5d0",
    defaultMessage: "May your special day shine with happiness and laughter always.",
    overlay: template1Master,
  },
  ivory_celebration: {
    id: "ivory_celebration",
    name: "Ivory Celebration (Cake & Royal Gifts)",
    badge: "Official Ref 2",
    category: "celebration",
    bgColor: "#fff9e6",
    bannerColor: "#fff9e6",
    borderGold: "#ea580c",
    accentLight: "#fef3c7",
    defaultMessage: "Have a fantastic birthday filled with beautiful moments and happy memories.",
    overlay: template2Master,
  },
  royal_blue_blast: {
    id: "royal_blue_blast",
    name: "Royal Blue & Gold (Party Poppers & Ribbon)",
    badge: "Official Ref 3",
    category: "royal",
    bgColor: "#0c3e8a",
    bannerColor: "#0c3e8a",
    borderGold: "#f6c445",
    accentLight: "#fef08a",
    defaultMessage:
      "May this special day bring you beautiful moments, wonderful memories, and every happiness your heart desires.",
    overlay: template3Master,
  },
};

export const POSTER_THEMES = POSTER_TEMPLATES;

export const THEME_ALIASES = {
  pastel_blossom: "yellow_classic",
  rose_blush: "ivory_celebration",
  royal_club: "royal_blue_blast",
  baroque_gold: "royal_blue_blast",
  emerald_symphony: "royal_blue_blast",
};

export function resolveThemeId(themeId) {
  if (POSTER_TEMPLATES[themeId]) return themeId;
  if (THEME_ALIASES[themeId]) return THEME_ALIASES[themeId];
  return "yellow_classic";
}

export function formatPosterDate(dateStr) {
  if (!dateStr || dateStr === "Today") {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d} / ${m} / ${y}`;
  }
  const clean = String(dateStr).trim();
  if (clean.includes("/")) return clean;
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d} / ${m} / ${y}`;
  }
  return clean;
}

/* ============================================================
   MAIN BIRTHDAY POSTER COMPONENT
============================================================ */
const BirthdayPoster = forwardRef(
  (
    {
      name = "Bharat Sharma",
      role = "Member",
      photo = null,
      birthDate = "29 / 12 / 2022",
      turningAge = null,
      message = null,
      themeId = "yellow_classic",
      photoScale = 1,
      width = 540,
    },
    ref
  ) => {
    const activeTheme = resolveThemeId(themeId);
    const template = POSTER_TEMPLATES[activeTheme] || POSTER_TEMPLATES.yellow_classic;
    const finalMessage = message && message.trim() ? message : template.defaultMessage;
    const formattedDate = formatPosterDate(birthDate);

    // Exact aspect ratio of reference images (819 x 1024 = 1.2503)
    const posterHeight = Math.round((width * 1024) / 819);

    // Scale ratio relative to master 819 width
    const scaleFactor = width / 819;

    // ============================================================
    // TEMPLATE 1: SUNSHINE GOLD (POLAROID & GOLD BALLOONS) - USER REF 1
    // ============================================================
    if (activeTheme === "yellow_classic") {
      const cutoutLeft = Math.round(244 * scaleFactor);
      const cutoutTop = Math.round(146 * scaleFactor);
      const cutoutWidth = Math.round(330 * scaleFactor);
      const cutoutHeight = Math.round(318 * scaleFactor);

      const nameTop = Math.round(506 * scaleFactor);
      const nameLeft = Math.round(236 * scaleFactor);
      const nameWidth = Math.round(346 * scaleFactor);
      const dateTop = Math.round(600 * scaleFactor);
      const msgTop = Math.round(905 * scaleFactor);

      return (
        <div
          ref={ref}
          id="imc-birthday-poster"
          style={{
            width: `${width}px`,
            height: `${posterHeight}px`,
            position: "relative",
            overflow: "hidden",
            borderRadius: "6px",
            boxShadow: "0 25px 65px rgba(0,0,0,0.3)",
            userSelect: "none",
            fontFamily: "'Poppins', sans-serif",
            background: "#ffd54d",
          }}
        >
          {/* Layer 1: Photo Cutout Window behind frame */}
          <div
            style={{
              position: "absolute",
              left: `${cutoutLeft}px`,
              top: `${cutoutTop}px`,
              width: `${cutoutWidth}px`,
              height: `${cutoutHeight}px`,
              background: "#fef5d0",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${photoScale})`,
                  transition: "transform 0.2s",
                }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#8c6014", opacity: 0.65 }}>
                <div style={{ fontSize: `${Math.round(36 * (width / 540))}px` }}>📷</div>
                <div
                  style={{
                    fontSize: `${Math.round(11 * (width / 540))}px`,
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  PHOTO PLACEHOLDER
                </div>
              </div>
            )}
          </div>

          {/* Layer 2: Master Photorealistic Template Overlay */}
          <img
            src={template1Master}
            alt="Sunshine Gold Template"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          {/* Layer 3: Dynamic Name inside Polaroid Blue Block */}
          <div
            style={{
              position: "absolute",
              top: `${nameTop}px`,
              left: `${nameLeft}px`,
              width: `${nameWidth}px`,
              transform: "translateY(-50%)",
              textAlign: "center",
              color: "#ffffff",
              fontSize: `${Math.round(20 * (width / 540))}px`,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name || "BHARAT SHARMA"}
          </div>

          {/* Layer 3: Dynamic Date */}
          <div
            style={{
              position: "absolute",
              top: `${dateTop}px`,
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              textAlign: "center",
              color: "#12437b",
              fontSize: `${Math.round(17 * (width / 540))}px`,
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            Date : {formattedDate}
          </div>

          {/* Layer 3: Dynamic Wish Message */}
          <div
            style={{
              position: "absolute",
              top: `${msgTop}px`,
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${Math.round(440 * (width / 540))}px`,
              textAlign: "center",
              color: "#12437b",
              fontSize: `${Math.round(14 * (width / 540))}px`,
              fontWeight: 600,
              lineHeight: 1.35,
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {finalMessage}
          </div>
        </div>
      );
    }

    // ============================================================
    // TEMPLATE 2: IVORY CELEBRATION (CAKE & ROYAL GIFTS) - USER REF 2
    // ============================================================
    if (activeTheme === "ivory_celebration") {
      const cutoutLeft = Math.round(233 * scaleFactor);
      const cutoutTop = Math.round(104 * scaleFactor);
      const cutoutWidth = Math.round(339 * scaleFactor);
      const cutoutHeight = Math.round(268 * scaleFactor);
      const cutoutRadius = Math.round(16 * scaleFactor);

      const nameTop = Math.round(421 * scaleFactor);
      const dateTop = Math.round(466 * scaleFactor);
      const msgTop = Math.round(718 * scaleFactor);

      return (
        <div
          ref={ref}
          id="imc-birthday-poster"
          style={{
            width: `${width}px`,
            height: `${posterHeight}px`,
            position: "relative",
            overflow: "hidden",
            borderRadius: "6px",
            boxShadow: "0 25px 65px rgba(0,0,0,0.3)",
            userSelect: "none",
            fontFamily: "'Poppins', sans-serif",
            background: "#ffedb3",
          }}
        >
          {/* Layer 1: Photo Cutout Window behind frame */}
          <div
            style={{
              position: "absolute",
              left: `${cutoutLeft}px`,
              top: `${cutoutTop}px`,
              width: `${cutoutWidth}px`,
              height: `${cutoutHeight}px`,
              borderRadius: `${cutoutRadius}px`,
              background: "#fef3c7",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${photoScale})`,
                  transition: "transform 0.2s",
                }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#ea580c", opacity: 0.7 }}>
                <div style={{ fontSize: `${Math.round(36 * (width / 540))}px` }}>📷</div>
                <div
                  style={{
                    fontSize: `${Math.round(11 * (width / 540))}px`,
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  PHOTO PLACEHOLDER
                </div>
              </div>
            )}
          </div>

          {/* Layer 2: Master Photorealistic Template Overlay */}
          <img
            src={template2Master}
            alt="Ivory Celebration Template"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          {/* Layer 3: Dynamic Name in Bold Orange */}
          <div
            style={{
              position: "absolute",
              top: `${nameTop}px`,
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              textAlign: "center",
              color: "#ea580c",
              fontSize: `${Math.round(23 * (width / 540))}px`,
              fontWeight: 800,
              letterSpacing: "0.5px",
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name || "Bharat Sharma"}
          </div>

          {/* Layer 3: Dynamic Date in Amber */}
          <div
            style={{
              position: "absolute",
              top: `${dateTop}px`,
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              textAlign: "center",
              color: "#b45309",
              fontSize: `${Math.round(16 * (width / 540))}px`,
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            Date : {formattedDate}
          </div>

          {/* Layer 3: Dynamic Wish Message */}
          <div
            style={{
              position: "absolute",
              top: `${msgTop}px`,
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${Math.round(440 * (width / 540))}px`,
              textAlign: "center",
              color: "#b45309",
              fontSize: `${Math.round(14 * (width / 540))}px`,
              fontWeight: 600,
              lineHeight: 1.35,
              fontFamily: "'Poppins', sans-serif",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {finalMessage}
          </div>
        </div>
      );
    }

    // ============================================================
    // TEMPLATE 3: ROYAL BLUE & GOLD BLAST - USER REF 3
    // ============================================================
    const cutoutLeft = Math.round(260 * scaleFactor);
    const cutoutTop = Math.round(352 * scaleFactor);
    const cutoutSize = Math.round(306 * scaleFactor);

    const nameTop = Math.round(680 * scaleFactor);
    const dateTop = Math.round(765 * scaleFactor);
    const msgTop = Math.round(875 * scaleFactor);

    return (
      <div
        ref={ref}
        id="imc-birthday-poster"
        style={{
          width: `${width}px`,
          height: `${posterHeight}px`,
          position: "relative",
          overflow: "hidden",
          borderRadius: "6px",
          boxShadow: "0 25px 65px rgba(0,0,0,0.35)",
          userSelect: "none",
          fontFamily: "'Poppins', sans-serif",
          background: "#0c3e8a",
        }}
      >
        {/* Layer 1: Circular Photo Cutout Window behind frame */}
        <div
          style={{
            position: "absolute",
            left: `${cutoutLeft}px`,
            top: `${cutoutTop}px`,
            width: `${cutoutSize}px`,
            height: `${cutoutSize}px`,
            borderRadius: "50%",
            background: "#fdf6cf",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${photoScale})`,
                transition: "transform 0.2s",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#1e3a8a", opacity: 0.7 }}>
              <div style={{ fontSize: `${Math.round(36 * (width / 540))}px` }}>📷</div>
              <div
                style={{
                  fontSize: `${Math.round(11 * (width / 540))}px`,
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                PHOTO PLACEHOLDER
              </div>
            </div>
          )}
        </div>

        {/* Layer 2: Master Photorealistic Template Overlay */}
        <img
          src={template3Master}
          alt="Royal Blue Blast Template"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Layer 3: Dynamic Name on 3D Ribbon Banner */}
        <div
          style={{
            position: "absolute",
            top: `${nameTop}px`,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${Math.round(360 * (width / 540))}px`,
            textAlign: "center",
            color: "#ffffff",
            fontSize: `${Math.round(20 * (width / 540))}px`,
            fontWeight: 900,
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Poppins', sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            zIndex: 3,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxSizing: "border-box",
          }}
        >
          {name || "Bharat Sharma"}
        </div>

        {/* Layer 3: Dynamic Date in Gold */}
        <div
          style={{
            position: "absolute",
            top: `${dateTop}px`,
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            textAlign: "center",
            color: "#fde047",
            fontSize: `${Math.round(16 * (width / 540))}px`,
            fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          Date : {formattedDate}
        </div>

        {/* Layer 3: Dynamic Wish Message in White */}
        <div
          style={{
            position: "absolute",
            top: `${msgTop}px`,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${Math.round(440 * (width / 540))}px`,
            textAlign: "center",
            color: "#ffffff",
            fontSize: `${Math.round(14 * (width / 540))}px`,
            fontWeight: 500,
            lineHeight: 1.4,
            fontFamily: "'Poppins', sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          {finalMessage}
        </div>
      </div>
    );
  }
);

BirthdayPoster.displayName = "BirthdayPoster";

export default BirthdayPoster;
