import React, { useState } from "react";
import { Users, Award, Calendar, Star, Mic, Sparkles, Phone, ChevronRight, Trophy, Headphones, Music, Zap, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

// Import reusable components
import StudioList from "./components/StudioList";
import UserStudioRentalForm from "../Forms/UserStudioRentalForm";
import Footer from "../../components/footer";  // ← Added reusable Footer

import studioBanner from "@/assets/studio banner.jpg";

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7 }
};

export default function HomePage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);

  const openBooking = (studio) => {
    setSelectedStudio(studio || null);
    setShowBookingModal(true);
  };

  const closeBooking = () => {
    setShowBookingModal(false);
    setSelectedStudio(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ================= HERO SECTION WITH BANNER ================= */}
      <section
        className="relative min-h-[65vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${studioBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.h1
            {...fadeIn}
            className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Professional Music Studios
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-white/90 max-w-3xl mx-auto"
          >
            Book world-class recording studios, rehearsal rooms, and music production spaces with top-quality sound systems.
          </motion.p>
        </div>
      </section>

      {/* ================= AMBIENT BACKGROUND EFFECTS ================= */}
      <div className="homepage-ambient">
        <div className="blob-red"></div>
        <div className="blob-blue"></div>
        <div className="blob-yellow"></div>
        <div className="blob-pink"></div>

        <div className="music m1">🎵</div>
        <div className="music m2">🎶</div>
        <div className="music m3">🎸</div>
        <div className="music m4">🎤</div>
        <div className="music m5">🎧</div>
        <div className="music m6">🎹</div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="homepage-content flex-1">
        <main className="homepage-main">
          <StudioList onBook={openBooking} />
        </main>
      </div>

      {/* ================= BOOKING MODAL ================= */}
      {showBookingModal && (
        <div className="booking-modal-backdrop" onClick={closeBooking}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <h2>Studio Rental</h2>
                {selectedStudio && (
                  <span className="booking-modal-sub">
                    For: <strong>{selectedStudio.name}</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="booking-modal-close"
                onClick={closeBooking}
              >
                ×
              </button>
            </div>

            <UserStudioRentalForm
              initialStudio={selectedStudio}
              onClose={closeBooking}
            />
          </div>
        </div>
      )}

      {/* ================= REUSABLE FOOTER ================= */}
      <Footer />

      {/* ================= CUSTOM STYLES (unchanged) ================= */}
      <style>{`
        .homepage-root { 
          position: relative; 
          overflow: hidden; 
          background: #ffffff; 
        }

        .homepage-ambient { 
          position: fixed; 
          inset: 0; 
          pointer-events: none; 
          z-index: 0; 
          overflow: hidden; 
        }

        .blob-red { 
          position: absolute; 
          top: 100px; 
          left: 50px; 
          width: 400px; 
          height: 400px; 
          background: radial-gradient(circle, rgba(251,113,133,0.15), transparent); 
          border-radius: 50%; 
          filter: blur(100px); 
          animation: pulse 10s infinite; 
        }
        .blob-blue { 
          position: absolute; 
          top: 25%; 
          right: 80px; 
          width: 450px; 
          height: 450px; 
          background: radial-gradient(circle, rgba(147,197,253,0.12), transparent); 
          border-radius: 50%; 
          filter: blur(100px); 
          animation: pulse 12s infinite 1s; 
        }
        .blob-yellow { 
          position: absolute; 
          bottom: 150px; 
          left: 20%; 
          width: 350px; 
          height: 350px; 
          background: radial-gradient(circle, rgba(253,224,71,0.1), transparent); 
          border-radius: 50%; 
          filter: blur(100px); 
          animation: pulse 11s infinite 2s; 
        }
        .blob-pink { 
          position: absolute; 
          top: 60%; 
          right: 30%; 
          width: 320px; 
          height: 320px; 
          background: radial-gradient(circle, rgba(244,114,182,0.12), transparent); 
          border-radius: 50%; 
          filter: blur(100px); 
          animation: pulse 9s infinite 1.5s; 
        }

        @keyframes pulse { 
          0%, 100% { transform: scale(1); opacity: 0.3; } 
          50% { transform: scale(1.15); opacity: 0.5; } 
        }

        .music { 
          position: absolute; 
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); 
          animation: float 7s ease-in-out infinite; 
        }

        @keyframes float { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-25px); } 
        }

        .m1 { top: 100px; left: 8%; font-size: 60px; opacity: .2; }
        .m2 { top: 20%; right: 12%; font-size: 55px; opacity: .25; animation-delay: .5s; }
        .m3 { top: 45%; left: 15%; font-size: 65px; opacity: .18; animation-delay: 1.5s; }
        .m4 { top: 35%; right: 18%; font-size: 60px; opacity: .2; animation-delay: 2s; }
        .m5 { bottom: 25%; right: 25%; font-size: 55px; opacity: .25; }
        .m6 { top: 60%; left: 12%; font-size: 60px; opacity: .2; animation-delay: 1s; }

        .homepage-content { 
          position: relative; 
          z-index: 10; 
        }

        .homepage-main { 
          max-width: 1200px; 
          margin: 40px auto 60px; 
          padding: 0 16px; 
          width: 100%; 
        }

        /* Studio Card Styles */
        .studio-card {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          background: #ffffff;
          border-radius: 26px;
          box-shadow: 0 18px 40px rgba(15,23,42,0.12);
          padding: 18px 22px;
          align-items: center;
        }
        .studio-card-img-wrap { 
          position: relative; 
          border-radius: 22px; 
          overflow: hidden; 
          background: #f3f4f6; 
        }
        .studio-card-img { 
          width: 100%; 
          height: 220px; 
          object-fit: cover; 
        }
        .studio-card-rating { 
          position: absolute; 
          top: 10px; 
          right: 10px; 
          background: #f97316; 
          color: #fff; 
          font-size: 0.8rem; 
          font-weight: 600; 
          border-radius: 999px; 
          padding: 4px 10px; 
          box-shadow: 0 8px 20px rgba(0,0,0,0.18); 
        }
        .studio-card-body { 
          display: flex; 
          justify-content: space-between; 
          align-items: stretch; 
          gap: 16px; 
        }
        .studio-card-main { 
          display: flex; 
          flex-direction: column; 
          gap: 10px; 
        }
        .studio-card-title { 
          font-size: 1.25rem; 
          font-weight: 700; 
          color: #111827; 
        }
        .studio-card-location { 
          font-size: 0.95rem; 
          color: #6b7280; 
        }
        .studio-card-tags { 
          display: flex; 
          gap: 8px; 
          flex-wrap: wrap; 
        }
        .tag { 
          font-size: 0.8rem; 
          font-weight: 600; 
          border-radius: 999px; 
          padding: 4px 10px; 
        }
        .tag.capacity { 
          background: #fee2e2; 
          color: #b91c1c; 
        }
        .tag.instant { 
          background: #dbeafe; 
          color: #1d4ed8; 
        }
        .studio-card-footer { 
          display: flex; 
          flex-direction: column; 
          align-items: flex-end; 
          justify-content: space-between; 
          gap: 10px; 
        }
        .studio-card-price .price { 
          font-size: 1.4rem; 
          font-weight: 800; 
          color: #dc2626; 
        }
        .studio-card-price .per { 
          font-size: 0.85rem; 
          color: #6b7280; 
        }
        .studio-card-btn { 
          padding: 10px 20px; 
          border-radius: 999px; 
          background: #ef4444; 
          color: #fff; 
          font-weight: 600; 
          cursor: pointer; 
          box-shadow: 0 12px 25px rgba(248,113,113,0.45); 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
        }
        .studio-card-btn:hover { 
          transform: translateY(-1px); 
        }

        @media (max-width: 900px) {
          .studio-card { 
            grid-template-columns: 1fr; 
          }
          .studio-card-img { 
            height: 200px; 
          }
          .studio-card-body { 
            flex-direction: column; 
          }
          .studio-card-footer { 
            flex-direction: row; 
            align-items: center; 
            justify-content: space-between; 
          }
        }

        /* Modal Styles */
        .booking-modal-backdrop { 
          position: fixed; 
          inset: 0; 
          background: rgba(15,23,42,0.55); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 50; 
        }
        .booking-modal { 
          width: min(1000px, 96vw); 
          max-height: 90vh; 
          overflow-y: auto; 
          border-radius: 24px; 
          background: #f9fafb; 
          box-shadow: 0 24px 80px rgba(15,23,42,0.4); 
          padding: 18px 20px 22px; 
        }
        .booking-modal-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 8px; 
          margin-bottom: 10px; 
        }
        .booking-modal-header h2 { 
          font-size: 1.15rem; 
          font-weight: 700; 
          color: #111827; 
        }
        .booking-modal-sub { 
          font-size: 0.85rem; 
          color: #6b7280; 
          margin-left: 8px; 
        }
        .booking-modal-close { 
          border: none; 
          background: #111827; 
          color: #fff; 
          width: 28px; 
          height: 28px; 
          border-radius: 999px; 
          font-size: 18px; 
          line-height: 1; 
          cursor: pointer; 
        }
      `}</style>
    </div>
  );
}