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
import { Loader2 } from "lucide-react"; // or use any spinner icon

/* ===================== CONFIG ===================== */

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

const EVENTS_URL = `${BASE}/user/events/`;
const BOOKINGS_URL = `${BASE}/user/event-bookings/`;
const PAYMENT_CREATE_API = `${BASE}/payments/create-payment/`;
const PAYMENT_STATUS_API = `${BASE}/payments/check-status/`;

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
   BOOKING MODAL WITH PAYMENT
====================================================== */

function BookingModal({ event, onClose, onSuccess }) {
  // Step: 'form' | 'processing' | 'success' | 'failed'
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    email: "",
    number_of_tickets: 1,
    payment_method: "UPI",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  if (!event) return null;

  const ticketPrice = Number(event.ticket_price) || 0;
  const total = form.number_of_tickets * ticketPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "number_of_tickets" ? Number(value) : value,
    }));
    setError("");
  };

  // Poll payment status
  useEffect(() => {
    if (step !== "processing") return;

    if (orderId) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(PAYMENT_STATUS_API, {
            params: { order_id: orderId },
          });
          const status = res.data?.status?.toUpperCase() || "";
          if (status === "CHARGED" || res.data?.success === true) {
            setStep("success");
            clearInterval(interval);
            onSuccess(); // refresh events list
          } else if (status === "FAILED" || status === "EXPIRED") {
            setStep("failed");
            setError("Payment failed or expired. Please try again.");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("[POLL ERROR]", err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [step, orderId, onSuccess]);

  // On modal open, check if we returned from payment gateway
  useEffect(() => {
    const storedOrderId = sessionStorage.getItem("event_order_id");
    if (storedOrderId && step === "form") {
      setOrderId(storedOrderId);
      setStep("processing");
    }
  }, [step]);

  // Reset modal state
  const resetModal = () => {
    setStep("form");
    setOrderId(null);
    setBookingId(null);
    setError("");
    setLoading(false);
    sessionStorage.removeItem("event_order_id");
    onClose();
  };

  // Submit booking & initiate payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
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
      // 1. Create the booking
      const bookingRes = await api.post(BOOKINGS_URL, {
        event: event.id,
        customer_name: form.customer_name.trim(),
        contact_number: form.contact_number.trim(),
        email: form.email.trim() || null,
        number_of_tickets: form.number_of_tickets,
        total_amount: total,
        payment_method: form.payment_method,
        payment_status: "pending", // optional, backend may set default
      });

      const newBookingId = bookingRes.data?.id || bookingRes.data?.booking_id;
      if (!newBookingId) {
        throw new Error("Booking created but no ID returned");
      }
      setBookingId(newBookingId);

      // ===================== FIXED PAYMENT PAYLOAD =====================
      // Backend expects 'registration_id' and service = 'auditorium_music_shows'
      // Amount is fetched from booking by backend, so we don't send it.
      const paymentPayload = {
        registration_id: newBookingId,
        service: "auditorium_music_shows",
      };
      // =================================================================

      const paymentRes = await api.post(PAYMENT_CREATE_API, paymentPayload);
      const pData = paymentRes.data;
      console.log("Payment Response:", pData);

      const paymentUrl =
        pData?.payment_links?.web ||
        pData?.payment_url ||
        pData?.link ||
        pData?.redirect_url;

      if (paymentUrl) {
        // Save orderId for polling after return
        const newOrderId = pData?.order_id;
        if (newOrderId) {
          sessionStorage.setItem("event_order_id", newOrderId);
          setOrderId(newOrderId);
        }
        // Redirect to payment gateway
        window.location.href = paymentUrl;
        // Set step to processing (though page will unload)
        setStep("processing");
        setLoading(false);
      } else {
        // No payment URL – maybe payment is already completed or manual
        const newOrderId = pData?.order_id;
        if (newOrderId) {
          setOrderId(newOrderId);
          setStep("processing");
          setLoading(false);
          setError("Payment initiated. Please complete payment in the next window.");
        } else {
          throw new Error("No payment URL or order ID received");
        }
      }
    } catch (err) {
      console.error("Booking/payment error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.message ||
        "Booking failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  // Render based on step
  if (step === "success") {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-md p-6 text-center shadow-2xl"
            initial={{ y: 80, scale: 0.92 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 60, scale: 0.9 }}
          >
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-700 mb-3">
              Payment Successful!
            </h3>
            <p className="text-gray-700 mb-2">
              Your booking is confirmed, {form.customer_name.split(" ")[0]}!
            </p>
            <p className="text-gray-500 text-sm mb-6">
              We'll send you the event details on your phone.
            </p>
            <button
              onClick={resetModal}
              className="w-full bg-gradient-to-r from-[#FFD447] to-[#FF7A3C] text-[#0B2545] font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (step === "failed") {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-md p-6 text-center shadow-2xl"
            initial={{ y: 80, scale: 0.92 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 60, scale: 0.9 }}
          >
            <FaTimes className="text-red-500 text-6xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-700 mb-3">
              Payment Failed
            </h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => {
                setStep("form");
                setError("");
                setLoading(false);
                sessionStorage.removeItem("event_order_id");
              }}
              className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl shadow-md hover:bg-gray-300 transition-all"
            >
              Try Again
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Form step (including processing state)
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
            onClick={resetModal}
            className="absolute top-4 right-5 text-gray-500 hover:text-gray-800 transition-colors"
            disabled={loading || step === "processing"}
          >
            <FaTimes size={22} />
          </button>

          <h2 className="text-2xl font-bold text-[#0B2545] mb-6 pr-10">
            {event.name}
          </h2>

          {step === "processing" ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-orange-500 w-12 h-12 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-medium">
                Processing your payment...
              </p>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                {loading ? (
                  <>
                    <Loader2 className="animate-spin inline w-5 h-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
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