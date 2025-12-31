// src/pages/MyBookings.jsx
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

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

// All booking endpoints — SINGER BOOKING NOW INCLUDED
const BOOKING_ENDPOINTS = {
  classes: `${BASE}/auth/singing-classes/`,
  studio: `${BASE}/auth/studios/`,
  videography: `${BASE}/auth/videography-bookings/`,
  photography: `${BASE}/auth/photography-bookings/`,
  private: `${BASE}/auth/private-bookings/`,
  singer: `${BASE}/auth/singer-bookings/`, // ← Make sure this matches your backend endpoint
};

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Icon for each type
const getBookingIcon = (type) => {
  switch (type) {
    case "classes": return <Music className="w-6 h-6" />;
    case "studio": return <Mic2 className="w-6 h-6" />;
    case "videography": return <Video className="w-6 h-6" />;
    case "photography": return <Camera className="w-6 h-6" />;
    case "private": return <Star className="w-6 h-6" />;
    case "singer": return <Mic2 className="w-6 h-6 text-purple-600" />; // Special for singer
    default: return <Users className="w-6 h-6" />;
  }
};

// Title for each type
const getBookingTitle = (type) => {
  switch (type) {
    case "classes": return "Singing Class";
    case "studio": return "Studio Session";
    case "videography": return "Videography Project";
    case "photography": return "Photography Shoot";
    case "private": return "Private Event";
    case "singer": return "Singer Performance";
    default: return "Booking";
  }
};

// Status badge
const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("confirmed") || s.includes("paid") || s.includes("success")) {
    return { text: "Confirmed", color: "bg-green-100 text-green-800", icon: <CheckCircle size={16} /> };
  }
  if (s.includes("cancelled") || s.includes("rejected")) {
    return { text: "Cancelled", color: "bg-red-100 text-red-800", icon: <XCircle size={16} /> };
  }
  return { text: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <ClockIcon size={16} /> };
};

export default function MyBookings() {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllBookings = async () => {
      setLoading(true);
      setError("");
      const bookings = [];

      try {
        const requests = Object.entries(BOOKING_ENDPOINTS).map(async ([type, url]) => {
          try {
            const res = await api.get(url);
            const data = Array.isArray(res.data)
              ? res.data
              : res.data?.results || [];

            return data.map(item => ({
              ...item,
              _type: type,
            }));
          } catch (e) {
            console.warn(`Failed to load ${type} bookings:`, e.message);
            return [];
          }
        });

        const results = await Promise.all(requests);
        results.flat().forEach(booking => bookings.push(booking));

        // Sort newest first
        bookings.sort((a, b) => 
          new Date(b.created_at || b.performance_date || b.shoot_date || b.date || 0) - 
          new Date(a.created_at || a.performance_date || a.shoot_date || a.date || 0)
        );

        setAllBookings(bookings);
      } catch (err) {
        setError("Failed to load bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mb-6"></div>
          <p className="text-2xl text-gray-700 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

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
            <a href="/services" className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition">
              Explore Services
            </a>
            <a href="/singer-booking" className="px-10 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition">
              Book a Singer
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          My Bookings & Enrollments
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          All your classes, studio sessions, singer performances, videography, photography, and events
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {allBookings.map((booking, index) => {
          const type = booking._type;
          const status = getStatusBadge(booking.status || booking.payment_status || "pending");

          // Smart title — works even if field names differ
          const title = 
            booking.singer_name ||                    // Singer booking
            booking.project ||
            booking.studio_name ||
            booking.batch?.class_name ||
            booking.event_type ||
            booking.class_name ||
            getBookingTitle(type);

          // Date
          const date = 
            booking.performance_date ||               // Singer booking
            booking.shoot_date || 
            booking.date || 
            "Date TBD";

          // Time
          const time = 
            booking.time_slot || 
            booking.start_time || 
            (booking.batch ? `${booking.batch.day} ${booking.batch.time_slot}` : "Time TBD");

          // Location
          const location = 
            booking.performance_location ||           // Singer booking
            booking.location || 
            booking.venue || 
            "TBD";

          // Price
          const price = 
            booking.rate ||                           // Singer rate
            booking.package_price ||
            booking.fee ||
            (booking.hourly_rate && booking.duration_hours 
              ? booking.hourly_rate * booking.duration_hours 
              : null) ||
            "On Request";

          return (
            <motion.div
              key={`${type}-${booking.id || index}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {getBookingIcon(type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-sm opacity-90">{getBookingTitle(type)}</p>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${status.color}`}>
                  {status.icon}
                  {status.text}
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span className="font-medium">{date}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>{time}</span>
                </div>

                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
                  <span>{location}</span>
                </div>

                {price && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{typeof price === "number" ? price.toLocaleString() : price}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-8 py-5 flex justify-between items-center text-sm text-gray-600">
                <span>
                  Booked on {new Date(booking.created_at || Date.now()).toLocaleDateString()}
                </span>
                <a href="#" className="text-amber-600 font-semibold hover:text-amber-700 transition">
                  View Details →
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}