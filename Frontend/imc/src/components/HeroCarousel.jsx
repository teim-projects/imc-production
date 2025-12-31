import React, { useEffect, useMemo, useRef, useState } from "react";

export default function HeroCarousel({
  images = [],
  interval = 4500, // default (overridden by prop)
  height = "calc(100vh - 70px)",
}) {
  const slides = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const next = () => setIndex((p) => (slides.length ? (p + 1) % slides.length : 0));
  const to = (i) => setIndex(() => (slides.length ? i % slides.length : 0));

  // ✅ Auto-slide every X milliseconds
  useEffect(() => {
    if (!slides.length || paused) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused, interval]);

  if (!slides.length) return null;

  return (
    <section
      className="hero-carousel"
      style={{ height }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((img, i) => (
        <div key={i} className={`slide ${i === index ? "active" : ""}`}>
          <img className="slide-img" src={img.src} alt={img.title || `Slide ${i + 1}`} />
          {(img.title || img.subtitle) && (
            <div className="slide-overlay">
              {img.title && <h1 className="slide-title">{img.title}</h1>}
              {img.subtitle && <p className="slide-subtitle">{img.subtitle}</p>}
            </div>
          )}
        </div>
      ))}

      <div className="dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === index ? "active" : ""}`}
            onClick={() => to(i)}
          />
        ))}
      </div>
    </section>
  );
}
