import React, { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

// Import reusable components
import StudioList from "./components/StudioList";
import UserStudioRentalForm from "../Forms/UserStudioRentalForm";
import Footer from "../../components/footer";

import studioBanner from "@/assets/studio banner desktop.png";

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7 }
};

export default function HomePage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);

  // Filter states – category removed
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const openBooking = (studio) => {
    setSelectedStudio(studio || null);
    setShowBookingModal(true);
  };

  const closeBooking = () => {
    setShowBookingModal(false);
    setSelectedStudio(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* ================= HERO SECTION WITH BANNER ================= */}
      <section
        className="relative min-h-[65vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${studioBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.h1
            {...fadeIn}
            className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-2xl"
            style={{
              fontFamily: '"Castellar", "Cinzel", Georgia, "Times New Roman", serif',
              fontWeight: 900,
              letterSpacing: '0.05em',
            }}
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
      <div className="homepage-content flex-1 relative z-10">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* ================= MODERN & ATTRACTIVE FILTER BAR ================= */}
          <div className="mb-12 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100/70 overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Find Your Perfect Studio
              </h2>
              <p className="text-gray-600 mt-1.5 text-base">
                Search by name, location or your budget
              </p>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Search */}
              <div className="relative group">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Keywords / Studio Name
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. n9 studio, vocal booth, pune..."
                    className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Pune, Mumbai, Baner, Wakad, Hinjewadi..."
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                />
              </div>

              {/* Price Range */}
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Hourly Rate
                </label>
                <select
                  id="price"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-800 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                >
                  <option value="">All Prices</option>
                  <option value="0-500">Up to ₹500</option>
                  <option value="500-1000">₹500 – ₹1,000</option>
                  <option value="1000-2000">₹1,000 – ₹2,000</option>
                  <option value="2000+">₹2,000 and above</option>
                </select>
              </div>
            </div>
          </div>

          {/* ================= STUDIO LIST ================= */}
          <StudioList 
            onBook={openBooking}
            searchTerm={searchTerm}
            priceRange={priceRange}
            locationFilter={locationFilter}
          />

        </main>
      </div>

      {/* ================= BOOKING MODAL ================= */}
      {showBookingModal && (
        <div 
          className="booking-modal-backdrop fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeBooking}
        >
          <div 
            className="booking-modal relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book Studio</h2>
                {selectedStudio && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">For:</span> {selectedStudio.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-900 text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                onClick={closeBooking}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 sm:px-8 md:px-10 pb-10 pt-6">
              <UserStudioRentalForm
                initialStudio={selectedStudio}
                onClose={closeBooking}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= REUSABLE FOOTER ================= */}
      <Footer />

      {/* ================= CUSTOM STYLES ================= */}
      <style>{`
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

        /* Improved scrollbar for modal */
        .booking-modal::-webkit-scrollbar {
          width: 8px;
        }
        .booking-modal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .booking-modal::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 10px;
        }
        .booking-modal::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}