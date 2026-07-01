// src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Charts from "./Charts";

/* Forms */
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
import PaymentForm from "./Forms/PaymentForm";
import StudioCalendarManager from "./Forms/StudioCalendarManager";  // <-- NEW IMPORT

import { motion } from "framer-motion";
import {
  FaUsers,
  FaMicrophone,
  FaCalendarAlt,
  FaCalendarCheck,
  FaHeadphonesAlt,
  FaRupeeSign,
  FaClock,
  FaFire,
  FaArrowUp,
  FaBell,
  FaMusic,
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaWallet,
  FaCheckCircle,
  FaExclamationCircle,
  FaLayerGroup
} from "react-icons/fa";
import CountUp from "react-countup";

import "./Dashboard.css";

/* ---------------- Allowed keys (keep in sync with Sidebar) ---------------- */
const ALLOWED_KEYS = new Set([
  null,
  "studioCalendar",       // <-- NEW
  "studio", "studioMaster", "equipment", "events", "photography", "videography", "sound",
  "singer", "payment", "private",
  "classes", "addClass", "viewClass",
  "addStudio", "viewStudio",
  "addEquipment", "viewEquipment",
  "addEvent", "viewEvent",
  "addPrivate", "viewPrivate",
  "addPhotography", "viewPhotography",
  "addVideography", "viewVideography",
  "addSound", "viewSound",
  "addSinger", "viewSinger",
  "addTrainer", "viewTrainer",
  "addUser", "viewUser",
  "addStudioMaster", "viewStudioMaster",
]);

/* pretty title helper */
const prettyTitle = (k) => {
  if (!k) return "Overview";
  const map = {
    studioCalendar: "Studio Calendar",   // <-- NEW
    studio: "Studio", studioMaster: "Studio Master", equipment: "Equipment",
    events: "Events", photography: "Photography", videography: "Videography",
    sound: "Sound", singer: "Singer", payment: "Payment", user: "Users", private: "Private Bookings",
    addStudio: "Add Studio Booking", viewStudio: "View Studio Bookings",
    addEquipment: " Singing Class", viewEquipment: "View Singing Classes",
    addEvent: "Live & Karaoke", viewEvent: "View Events",
    addPrivate: "Add Private Music Events", viewPrivate: "View Private Bookings",
    addPhotography: "Add Photography Service", viewPhotography: "View Photography Bookings",
    addVideography: "Videography Service", viewVideography: "View Videography Bookings",
    addSound: "Add Sound System Service", viewSound: "View Sound Jobs",
    addSinger: "Add Singer", viewSinger: "View Singers",
    addTrainer: "Add Trainer",
    viewTrainer: "View Trainers",
    addUser: "Add User", viewUser: "View Users",
    addStudioMaster: "Add Studio (Master)", viewStudioMaster: "View Studios (Master)",
    classes: "Singing Classes",
    addClass: "Add Singing Class",
    viewClass: "View Singing Classes",
  };
  return map[k] ?? "Overview";
};

const defaultTabFor = (key) => (key && key.startsWith("view") ? "VIEW" : "ADD");

