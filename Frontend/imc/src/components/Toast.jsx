import React, { useEffect } from "react";

const ICONS = {
  success: "✓",
  error: "⚠",
  info: "ℹ",
};

export default function Toast({
  open,
  type = "success",
  message = "",
  duration = 2200,
  onClose = () => {},
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`toast-wrap`}>
      <div className={`toast toast--${type}`} role="status" aria-live="polite">
        <span className="toast__icon">{ICONS[type] || ICONS.info}</span>
        <span className="toast__msg">{message}</span>
        <button className="toast__x" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}
