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
  FaCheckCircle,
} from "react-icons/fa";

/* ===================== CONFIG ===================== */

const BASE = import.meta?.env?.VITE_BASE_API_URL || "https://www.imcpune.in/api";

const EVENTS_URL = `${BASE}/user/events/`;
const BOOKINGS_URL = `${BASE}/user/event-bookings/`;

/* ===================== AXIOS INSTANCE ===================== */

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ======================================================
   BOOKING MODAL – FORM STYLE (NO SEAT SELECTION)
====================================================== */

function BookingModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    number_of_tickets: 1,
    payment_method: "UPI",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!event) return null;

  const ticketPrice = Number(event.ticket_price) || 0;
  const total = form.number_of_tickets * ticketPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "number_of_tickets" ? Number(value) : value,
    }));
    setError(""); // clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.customer_name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!form.contact_number.trim() || form.contact_number.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (form.number_of_tickets < 1) {
      setError("Please select at least 1 ticket");
      return;
    }

    setLoading(true);

    try {
      await api.post(BOOKINGS_URL, {
        event: event.id,
        customer_name: form.customer_name.trim(),
        contact_number: form.contact_number.trim(),
        email: form.email.trim() || null,
        number_of_tickets: form.number_of_tickets,
        total_amount: total,
        payment_method: form.payment_method,
      });

      setSuccess(true);

      // Auto-refresh parent list & close after short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (err) {
      console.error("Booking error:", err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Could not complete booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-md p-6 md:p-7 shadow-2xl relative"
          initial={{ y: 80, scale: 0.92 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 60, scale: 0.9 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-gray-500 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            <FaTimes size={22} />
          </button>

          <h2 className="text-2xl font-bold text-[#0B2545] mb-6 pr-10">
            {event.name}
          </h2>

          {success ? (
            <div className="text-center py-12">
              <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-700 mb-3">
                Booking Confirmed!
              </h3>
              <p className="text-gray-600 mb-2">
                Thank you, {form.customer_name.split(" ")[0]}!
              </p>
              <p className="text-gray-500 text-sm">
                You'll receive confirmation on your phone shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none text-base"
                  required
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none text-base"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email (optional)
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none text-base"
                  disabled={loading}
                />
              </div>

              {/* Tickets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Number of Tickets
                </label>
                <select
                  name="number_of_tickets"
                  value={form.number_of_tickets}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none bg-white text-base"
                  disabled={loading}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "ticket" : "tickets"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none bg-white text-base"
                  disabled={loading}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash at Venue</option>
                </select>
              </div>

              {/* Total */}
              <div className="pt-3 pb-2 flex justify-between items-center text-xl font-bold">
                <span className="text-gray-800">Total Amount:</span>
                <span className="text-[#FF7A3C]">₹{total.toLocaleString()}</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3.5 px-6 rounded-xl font-bold text-lg shadow-lg transition-all
                  ${
                    loading
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] hover:brightness-105 hover:shadow-xl"
                  }
                `}
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ======================================================
   MAIN EVENTS PAGE
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
      console.error("Failed to fetch events:", err);
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
      className="min-h-screen pb-20"
      style={{ background: "linear-gradient(to bottom, #FFF7DF, #ffffff)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-600/10 rounded-full mb-6">
            <FaTicketAlt className="text-orange-600" size={20} />
            <span className="text-sm font-bold text-orange-800 uppercase tracking-wider">
              Live Events • Concerts • Comedy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B2545] mb-5 leading-tight">
            Live Events & Shows
            <br />
            <span className="text-[#FF7A3C]">IMC Music Club</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
            Experience unforgettable nights of music, energy & entertainment.
            Book your spot now! 🎤🔥
          </p>
        </section>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <FaSearch
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              placeholder="Search events by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full border border-gray-300 focus:border-[#FF7A3C] focus:ring-2 focus:ring-orange-100 outline-none bg-white shadow-md text-base"
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-600 text-xl font-medium">
            Loading events...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">
            No events found matching your search.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
            {filtered.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={
                    event.image ||
                    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format"
                  }
                  alt={event.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0B2545] mb-4 line-clamp-2">
                    {event.name}
                  </h3>

                  <div className="space-y-3 text-gray-700 mb-6">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-[#FF7A3C]" size={18} />
                      <span>{event.event_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaClock className="text-[#FF7A3C]" size={18} />
                      <span>{event.event_time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-[#FF7A3C]" size={18} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaUsers className="text-[#FF7A3C]" size={18} />
                      <span>
                        {event.available_seats ?? "?"} seats left
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-[#FF7A3C]">
                      ₹{Number(event.ticket_price).toLocaleString()}
                    </div>

                    <button
                      onClick={() => setActiveEvent(event)}
                      className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] px-7 py-3 rounded-full font-semibold shadow-md hover:shadow-xl hover:brightness-105 transition-all"
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

      {/* Connect section */}
      <section className="mt-16 py-16 bg-gradient-to-br from-[#0B2545] to-[#1e3a70] text-white text-center">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Let’s <span className="text-[#FF7A3C]">Connect</span>
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Questions about events, bookings, or private parties? Just reach out!
          </p>
        </div>
      </section>

      {/* Modal */}
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