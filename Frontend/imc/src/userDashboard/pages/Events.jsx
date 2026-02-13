import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaSearch,
  FaTicketAlt,
  FaTimes,
} from "react-icons/fa";

/* ===================== API ===================== */

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

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

/* ======================================================
   SIMPLE BOOKING MODAL (NO SEATS)
====================================================== */

function BookingModal({ event, onClose, onSuccess }) {
  const [tickets, setTickets] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!event) return null;

  const total = tickets * Number(event.ticket_price || 0);

  const submitBooking = async () => {
    if (!name || !phone) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      await api.post(BOOKINGS_URL, {
        event: event.id,
        customer_name: name,
        contact_number: phone,
        number_of_tickets: tickets,
        total_amount: total,
        payment_method: payment,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl"
          initial={{ y: 50, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-800">{event.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              placeholder="Your Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none"
              required
            />

            <input
              placeholder="Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none"
              required
            />

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Number of Tickets
              </label>
              <select
                value={tickets}
                onChange={(e) => setTickets(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            >
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>

            <div className="text-right text-base font-bold text-orange-600">
              Total ₹{total}
            </div>

            {error && <div className="text-xs text-red-600">{error}</div>}

            <button
              onClick={submitBooking}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] font-semibold py-2.5 rounded-lg text-sm shadow-md hover:shadow-lg transition-all"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
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
    try {
      const res = await api.get(EVENTS_URL);
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
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
    <div
      className="min-h-screen pb-16"
      style={{ background: "linear-gradient(to bottom, #FFF7DF, #ffffff)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO SECTION */}
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-600/20 rounded-full mb-5">
            <FaTicketAlt className="text-orange-600" />
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
              Live Music & Energy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#0B2545] mb-4">
            Live Events & Shows
            <br />
            <span className="text-[#FF7A3C]">At IMC Music Club</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto mb-6">
            Experience unforgettable nights of music, energy, and entertainment.  
            Book your seats now! 🎤🔥
          </p>

          {/* SMALLER EXPLORE EVENTS BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm rounded-full shadow-md hover:shadow-lg transition-all"
          >
            
          </motion.button>
        </section>

        {/* SEARCH BAR */}
        <div className="relative max-w-lg mx-auto mb-10">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search events by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none bg-white shadow-sm"
          />
        </div>

        {/* EVENTS GRID */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events found matching your search.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={
                    e.image ||
                    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
                  }
                  alt={e.name}
                  className="h-48 w-full object-cover"
                />

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#0B2545] mb-3 line-clamp-2">
                    {e.name}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-orange-500" /> {e.event_date}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-orange-500" /> {e.event_time}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-orange-500" /> {e.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-orange-500" /> {e.available_seats} seats left
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[#FF7A3C]">
                      ₹{e.ticket_price}
                    </span>
                    <button
                      onClick={() => setActiveEvent(e)}
                      className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] px-4 py-1.5 rounded-full font-medium text-sm shadow-md hover:shadow-lg transition-all"
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

      {/* Connect Section */}
      <section className="mt-16 py-12 bg-gradient-to-br from-[#0B2545] to-[#1a3a6e] text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Let’s <span className="text-[#FF7A3C]">Connect</span>
          </h2>
          <p className="text-lg opacity-90">
            Questions about classes, studio sessions, or events? Drop us a message 🎤
          </p>
        </div>
      </section>

      {/* Booking Modal */}
      {activeEvent && (
        <BookingModal
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          onSuccess={fetchEvents}
        />
      )}
    </div>
  );
}