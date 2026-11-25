// src/components/Birthday/posterUtils.js
/**
 * Zero-dependency pure Canvas Confetti & Ultra-Reliable High-Res Birthday Poster Renderer.
 * Ultra HD 1638x2048 master composite rendering matching the exact 3 User Reference Styles.
 */
import template1Master from "../../assets/template1_master.png";
import template2Master from "../../assets/template2_master.png";
import template3Master from "../../assets/template3_master.png";
import { formatPosterDate, resolveThemeId, POSTER_TEMPLATES } from "./BirthdayPoster";

const TEMPLATE_OVERLAYS = {
  yellow_classic: template1Master,
  ivory_celebration: template2Master,
  royal_blue_blast: template3Master,
};

// ============================================================
// 1. PURE JS CELEBRATION CONFETTI
// ============================================================
export function fireCelebrationConfetti() {
  try {
    const existingCanvas = document.getElementById("imc-confetti-canvas");
    if (existingCanvas) existingCanvas.remove();

    const canvas = document.createElement("canvas");
    canvas.id = "imc-confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "99999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ["#fbbf24", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#ffffff"];
    const pieces = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: width * 0.5 + (Math.random() - 0.5) * 200,
        y: height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.35,
        opacity: 1,
      });
    }

    let animationId;
    const startTime = Date.now();
    const duration = 2800;

    function update() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        cancelAnimationFrame(animationId);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.98;

        if (elapsed > duration - 800) {
          p.opacity = Math.max(0, (duration - elapsed) / 800);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);
  } catch (err) {
    console.debug("Confetti skipped:", err);
  }
}

// ============================================================
// 2. SAFE IMAGE LOADER
// ============================================================
export async function loadImageSafe(src) {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return null;
  }

  let finalSrc = src;
  if (finalSrc.startsWith("/media/") || finalSrc.startsWith("media/")) {
    const cleanMedia = finalSrc.startsWith("/") ? finalSrc : `/${finalSrc}`;
    if (typeof window !== "undefined" && window.location.port && window.location.port !== "8000") {
      finalSrc = `http://127.0.0.1:8000${cleanMedia}`;
    } else if (typeof window !== "undefined" && window.location.origin) {
      finalSrc = `${window.location.origin}${cleanMedia}`;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, 4500);

    if (finalSrc.startsWith("http://") || finalSrc.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      if (timedOut) return;
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = () => {
      if (timedOut) return;
      clearTimeout(timeout);
      if (typeof fetch !== "undefined" && (finalSrc.startsWith("http://") || finalSrc.startsWith("https://"))) {
        fetch(finalSrc, { mode: "cors" })
          .then((res) => (res.ok ? res.blob() : null))
          .then((blob) => {
            if (!blob) return resolve(null);
            const objectUrl = URL.createObjectURL(blob);
            const fallbackImg = new Image();
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = () => resolve(null);
            fallbackImg.src = objectUrl;
          })
          .catch(() => resolve(null));
      } else {
        resolve(null);
      }
    };

    img.src = finalSrc;
  });
}

