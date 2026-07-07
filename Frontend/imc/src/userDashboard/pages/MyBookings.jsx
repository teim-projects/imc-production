// src/userDashboard/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Video,
  Camera,
  Star,
  Users,
  Mic2,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  IndianRupee,
} from "lucide-react";

// VITE_BASE_API_URL already includes /api (e.g. https://www.imcpune.in/api)
// Locally we fall back to http://127.0.0.1:8000/api/auth
const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

// Single authenticated API instance
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Icon per service_type (matches MyBookingsView response)
const getBookingIcon = (serviceType) => {
  switch (serviceType) {
    case "singing_class": return <Music className="w-6 h-6" />;
    case "studio":        return <Mic2 className="w-6 h-6" />;
    case "videography":   return <Video className="w-6 h-6" />;
    case "photography":   return <Camera className="w-6 h-6" />;
    case "private":       return <Star className="w-6 h-6" />;
    case "event":         return <Users className="w-6 h-6" />;
    case "singer":        return <Mic2 className="w-6 h-6 text-purple-600" />;
    default:              return <Users className="w-6 h-6" />;
  }
};

// Payment / status badge
const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("confirmed") || s.includes("paid") || s.includes("success") || s.includes("active")) {
    return { text: "Confirmed", color: "bg-green-100 text-green-800", icon: <CheckCircle size={16} /> };
  }
  if (s.includes("cancelled") || s.includes("rejected") || s.includes("failed")) {
    return { text: "Cancelled", color: "bg-red-100 text-red-800", icon: <XCircle size={16} /> };
  }
  return { text: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <ClockIcon size={16} /> };
};

export default function MyBookings() {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        // Single endpoint — already filters by authenticated user on the backend
        const res = await api.get(`${BASE}/auth/my-bookings/`);
        const data = res.data?.results ?? (Array.isArray(res.data) ? res.data : []);
        setAllBookings(data);
      } catch (err) {
        console.error("MyBookings fetch error:", err);
        if (err.response?.status === 401) {
          setError("Please log in to view your bookings.");
        } else {
          setError("Failed to load bookings. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mb-6" />
          <p className="text-2xl text-gray-700 font-medium">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <p className="text-2xl text-gray-800 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (allBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-200 border-2 border-dashed rounded-3xl w-40 h-40 mx-auto mb-8 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-gray-400" />
          </div>
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">No Bookings Yet</h2>
          <p className="text-xl text-gray-600 mb-10">
            You haven't booked any classes, studios, singers, or events yet. Start exploring!
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="/services"
              className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition"
            >
              Explore Services
            </a>
            <a
              href="/singer-booking"
              className="px-10 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition"
            >
              Book a Singer
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking list ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          My Bookings &amp; Enrollments
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          All your classes, studio sessions, singer performances, videography, photography, and events
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {allBookings.map((booking, index) => {
          // MyBookingsView already normalises these fields
          const serviceType  = booking.service_type || "booking";
          const title        = booking.title        || booking.service || "Booking";
          const date         = booking.date         || "Date TBD";
          const timeSlot     = booking.time_slot    || "Time TBD";
          const location     = booking.location     || "TBD";
          const amount       = booking.amount;

          // Booking status badge (booked/confirmed = green, available = yellow, cancelled = red)
          const bookingStatus = booking.status || "pending";
          const badge = getStatusBadge(
            bookingStatus === "booked" ? "confirmed" : bookingStatus
          );

          // Separate payment badge
          const paymentStatus = (booking.payment_status || "pending").toLowerCase();
          const paymentBadge =
            paymentStatus.includes("paid") || paymentStatus.includes("success")
              ? { text: "Paid", color: "bg-green-100 text-green-700" }
              : paymentStatus.includes("failed") || paymentStatus.includes("cancel")
              ? { text: "Failed", color: "bg-red-100 text-red-700" }
              : { text: "Payment Pending", color: "bg-orange-100 text-orange-700" };

          return (
            <motion.div
              key={`${serviceType}-${booking.id ?? index}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 border border-gray-100"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {getBookingIcon(serviceType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-sm opacity-90">{booking.service}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${badge.color}`}>
                  {badge.icon}
                  {badge.text}
                </div>
              </div>

              {/* Card body */}
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="font-medium">{date}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>{timeSlot}</span>
                </div>

                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <span>{location}</span>
                </div>

                {amount != null && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{typeof amount === "number" ? amount.toLocaleString() : amount}
                    </span>
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="bg-gray-50 px-8 py-4 flex justify-between items-center text-sm text-gray-600">
                <span>
                  Booked on{" "}
                  {booking.created_at
                    ? new Date(booking.created_at).toLocaleDateString()
                    : "—"}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentBadge.color}`}>
                    {paymentBadge.text}
                  </span>
                  <span className="text-amber-600 font-semibold">#{booking.id}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
