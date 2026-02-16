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
  FaUsers,
  FaTicketAlt,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Import the new Footer component
import Footer from "../../components/footer";

/* ===================== API CONFIG ===================== */
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
   FORM BOOKING MODAL – with Basic / Premium / VIP options
====================================================== */
function BookingModal({ event, onClose, onBookingCreated }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tickets, setTickets] = useState(1);
  const [ticketType, setTicketType] = useState("general"); // "general", "basic", "premium", "vip"
  const [payment, setPayment] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!event) return null;

  // Determine available ticket types and their prices
  const ticketOptions = [
 
    {
      type: "basic",
      label: "Basic",
      price: Number(event.basic_price || 0),
      available: Number(event.basic_price) > 0,
    },
    {
      type: "premium",
      label: "Premium",
      price: Number(event.premium_price || 0),
      available: Number(event.premium_price) > 0,
    },
    {
      type: "vip",
      label: "VIP",
      price: Number(event.vip_price || 0),
      available: Number(event.vip_price) > 0,
    },
  ].filter((opt) => opt.available && opt.price > 0);

  // Default to first available option if none selected
  useEffect(() => {
    if (ticketOptions.length > 0 && !ticketOptions.some((opt) => opt.type === ticketType)) {
      setTicketType(ticketOptions[0].type);
    }
  }, [event, ticketType]);

  const selectedOption = ticketOptions.find((opt) => opt.type === ticketType) || ticketOptions[0] || {};
  const pricePerTicket = selectedOption.price || 0;
  const total = tickets * pricePerTicket;

  const submitBooking = async () => {
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (tickets < 1) {
      setError("Please select at least 1 ticket");
      return;
    }

    if (!selectedOption.type) {
      setError("Please select a ticket type");
      return;
    }

    try {
      setLoading(true);
      await api.post(BOOKINGS_URL, {
        event: event.id,
        customer_name: name.trim(),
        contact_number: phone.trim(),
        ticket_type: selectedOption.type === "general" ? null : selectedOption.type, // or send "basic"/"premium"/"vip"
        number_of_tickets: tickets,
        total_amount: total,
        payment_method: payment,
      });
      onBookingCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

return (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]"
        initial={{ y: 60, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-[#0B2545] mt-5">
            {event.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-[#0B2545]"
            disabled={loading}
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* Full Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FFD447]/30 outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number * (10 digits)
              </label>
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder="9876543210"
                maxLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FFD447]/30 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Ticket Type */}
          {ticketOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Type
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ticketOptions.map((opt) => (
                  <label
                    key={opt.type}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      ticketType === opt.type
                        ? "border-[#FF7A3C] bg-[#FFD447]/10"
                        : "border-gray-300 hover:border-[#FF7A3C]/50"
                    }`}
                  >
                    <div>
                      <div className="font-medium">
                        {opt.label}
                      </div>
                      <div className="text-sm text-[#FF7A3C] font-bold">
                        ₹{opt.price.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="ticketType"
                      checked={ticketType === opt.type}
                      onChange={() => setTicketType(opt.type)}
                      className="w-5 h-5 accent-[#FF7A3C]"
                      disabled={loading}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tickets + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Tickets
              </label>
              <select
                value={tickets}
                onChange={(e) =>
                  setTickets(Number(e.target.value))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:border-[#FF7A3C] outline-none"
                disabled={loading}
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n > 1 ? "tickets" : "ticket"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Method
              </label>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:border-[#FF7A3C] outline-none"
                disabled={loading}
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash at Venue</option>
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="pt-2 flex justify-between items-center text-xl font-bold">
            <span className="text-gray-800">Total:</span>
            <span className="text-[#FF7A3C]">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={submitBooking}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md ${
              loading
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] hover:brightness-105 hover:shadow-lg"
            }`}
          >
            {loading ? "Processing..." : "Confirm Booking"}
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
      setEvents(Array.isArray(res.data) ? res.data : []);
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
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
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
            Experience unforgettable nights of music, energy, and entertainment. Book your tickets now!
          </p>
          
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="flex-1 px-4 py-10" style={{ backgroundColor: COLORS.cream }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-6" style={{ color: COLORS.navy }}>
            🎟️ Events & Shows
          </h1>

          <div className="relative mb-8 max-w-lg mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Search events by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 rounded-full border border-gray-300 focus:border-[#FF7A3C] focus:ring-2 focus:ring-[#FFD447]/30 outline-none shadow-sm"
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
                  <div className="p-7">
                    <h3 className="font-bold text-2xl text-[#0B2545] mb-4">{e.name}</h3>

                    <div className="space-y-3 text-[#0B2545] mb-6">
                      <div className="flex gap-3 items-center">
                        <FaMapMarkerAlt className="text-[#FF7A3C] text-xl" /> {e.location}
                      </div>
                      <div className="flex gap-3 items-center">
                        <FaCalendarAlt className="text-[#FF7A3C] text-xl" /> {e.event_date}
                      </div>
                      <div className="flex gap-3 items-center">
                        <FaClock className="text-[#FF7A3C] text-xl" /> {e.event_time}
                      </div>
                      <div className="flex gap-3 items-center">
                        <FaUsers className="text-[#FF7A3C] text-xl" /> {e.available_seats || "?"} spots left
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-black text-3xl text-[#FF7A3C]">
                        ₹{Number(e.ticket_price || 0).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => setActiveEvent(e)}
                        className="bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] px-8 py-3.5 rounded-full font-bold text-[#0B2545] shadow-lg hover:shadow-xl transition"
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

      {/* Footer */}
      <Footer />

      {/* Booking Modal */}
      {activeEvent && (
        <BookingModal
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          onBookingCreated={fetchEvents}
        />
      )}
    </div>
  );
}