export default function Dashboard() {
  const [activeForm, setActiveForm] = useState(null);
  const [chartTab, setChartTab] = useState("revenue"); 

  // Combined State Configurations
  const [dashboard, setDashboard] = useState({
    customers: 0,
    bookings: 0,
    events: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    paidStudents: 0,
    pendingStudents: 0,
    singersCount: 0,
    trainersCount: 0,
    soundCount: 0,
    singingClassesCount: 0,
    chartData: [],
    recentActivities: [],
    monthlyGrowth: 42,
    activeBookings: 0,
    todayCheckins: 0,
    upcomingThisWeek: 18,
    hotStreak: 7,
  });

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";
  const DASHBOARD_URL = `${BASE.replace(/\/$/, "")}/auth/dashboard/`;

  const safeSetActiveForm = useCallback((key) => {
    setActiveForm(ALLOWED_KEYS.has(key) ? key : null);
  }, []);

  const closeForm = useCallback(() => setActiveForm(null), []);

  useEffect(() => {
    const base = "IMC Music Hub";
    document.title = activeForm ? `${prettyTitle(activeForm)} — ${base}` : `${base} — Dashboard`;
  }, [activeForm]);

  const fetchDashboard = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(DASHBOARD_URL, { headers });
      const res = response.data;

      setDashboard((prev) => ({
        ...prev,
        customers: res?.customers ?? 0,
        bookings: res?.bookings ?? 0,
        events: res?.events ?? 0,
        totalRevenue: res?.totalRevenue ?? res?.revenue ?? 0,
        
        paidRevenue: res?.paid_revenue ?? 0,
        pendingRevenue: res?.pending_revenue ?? 0,

        paidStudents: res?.paid_students ?? 0,
        pendingStudents: res?.pending_students ?? 0,

        singersCount: res?.singers_count ?? 0,
        trainersCount: res?.trainers_count ?? 0,
        soundCount: res?.sound_count ?? 0,
        singingClassesCount: res?.singing_classes_count ?? 0,
        
        chartData: res?.chart_data || [],
        recentActivities: res?.recent_bookings || [],

        monthlyGrowth: res?.monthly_growth ?? prev.monthlyGrowth,
        activeBookings: res?.bookings ?? 0,
        todayCheckins: res?.checked_in ?? 0,
        upcomingThisWeek: res?.upcoming_this_week ?? 0,
        hotStreak: res?.hot_streak ?? 0,
      }));
    } catch (err) {
      console.error("Dashboard error:", err);
      setFetchError(err?.response?.data?.detail || err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const intr = setInterval(fetchDashboard, 1000 * 60 * 2);
    return () => clearInterval(intr);
  }, []);

  const renderForm = () => {
    switch (activeForm) {
      case "studioCalendar":   return <StudioCalendarManager />;  // <-- NEW CASE
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
      case "addStudioMaster": return <StudioMasterForm defaultTab="ADD" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 text-slate-800 font-sans">
      <Sidebar
        currentKey={activeForm}
        openModal={(key) => safeSetActiveForm(key)}
        openSubModal={(key) => safeSetActiveForm(key)}
      />

      <main className="pl-0 lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">

          {/* DASHBOARD CORE METRICS PORTAL */}
          {!activeForm && (
            <>
              {/* TOP BANNER */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm backdrop-blur-md"
              >
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 bg-clip-text text-transparent">
                    Music Hub Management Center <span className="inline-block animate-pulse">⚡</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
                    {formattedDate} • Real-time System Performance
                  </p>
                </div>
                <button className="relative group overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-200">
                  <span className="relative z-10 flex items-center gap-2">
                    <FaBell className="animate-bounce" /> Notifications (3)
                  </span>
                </button>
              </motion.div>

              {/* STATS HERO GRID - SYMMETRIC & COMPACT EDITION */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* COMPACT REVENUE INTERACTION CARD */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800 rounded-2xl p-5 shadow-lg border border-purple-400/20 flex flex-col justify-between min-h-[160px]"
                >
                  <div className="absolute -top-2 -right-2 p-6 opacity-10 pointer-events-none">
                    <FaRupeeSign className="text-7xl text-white" />
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-purple-100 text-xs tracking-wider font-semibold uppercase">Gross Platform Revenue</p>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1.5">
                      ₹<CountUp end={dashboard.totalRevenue} duration={2} separator="," />
                    </h2>
                  </div>

                  <div className="relative z-10 flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/20 text-emerald-200 border border-emerald-400/10 text-xs">
                      <FaArrowUp className="text-[10px]" />
                      <span className="font-bold">+{dashboard.monthlyGrowth}%</span>
                      <span className="text-purple-200/80 ml-1 font-normal">MoM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/90 text-xs bg-black/10 px-2.5 py-1 rounded-lg">
                      <FaFire className="text-orange-400 text-sm animate-pulse" />
                      <span className="font-bold">{dashboard.hotStreak} Days Streak</span>
                    </div>
                  </div>
                </motion.div>

                {/* TOTAL ACTIVE CUSTOMERS CARD */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm min-h-[160px]">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Active Customers</p>
                      <h4 className="text-3xl font-black mt-2 text-slate-900"><CountUp end={dashboard.customers} duration={1.5} /></h4>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                      • Active users on platform
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-xl self-start"><FaUsers className="text-2xl" /></div>
                </div>

                {/* LIVE & KARAOKE EVENTS CARD */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm min-h-[160px]">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Live & Karaoke Events</p>
                      <h4 className="text-3xl font-black mt-2 text-slate-900"><CountUp end={dashboard.events} duration={1.5} /></h4>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
                      • Hosted scheduled slots
                    </span>
                  </div>
                  <div className="p-4 bg-pink-50 text-pink-600 rounded-xl self-start"><FaMicrophone className="text-2xl" /></div>
                </div>
              </div>

              {/* ---------------- OPERATIONS SPECIAL BOARDS ---------------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. SEPARATE STUDIO BOOKINGS CARD BLOCK */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-slate-700 shadow-md relative overflow-hidden"
                >
                  <div className="absolute right-4 top-4 text-slate-700/40 pointer-events-none">
                    <FaLayerGroup className="text-7xl" />
                  </div>
                  <div className="flex items-center gap-3 border-b border-slate-700/60 pb-3">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                      <FaHeadphonesAlt className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-wide">Studio Bookings Terminal</h3>
                      <p className="text-slate-400 text-xs">Total slots and revenue tracker</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-slate-400 text-xs font-semibold">Active Bookings</p>
                      <p className="text-3xl font-black mt-1 text-indigo-300">
                        <CountUp end={dashboard.activeBookings} />
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-slate-400 text-xs font-semibold">Total Bookings Count</p>
                      <p className="text-3xl font-black mt-1 text-white">
                        <CountUp end={dashboard.bookings} />
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex-1 text-center">
                      <span className="text-slate-500 block">Paid Studio Rev</span>
                      <strong className="text-emerald-400 font-bold">₹<CountUp end={dashboard.paidRevenue} /></strong>
                    </div>
                    <div className="w-[1px] bg-slate-800" />
                    <div className="flex-1 text-center">
                      <span className="text-slate-500 block">Pending Studio Rev</span>
                      <strong className="text-rose-400 font-bold">₹<CountUp end={dashboard.pendingRevenue} /></strong>
                    </div>
                  </div>
                </motion.div>

                {/* 2. SEPARATE SINGER CLASSES CARD BLOCK */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-3xl p-6 text-white border border-indigo-900/60 shadow-md relative overflow-hidden"
                >
                  <div className="absolute right-4 top-4 text-indigo-900/30 pointer-events-none">
                    <FaMusic className="text-7xl" />
                  </div>
                  <div className="flex items-center gap-3 border-b border-indigo-900/60 pb-3">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                      <FaMusic className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-wide">Singing Classes Matrix</h3>
                      <p className="text-indigo-200/60 text-xs">Student enrollment and batch tracker</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-indigo-200/60 text-xs font-semibold">Active Classes</p>
                      <p className="text-3xl font-black mt-1 text-amber-300">
                        <CountUp end={dashboard.singingClassesCount} />
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-indigo-200/60 text-xs font-semibold">Total Singers</p>
                      <p className="text-3xl font-black mt-1 text-white">
                        <CountUp end={dashboard.singersCount} />
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 text-xs bg-indigo-950/60 p-3 rounded-xl border border-indigo-900/40">
                    <div className="flex-1 text-center">
                      <span className="text-indigo-300/60 block">Paid Students</span>
                      <strong className="text-emerald-400 font-bold"><CountUp end={dashboard.paidStudents} /> Active</strong>
                    </div>
                    <div className="w-[1px] bg-indigo-900/40" />
                    <div className="flex-1 text-center">
                      <span className="text-indigo-300/60 block">Pending Students</span>
                      <strong className="text-amber-400 font-bold"><CountUp end={dashboard.pendingStudents} /> Awaiting</strong>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* OTHER REVENUE METRICS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FaUsers /> Total Trainers
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 mt-1">
                      <CountUp end={dashboard.trainersCount} />
                    </h2>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FaUsers className="text-lg" /></div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FaHeadphonesAlt /> Sound Services
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 mt-1">
                      <CountUp end={dashboard.soundCount} />
                    </h2>
                  </div>
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-xl"><FaHeadphonesAlt className="text-lg" /></div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FaClock /> Upcoming This Week
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 mt-1">
                      <CountUp end={dashboard.upcomingThisWeek} />
                    </h2>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FaClock className="text-lg" /></div>
                </div>
              </div>

              {/* CHART ANALYSIS SYSTEM & ACTIVITY LOGS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CHARTS GRAPH COMPONENT */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Advanced Hub Analysis</h3>
                      <p className="text-xs text-slate-500">Granular parameters trend across workflows</p>
                    </div>
                    
                    {/* CHART TABS CONFIGURATION */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[
                        { id: "revenue", label: "Line Graph", icon: FaChartLine },
                        { id: "distribution", label: "Bar Chart", icon: FaChartBar },
                        { id: "load", label: "Pie Matrix", icon: FaChartPie }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setChartTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            chartTab === tab.id 
                              ? "bg-white text-purple-700 shadow-sm border border-slate-200/50" 
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <tab.icon />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DISPLAY MOUNT PORTAL */}
                  <div className="h-96 relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <Charts type={chartTab} data={dashboard} />
                  </div>
                </div>

                {/* OPERATION HISTORY TIMELINE FEED */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col h-[510px]">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Live Stream Operations</h3>
                    <p className="text-xs text-slate-500">Latest active structural parameters updates</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold">Updating Feed...</p>
                      </div>
                    ) : fetchError ? (
                      <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center text-xs font-medium">
                        {fetchError}
                      </div>
                    ) : !dashboard.recentActivities?.length ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-8">
                        <FaWallet className="text-4xl opacity-20 mb-2" />
                        <p className="text-sm">No operational data detected</p>
                      </div>
                    ) : (
                      dashboard.recentActivities.slice(0, 10).map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-slate-200 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black rounded-xl flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                              {activity.customer?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">{activity.type || "Studio Use"}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{activity.customer || "Walking Client"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-purple-600">
                              ₹{activity.price != null ? activity.price : 0}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Approved</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ACTIVE PORTAL SUBMODULE INTERFACE WINDOW */}
          {activeForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{prettyTitle(activeForm)} Management Portal</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Processing verification matrix inputs</p>
                </div>
                <button 
                  onClick={closeForm}
                  className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-sm"
                >
                  Close Window
                </button>
              </div>
              <div className="p-4 sm:p-6 md:p-8 lg:p-10 text-slate-800 bg-white">
                {renderForm()}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}