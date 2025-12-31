// src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Charts from "./Charts";

/* Forms (your existing imports) */
import StudioForm from "./Forms/StudioForm";
import StudioMasterForm from "./Forms/StudioMasterForm";
import SingingClassForm from "./Forms/SingingClassForm";
import EventsForm from "./Forms/EventsForm";

import PhotographyForm from "./Forms/PhotographyForm";
import VideographyForm from "./Forms/VideographyForm";
import SoundSystemService from "./Forms/SoundSystemService";
import SingerForm from "./Forms/SingerForm";
import TrainerForm from "./Forms/TrainerForm";
import UserForm from "./Forms/UserForm";
import PrivateBookingForm from "./Forms/PrivateBookingForm";



import { motion } from "framer-motion";
import {
  FaUsers,
  FaMicrophone,
  FaCalendarAlt,
  FaDollarSign,
  FaCalendarCheck,
  FaHeadphonesAlt,
  FaRupeeSign,
  FaClock,
  FaFire,
  FaArrowUp,
  FaBell,
} from "react-icons/fa";
import CountUp from "react-countup";

import "./Dashboard.css";

/* ---------------- Allowed keys (keep in sync with Sidebar) ---------------- */
const ALLOWED_KEYS = new Set([
  null,
  "studio", "studioMaster", "equipment", "events", "photography", "videography", "sound",
  "singer", "payment", "private",
  // Singing classes keys added:
  "classes", "addClass", "viewClass",
  // existing keys
  "addStudio", "viewStudio",
  "addEquipment", "viewEquipment",
  "addEvent", "viewEvent",
  
  "addPrivate", "viewPrivate",
  "addPhotography", "viewPhotography",
  "addVideography", "viewVideography",
  "addSound", "viewSound",
  "addSinger", "viewSinger",
  "addTrainer",
  "viewTrainer",
  "addUser", "viewUser",
  "addStudioMaster", "viewStudioMaster",
]);

/* pretty title helper */
const prettyTitle = (k) => {
  if (!k) return "Overview";
  const map = {
    studio: "Studio", studioMaster: "Studio Master", equipment: "Equipment",
    events: "Events", photography: "Photography", videography: "Videography",
    sound: "Sound", singer: "Singer", payment: "Payment", user: "Users", private: "Private Bookings",
    addStudio: "Add Studio Booking", viewStudio: "View Studio Bookings",
    addEquipment: " Singing Class", viewEquipment: "View Singing Classes",
    addEvent: "Live & Karoke ", viewEvent: "View Events",
   
    addPrivate: "Add Private Music Events  ", viewPrivate: "View Private Bookings",
    addPhotography: "Add Photography Service ", viewPhotography: "View Photography Bookings",
    addVideography: " Videography Service ", viewVideography: "View Videography Bookings",
    addSound: "Add Sound System Service", viewSound: "View Sound Jobs",
    addSinger: "Add Singer", viewSinger: "View Singers",
    addTrainer: "Add Trainer",
    viewTrainer: "View Trainers",
    addUser: "Add User", viewUser: "View Users",
    addStudioMaster: "Add Studio (Master)", viewStudioMaster: "View Studios (Master)",
    // Singing classes labels
    classes: "Singing Classes",
    addClass: "Add Singing Class",
    viewClass: "View Singing Classes",
  };
  return map[k] ?? "Overview";
};

const defaultTabFor = (key) => (key && key.startsWith("view") ? "VIEW" : "ADD");

