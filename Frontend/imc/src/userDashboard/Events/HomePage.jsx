// --------------------------------------------------------------
// src/userDashboard/UserEvents.jsx
// THEME: Cream (#FFF7DF), Navy (#0B2545), Yellow (#FFD447), Orange (#FF7A3C)
// --------------------------------------------------------------

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaChair,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Import the new Footer component
import Footer from "../../components/footer";

/* ===================== API CONFIG ===================== */
const BASE =
  import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

const EVENTS_URL = `${BASE}/user/events/`;
const BOOKINGS_URL = `${BASE}/user/event-bookings/`;

/* ===================== AXIOS ===================== */
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

/* ===================== COLORS ===================== */
const COLORS = {
  cream: "#FFF7DF",
  navy: "#0B2545",
  yellow: "#FFD447",
  orange: "#FF7A3C",
};

/* ===================== SEAT LAYOUT ===================== */
const SEAT_LAYOUT = {
  vip: { label: "VIP", rows: 2, cols: 8 },
  premium: { label: "Premium", rows: 3, cols: 10 },
  basic: { label: "Basic", rows: 3, cols: 10 },
};

/* ======================================================
   SEAT SELECTION MODAL (unchanged)
====================================================== */
function SeatSelectionModal({ event, onClose, onBookingCreated }) {
  // ... (exact same code as before - no changes needed)
  const [tier, setTier] = useState("basic");
  const [seats, setSeats] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!event) return null;

  const priceMap = {
    vip: Number(event.vip_price || event.ticket_price || 0),
    premium: Number(event.premium_price || event.ticket_price || 0),
    basic: Number(event.basic_price || event.ticket_price || 0),
  };

  const bookedSeats = new Set(event.booked_seats || []);
  const mySeats = new Set(event.user_booked_seats || []);

  const toggleSeat = (seatId) => {
    if (bookedSeats.has(seatId)) return;
    setSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  const total = seats.length * priceMap[tier];

  const submitBooking = async () => {
    setError("");
    if (!name || !phone || seats.length === 0) {
      setError("Please enter details and select seats");
      return;
    }

    try {
      setLoading(true);
      await api.post(BOOKINGS_URL, {
        event: event.id,
        customer_name: name,
        contact_number: phone,
        ticket_type: tier,
        seat_numbers: seats,
        number_of_tickets: seats.length,
        total_amount: total,
        payment_method: payment,
      });
      onBookingCreated();
      onClose();
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSeats = (key) => {
    const layout = SEAT_LAYOUT[key];
    return [...Array(layout.rows)].map((_, r) => (
      <div key={r} className="flex justify-center gap-2 mb-2">
        {[...Array(layout.cols)].map((_, c) => {
          const num = `${c + 1}`.padStart(2, "0");
          const seatId = `${key}-${r + 1}-${num}`;

          const isBooked = bookedSeats.has(seatId);
          const isMine = mySeats.has(seatId);
          const isSelected = seats.includes(seatId);

          let cls =
            "bg-white border text-[#0B2545] hover:border-[#FF7A3C]";
          if (isMine)
            cls = "bg-[#0B2545] text-[#FFD447] cursor-not-allowed";
          else if (isBooked)
            cls = "bg-gray-200 text-gray-400 cursor-not-allowed";
          else if (isSelected)
            cls = "bg-gradient-to-r from-[#FFD447] to-[#FF7A3C]";

          return (
            <button
              key={seatId}
              onClick={() => toggleSeat(seatId)}
              disabled={isBooked}
              className={`w-10 h-10 rounded-xl text-xs font-bold border ${cls}`}
            >
              {num}
            </button>
          );
        })}
      </div>
    ));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 40 }}
          animate={{ y: 0 }}
          className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 bg-[#0B2545] text-white">
            <h3 className="text-lg font-bold">{event.name}</h3>
            <button onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-2">
              {Object.keys(SEAT_LAYOUT).map((k) => (
                <div key={k} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">
                      {SEAT_LAYOUT[k].label} – ₹{priceMap[k]}
                    </h4>
                    <button
                      onClick={() => {
                        setTier(k);
                        setSeats([]);
                      }}
                      className={`text-xs px-3 py-1 rounded-full ${
                        tier === k ? "bg-green-500 text-white" : "border"
                      }`}
                    >
                      {tier === k ? "Selected" : "Select"}
                    </button>
                  </div>
                  {renderSeats(k)}
                </div>
              ))}
            </div>

            <div className="bg-[#0B2545] text-white rounded-2xl p-5">
              <h4 className="font-semibold mb-4">Booking Summary</h4>
              <input
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mb-3 p-2 rounded-xl text-black"
              />
              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mb-3 p-2 rounded-xl text-black"
              />
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="w-full mb-3 p-2 rounded-xl text-black"
              >
                <option>UPI</option>
                <option>Card</option>
                <option>Cash</option>
              </select>
              <div className="text-lg font-bold text-[#FFD447] mb-4">
                Total ₹{total}
              </div>
              {error && <div className="text-xs text-red-300 mb-2">{error}</div>}
              <button
                onClick={submitBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] font-bold py-3 rounded-xl"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ======================================================
   MAIN USER EVENTS PAGE
====================================================== */
export default function UserEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const res = await api.get(EVENTS_URL);
    setEvents(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section (Reduced Height) */}
      <section
        className="relative bg-cover bg-center py-24 md:py-32 text-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 37, 69, 0.75), rgba(11, 37, 69, 0.85)), url('https://images.stockcake.com/public/4/f/4/4f4296af-a359-4bcd-83ba-5b3614b9da12_large/vibrant-concert-crowd-stockcake.jpg')`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="container mx-auto px-6 relative z-10"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
            Live Events & Shows
            <br />
            <span className="text-[#FFD447] drop-shadow-lg">At IMC Music Club</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90">
            Experience unforgettable nights of music, energy, and entertainment. Book your seats now!
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] font-black text-lg py-4 px-10 rounded-full shadow-2xl"
          >
            Explore Events →
          </motion.button>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="flex-1 px-4 py-10" style={{ backgroundColor: COLORS.cream }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-6" style={{ color: COLORS.navy }}>
            🎟️ Events & Shows
          </h1>

          <div className="relative mb-6 max-w-md">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 py-2 rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD447]"
            />
          </div>

          {loading ? (
            <p className="text-center py-20 text-[#0B2545] text-xl">Loading events...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-20 text-[#0B2545] text-xl">No events found.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((e) => (
                <motion.div
                  key={e.id}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
                >
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-[#0B2545] mb-2">{e.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-4">
                      <FaMapMarkerAlt className="text-[#FF7A3C]" /> {e.location}
                    </p>

                    <div className="space-y-3 text-[#0B2545]">
                      <div className="flex gap-3 items-center">
                        <FaCalendarAlt className="text-[#FF7A3C]" /> {e.event_date}
                      </div>
                      <div className="flex gap-3 items-center">
                        <FaClock className="text-[#FF7A3C]" /> {e.event_time}
                      </div>
                      <div className="flex gap-3 items-center">
                        <FaChair className="text-[#FF7A3C]" /> {e.available_seats} seats available
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <span className="font-black text-3xl text-[#FF7A3C]">
                        ₹{e.ticket_price}
                      </span>
                      <button
                        onClick={() => setActiveEvent(e)}
                        className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] px-6 py-3 rounded-full font-bold text-[#0B2545] shadow-lg hover:shadow-xl transition"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reusable Footer Component */}
      <Footer />

      {/* Booking Modal */}
      {activeEvent && (
        <SeatSelectionModal
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          onBookingCreated={fetchEvents}
        />
      )}
    </div>
  );
}