// Wrap text helper for canvas
function wrapCanvasText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Draw Photo with object-fit: cover into target rectangle
function drawCoverPhoto(ctx, img, x, y, w, h, scale = 1) {
  if (!img) {
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#8c6014";
    ctx.font = "bold 32px Poppins, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PHOTO PLACEHOLDER", x + w / 2, y + h / 2);
    return;
  }

  const imgW = img.width || 1;
  const imgH = img.height || 1;
  const targetRatio = w / h;
  const imgRatio = imgW / imgH;

  let sW, sH, sX, sY;
  if (imgRatio > targetRatio) {
    sH = imgH;
    sW = imgH * targetRatio;
    sX = (imgW - sW) / 2;
    sY = 0;
  } else {
    sW = imgW;
    sH = imgW / targetRatio;
    sX = 0;
    sY = (imgH - sH) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (scale !== 1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
  ctx.restore();
}

// ============================================================
// 3. MASTER CANVAS RENDERER (1638 x 2048 Ultra-HD Export)
// ============================================================
export async function renderPosterToCanvas({
  name = "Bharat Sharma",
  role = "Member",
  photo = null,
  birthDate = "29 / 12 / 2022",
  turningAge = null,
  message = null,
  themeId = "yellow_classic",
  photoScale = 1,
}) {
  const activeTheme = resolveThemeId(themeId);
  const template = POSTER_TEMPLATES[activeTheme] || POSTER_TEMPLATES.yellow_classic;
  const finalMessage = message && message.trim() ? message : template.defaultMessage;
  const formattedDate = formatPosterDate(birthDate);

  // Ultra-HD Master Resolution (2x exact reference: 1638 x 2048)
  const W = 1638;
  const H = 2048;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2D context");

  // Load Master Template Overlay & User Photo
  const overlaySrc = TEMPLATE_OVERLAYS[activeTheme] || template1Master;
  const [overlayImg, userPhotoImg] = await Promise.all([
    loadImageSafe(overlaySrc),
    loadImageSafe(photo),
  ]);

  // ============================================================
  // TEMPLATE 1: SUNSHINE GOLD (POLAROID & GOLD BALLOONS)
  // ============================================================
  if (activeTheme === "yellow_classic") {
    // 1. Base Yellow Background
    ctx.fillStyle = "#ffd54d";
    ctx.fillRect(0, 0, W, H);

    // 2. Photo Cutout (behind the frame)
    const px = 244 * 2;
    const py = 146 * 2;
    const pw = 330 * 2;
    const ph = 318 * 2;

    ctx.fillStyle = "#fdf5d0";
    ctx.fillRect(px, py, pw, ph);
    if (userPhotoImg) {
      drawCoverPhoto(ctx, userPhotoImg, px, py, pw, ph, photoScale);
    }

    // 3. Photorealistic Template Overlay
    if (overlayImg) {
      ctx.drawImage(overlayImg, 0, 0, W, H);
    }

    // 4. Name inside blue polaroid block
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 60px Poppins, Arial, sans-serif";
    ctx.fillText((name || "BHARAT SHARMA").toUpperCase(), W / 2, 506 * 2);

    // 5. Date
    ctx.fillStyle = "#12437b";
    ctx.font = "700 50px Poppins, Arial, sans-serif";
    ctx.fillText(`Date : ${formattedDate}`, W / 2, 600 * 2);

    // 6. Wish Message
    ctx.font = "600 42px Poppins, Arial, sans-serif";
    ctx.fillStyle = "#12437b";
    const lines = wrapCanvasText(ctx, finalMessage, 1220);
    const lineH = 56;
    const startY = 905 * 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, startY + i * lineH);
    });

    return canvas;
  }

  // ============================================================
  // TEMPLATE 2: IVORY CELEBRATION (CAKE & ROYAL GIFTS)
  // ============================================================
  if (activeTheme === "ivory_celebration") {
    // 1. Base Ivory Background
    ctx.fillStyle = "#ffedb3";
    ctx.fillRect(0, 0, W, H);

    // 2. Rounded Photo Cutout
    const px = 233 * 2;
    const py = 104 * 2;
    const pw = 339 * 2;
    const ph = 268 * 2;
    const pr = 32;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, pr);
    ctx.clip();
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(px, py, pw, ph);
    if (userPhotoImg) {
      drawCoverPhoto(ctx, userPhotoImg, px, py, pw, ph, photoScale);
    }
    ctx.restore();

    // 3. Photorealistic Template Overlay
    if (overlayImg) {
      ctx.drawImage(overlayImg, 0, 0, W, H);
    }

    // 4. Name in Bold Orange
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ea580c";
    ctx.font = "800 68px Poppins, Arial, sans-serif";
    ctx.fillText(name || "Bharat Sharma", W / 2, 421 * 2);

    // 5. Date in Amber
    ctx.fillStyle = "#b45309";
    ctx.font = "600 50px Poppins, Arial, sans-serif";
    ctx.fillText(`Date : ${formattedDate}`, W / 2, 466 * 2);

    // 6. Wish Message
    ctx.font = "600 42px Poppins, Arial, sans-serif";
    ctx.fillStyle = "#b45309";
    const lines = wrapCanvasText(ctx, finalMessage, 1220);
    const lineH = 56;
    const startY = 718 * 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, startY + i * lineH);
    });

    return canvas;
  }

  // ============================================================
  // TEMPLATE 3: ROYAL BLUE & GOLD BLAST
  // ============================================================
  // 1. Base Royal Blue Background
  ctx.fillStyle = "#0c3e8a";
  ctx.fillRect(0, 0, W, H);

  // 2. Circular Photo Cutout
  const circleCX = 413 * 2;
  const circleCY = 505 * 2;
  const circleR = 153 * 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(circleCX, circleCY, circleR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#fdf6cf";
  ctx.fillRect(circleCX - circleR, circleCY - circleR, circleR * 2, circleR * 2);
  if (userPhotoImg) {
    drawCoverPhoto(ctx, userPhotoImg, circleCX - circleR, circleCY - circleR, circleR * 2, circleR * 2, photoScale);
  }
  ctx.restore();

  // 3. Photorealistic Template Overlay
  if (overlayImg) {
    ctx.drawImage(overlayImg, 0, 0, W, H);
  }

  // 4. Name on 3D Ribbon Banner
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 62px Poppins, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillText((name || "Bharat Sharma").toUpperCase(), W / 2, 680 * 2);

  // 5. Date in Gold
  ctx.fillStyle = "#fde047";
  ctx.font = "700 50px Poppins, Arial, sans-serif";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillText(`Date : ${formattedDate}`, W / 2, 765 * 2);

  // 6. Wish Message in White
  ctx.font = "500 42px Poppins, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  const lines3 = wrapCanvasText(ctx, finalMessage, 1260);
  const lineH3 = 56;
  const startY3 = 875 * 2 - ((lines3.length - 1) * lineH3) / 2;
  lines3.forEach((l, i) => {
    ctx.fillText(l, W / 2, startY3 + i * lineH3);
  });

  return canvas;
}
