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
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
          initial={{ y: 40 }}
          animate={{ y: 0 }}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{event.name}</h3>
            <button onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* FORM */}
          <div className="space-y-4">
            <input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <div>
              <label className="text-sm font-medium">
                Number of Tickets
              </label>
              <select
                value={tickets}
                onChange={(e) => setTickets(Number(e.target.value))}
                className="w-full border rounded-xl p-3 mt-1"
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
              className="w-full border rounded-xl p-3"
            >
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>

            <div className="text-right text-lg font-bold text-orange-600">
              Total ₹{total}
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <button
              onClick={submitBooking}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] font-bold py-3 rounded-xl"
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
    const res = await api.get(EVENTS_URL);
    setEvents(res.data || []);
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
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: COLORS.cream }}
    >
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1
            className="text-4xl font-extrabold"
            style={{ color: COLORS.navy }}
          >
            🎟️ Upcoming Events
          </h1>
          <p className="text-slate-600 mt-2">
            Discover and book live shows, concerts & karaoke nights
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative mb-8 max-w-md">
          <FaSearch className="absolute left-4 top-3 text-gray-400" />
          <input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 py-3 rounded-full border"
          />
        </div>

        {/* EVENTS GRID */}
        {loading ? (
          <p>Loading events...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
              >
                <img
                  src={
                    e.image ||
                    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
                  }
                  alt={e.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0B2545]">
                    {e.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex gap-2">
                      <FaCalendarAlt /> {e.event_date}
                    </div>
                    <div className="flex gap-2">
                      <FaClock /> {e.event_time}
                    </div>
                    <div className="flex gap-2">
                      <FaMapMarkerAlt /> {e.location}
                    </div>
                    <div className="flex gap-2">
                      <FaUsers /> {e.available_seats} seats
                    </div>
                  </div>

                  <div className="mt-5 flex justify-between items-center">
                    <span className="text-xl font-bold text-orange-600">
                      ₹{e.ticket_price}
                    </span>
                    <button
                      onClick={() => setActiveEvent(e)}
                      className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] px-5 py-2 rounded-full font-semibold text-[#0B2545]"
                    >
                      Book Tickets
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