/* --------------------------- MAIN COMPONENT ---------------------------- */
export default function Dashboard() {
  const [activeForm, setActiveForm] = useState(null);

  const [dashboard, setDashboard] = useState({
    // modern hero / stats
    totalRevenue: 0,
    monthlyGrowth: 42,
    activeBookings: 0,
    todayCheckins: 0,
    upcomingThisWeek: 18,
    hotStreak: 7,
    recentActivities: [],
    // legacy keys
    customers: 0,
    bookings: 0,
    events: 0,
    revenue: 0,
    recent_bookings: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
  const DASHBOARD_URL = `${BASE.replace(/\/$/, "")}/auth/dashboard/`;

  /* safe setter that ignores unknown keys */
  const safeSetActiveForm = useCallback((key) => {
    setActiveForm(ALLOWED_KEYS.has(key) ? key : null);
  }, []);

  const closeForm = useCallback(() => setActiveForm(null), []);

  /* page title */
  useEffect(() => {
    const base = "IMC Music Hub";
    document.title = activeForm ? `${prettyTitle(activeForm)} — ${base}` : `${base} — Dashboard`;
  }, [activeForm]);

  /* fetch dashboard data */
  const fetchDashboard = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(DASHBOARD_URL, { headers });

      setDashboard((prev) => ({
        ...prev,
        totalRevenue: res?.data?.revenue ?? prev.totalRevenue,
        monthlyGrowth: res?.data?.monthly_growth ?? prev.monthlyGrowth,
        activeBookings: res?.data?.bookings ?? prev.activeBookings,
        todayCheckins: res?.data?.checked_in ?? prev.todayCheckins,
        upcomingThisWeek: res?.data?.upcoming_this_week ?? prev.upcomingThisWeek,
        hotStreak: res?.data?.hot_streak ?? prev.hotStreak,
        recentActivities: res?.data?.recent_bookings ?? prev.recentActivities,
        customers: res?.data?.customers ?? prev.customers,
        bookings: res?.data?.bookings ?? prev.bookings,
        events: res?.data?.events ?? prev.events,
        revenue: res?.data?.revenue ?? prev.revenue,
        recent_bookings: res?.data?.recent_bookings ?? prev.recent_bookings,
      }));
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setFetchError(err?.response?.data?.detail || err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const intr = setInterval(fetchDashboard, 1000 * 60 * 2);
    return () => clearInterval(intr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* render active form */
  const renderForm = () => {
    switch (activeForm) {
      case "studio":          return <StudioForm onClose={closeForm} />;
      case "studioMaster":    return <StudioMasterForm defaultTab="ADD" />;
      case "equipment":       return <SingingClassForm onClose={closeForm} />;
      case "events":          return <EventsForm onClose={closeForm} />;
      case "photography":     return <PhotographyForm onClose={closeForm} />;
      case "videography":     return <VideographyForm onClose={closeForm} />;
      case "sound":           return <SoundSystemService />;
      case "singer":          return <SingerForm onClose={closeForm} />;
      case "payment":         return <PaymentForm onClose={closeForm} />;
      case "user":            return <UserForm onClose={closeForm} />;
      case "private":         return <PrivateBookingForm onClose={closeForm} />;

      case "addStudio":       return <StudioForm onClose={closeForm} viewOnly={false} />;
      case "viewStudio":      return <StudioForm onClose={closeForm} viewOnly />;

      case "addStudioMaster":  return <StudioMasterForm defaultTab="ADD" />;
      case "viewStudioMaster": return <StudioMasterForm defaultTab="VIEW" />;

      case "addEquipment":    return <SingingClassForm onClose={closeForm} viewOnly={false} />;
      case "viewEquipment":   return <SingingClassForm onClose={closeForm} viewOnly />;

      case "addEvent":        return <EventsForm onClose={closeForm} defaultTab={defaultTabFor("addEvent")} />;
      case "viewEvent":       return <EventsForm onClose={closeForm} defaultTab={defaultTabFor("viewEvent")} />;

      

      case "addPrivate":      return <PrivateBookingForm onClose={closeForm} viewOnly={false} />;
      case "viewPrivate":     return <PrivateBookingForm onClose={closeForm} viewOnly />;

      case "addPhotography":  return <PhotographyForm onClose={closeForm} viewOnly={false} />;
      case "viewPhotography": return <PhotographyForm onClose={closeForm} viewOnly />;

      case "addVideography":  return <VideographyForm onClose={closeForm} viewOnly={false} />;
      case "viewVideography": return <VideographyForm onClose={closeForm} viewOnly />;

      case "addSound":        return <SoundSystemService defaultTab="ADD" />;
      case "viewSound":       return <SoundSystemService defaultTab="VIEW" />;

      case "addSinger":       return <SingerForm onClose={closeForm} viewOnly={false} />;
      case "viewSinger":      return <SingerForm onClose={closeForm} viewOnly />;

      case "trainer":
      case "addTrainer":
      case "viewTrainer":
        return <TrainerForm viewOnly={activeForm === "viewTrainer"} />;

      case "addUser":         return <UserForm onClose={closeForm} viewOnly={false} />;
      case "viewUser":        return <UserForm onClose={closeForm} viewOnly />;

      /* ---------- Singing Classes ---------- */
      case "classes":         return <SingingClassForm onSuccess={fetchDashboard} onClose={closeForm} />;
      case "addClass":        return <SingingClassForm onSuccess={fetchDashboard} onClose={closeForm} />;
      case "viewClass":       return <SingingClassForm onSuccess={fetchDashboard} onClose={closeForm} viewOnly />;

      default: return null;
    }
  };

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <Sidebar
        currentKey={activeForm}
        openModal={(key) => safeSetActiveForm(key)}
        openSubModal={(key) => safeSetActiveForm(key)}
      />

      <main className="pl-0 lg:pl-64 min-h-screen">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">

          {/* IF NO FORM: show dashboard */} 
          {!activeForm && (
            <>
              {/* HERO SECTION */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900">
                      Good Evening, Admin <span className="inline-block">👋</span>
                    </h1>
                    <p className="text-xl text-slate-600 mt-3 font-medium">
                      {formattedDate} • Your studio is running smoothly
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                      <FaBell className="inline mr-2" /> Notifications (3)
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* REVENUE HERO CARD */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-10 text-white shadow-2xl">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                    <div>
                      <p className="text-purple-100 text-lg font-medium">Total Revenue This Month</p>
                      <div className="text-5xl lg:text-6xl font-black mt-3">
                        ₹<CountUp end={dashboard.totalRevenue} duration={2.5} separator="," />
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-green-200">
                        <FaArrowUp className="text-green-300" />
                        <span className="text-2xl font-bold">+{dashboard.monthlyGrowth}%</span>
                        <span className="text-purple-200">vs last month</span>
                      </div>
                    </div>
                    <div className="mt-8 lg:mt-0">
                      <div className="bg-white/20 backdrop-blur rounded-2xl px-8 py-6 text-center">
                        <FaFire className="text-5xl text-orange-300 mx-auto mb-2" />
                        <p className="text-4xl font-black">{dashboard.hotStreak}</p>
                        <p className="text-lg opacity-90">Day Booking Streak</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* STATS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-500 text-lg">Active Bookings</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">{dashboard.activeBookings}</p>
                    </div>
                    <FaHeadphonesAlt className="text-6xl text-purple-500 opacity-20" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-500 text-lg">Checked In Today</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">{dashboard.todayCheckins}</p>
                    </div>
                    <FaClock className="text-6xl text-emerald-500 opacity-20" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-500 text-lg">Upcoming This Week</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">{dashboard.upcomingThisWeek}</p>
                    </div>
                    <FaCalendarCheck className="text-6xl text-indigo-500 opacity-20" />
                  </div>
                </motion.div>
              </div>

              {/* CHART + RECENT ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-xl"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Revenue Trend</h3>
                    <div className="h-96">
                      <Charts />
                    </div>
                  </motion.div>
                </div>

                <div>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-xl h-full"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h3>
                    <div className="space-y-5 max-h-96 overflow-y-auto">
                      {loading ? (
                        <p className="text-slate-500 text-center py-8">Loading...</p>
                      ) : fetchError ? (
                        <p className="text-red-500 text-center py-8 font-semibold">{fetchError}</p>
                      ) : (dashboard.recentActivities?.length ?? 0) === 0 ? (
                        <p className="text-slate-500 text-center py-8">No recent activity</p>
                      ) : (
                        (dashboard.recentActivities ?? []).slice(0, 8).map((activity, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {activity.customer?.[0] || "A"}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{activity.type || "Session"}</p>
                              <p className="text-sm text-slate-600">{activity.customer || "Unknown"}</p>
                            </div>
                            <p className="font-bold text-purple-600">
                              ₹{activity.price != null ? activity.price : 0}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          )}

          {/* IF FORM OPEN: show inline form card (no dark overlay) */}
          {activeForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              {/* header bar above form */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    {prettyTitle(activeForm)}
                  </h1>
                  <p className="text-slate-500 mt-1">
                    Manage {prettyTitle(activeForm).toLowerCase()} details here.
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shadow-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* form container */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 lg:p-10">
                {renderForm()}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
