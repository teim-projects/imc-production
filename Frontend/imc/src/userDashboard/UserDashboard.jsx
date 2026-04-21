import React, { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/footer.jsx";
import heroVideo from "../assets/bharat.mp4";
import EventBackground from "../assets/event banner desktop.webp";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Mic2, Users, Camera, Calendar, Star, Clock, MapPin,
  Speaker, Sparkles, ChevronLeft, ChevronRight, Music,
  Play, ArrowRight, Award, TrendingUp, Heart, Volume2,
  Instagram, Youtube, Facebook, Phone, Quote,
  Zap, Shield, Headphones, Radio, Layers, Globe,
  CheckCircle, ChevronDown,
} from "lucide-react";
import axios from "axios";

/* ─────────────────────────────────────────────────────────────
   BRAND COLORS
───────────────────────────────────────────────────────────── */
const C = {
  cream: "#FFFDE8",
  creamDark: "#FFF8D0",
  navy: "#1E3A6E",
  navyDark: "#152B52",
  navyLight: "#274D8F",
  yellow: "#FFD93D",
  yellowDark: "#F0C520",
  orange: "#FF6633",
  orangeLight: "#FF8255",
  white: "#FFFFFF",
};

/* ─────────────────────────────────────────────────────────────
   API SETUP
───────────────────────────────────────────────────────────── */
const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const EVENTS_URL = `${BASE}/user/events/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ─────────────────────────────────────────────────────────────
   MOUSE GLOW
───────────────────────────────────────────────────────────── */
const MouseGlow = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const m = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", m);
    return () => window.removeEventListener("mousemove", m);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[999]"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <div
        className="w-72 h-72 rounded-full opacity-[0.07]"
        style={{
          background: `radial-gradient(circle, ${C.orange} 0%, ${C.yellow} 40%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FLOATING PARTICLES
───────────────────────────────────────────────────────────── */
const FloatingParticles = ({ count = 22, dark = false }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 14 + 8,
    delay: Math.random() * 6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: dark ? `${C.yellow}35` : `${C.orange}20`,
          }}
          animate={{ y: [-22, 22, -22], x: [-12, 12, -12], opacity: [0.15, 0.65, 0.15] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   NOISE OVERLAY
───────────────────────────────────────────────────────────── */
const NoiseOverlay = () => (
  <div
    className="absolute inset-0 opacity-[0.035] pointer-events-none z-[1]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "200px",
    }}
  />
);

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────── */
const AnimatedCounter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let s = 0;
    const step = Math.ceil(target / 80);
    const t = setInterval(() => {
      s += step;
      if (s >= target) { setCount(target); clearInterval(t); }
      else setCount(s);
    }, 25);
    return () => clearInterval(t);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────────────────────────────────────────
   MARQUEE STRIP
───────────────────────────────────────────────────────────── */
const MarqueeStrip = () => {
  const items = [
    "🎵 Studio Recording", "🎤 Live Performances", "🎸 Music Classes",
    "📸 Photography",      "🎬 Videography",       "🔊 Sound Systems",
    "⭐ Award Winning",    "🎹 Piano Lessons",      "🎧 Mixing & Mastering",
    "🥁 Drum Sessions",    "🎺 Brass Instruments",  "🎻 String Ensemble",
  ];

  return (
    <div
      className="relative overflow-hidden py-4"
      style={{
        background: `linear-gradient(90deg, ${C.orange} 0%, ${C.yellowDark} 35%, ${C.yellow} 65%, ${C.orange} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.00) 55%)",
        }}
      />
      <motion.div
        className="flex gap-10 whitespace-nowrap relative z-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-black text-sm tracking-widest uppercase flex items-center gap-3"
            style={{ color: C.navyDark }}
          >
            {item}
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: `${C.navyDark}55` }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   GLOW CARD
───────────────────────────────────────────────────────────── */
const GlowCard = ({ children, className = "", glowColor = C.orange, style = {} }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor}18 0%, transparent 70%)`,
            left: pos.x - 160,
            top: pos.y - 160,
            zIndex: 0,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SECTION BADGE
───────────────────────────────────────────────────────────── */
const SectionBadge = ({ icon: Icon, label, dark = false }) => (
  <div
    className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border"
    style={
      dark
        ? { background: `${C.yellow}18`, borderColor: `${C.yellow}40`, color: C.yellow }
        : { background: `${C.navy}10`, borderColor: `${C.navy}25`, color: C.navy }
    }
  >
    {Icon && <Icon size={14} />}
    <span className="font-bold text-xs tracking-widest uppercase">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   DIVIDER WAVE
───────────────────────────────────────────────────────────── */
const WaveDivider = ({ fromColor, toColor, flip = false }) => (
  <div
    className={`relative w-full overflow-hidden leading-none ${flip ? "rotate-180" : ""}`}
    style={{ height: 60 }}
  >
    <svg
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className="w-full h-full"
      style={{ fill: toColor }}
    >
      <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function UserDashboard() {

  /* ── Services ── */
  const services = [
    {
      title: "Club Membership",
      desc: "Join our exclusive music community with special perks and privileges",
      link: "/singer",
      icon: Sparkles,
      accent: C.orange,
      badge: "Popular",
      category: "Community",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90",
    },
    {
      title: "Studio Booking",
      desc: "Professional recording studio sessions with top gear",
      link: "/studio-booking",
      icon: Mic2,
      accent: C.navy,
      badge: null,
      category: "Recording",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=90",
    },
    {
      title: "Singing Classes",
      desc: "Learn from certified vocal coaches globally trained",
      link: "/singing-classes",
      icon: Users,
      accent: C.yellowDark,
      badge: "New",
      category: "Education",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=90",
    },
    {
      title: "Live Shows & Karaoke",
      desc: "Electrifying live entertainment every night",
      link: "/events-booking",
      icon: Calendar,
      accent: C.orange,
      badge: null,
      category: "Events",
      image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=90",
    },
    {
      title: "Private Events",
      desc: "Bespoke celebrations & premium performances",
      link: "/private-booking",
      icon: Star,
      accent: C.yellowDark,
      badge: null,
      category: "Private",
      image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=90",
    },
    {
      title: "Photography",
      desc: "Stunning event & portrait photography shoots",
      link: "/photography-booking",
      icon: Camera,
      accent: C.navy,
      badge: null,
      category: "Media",
      image: "https://images.unsplash.com/photo-1554941069-84b7f6cc8428?w=800&q=90",
    },
    {
      title: "Videography",
      desc: "Cinematic quality video production & editing",
      link: "/videography",
      icon: Camera,
      accent: C.orange,
      badge: null,
      category: "Media",
      image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=90",
    },
    {
      title: "Sound System",
      desc: "Premium audio equipment rental & professional setup",
      link: "/sound-booking",
      icon: Speaker,
      accent: C.navy,
      badge: null,
      category: "Audio",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=90",
    },
  ];

  /* ── Stats ── */
  const stats = [
    { icon: Users,    label: "Artists Served",  value: 5000,  suffix: "+", color: C.orange },
    { icon: Music,    label: "Studio Sessions",  value: 12000, suffix: "+", color: C.yellow },
    { icon: Calendar, label: "Live Events",      value: 350,   suffix: "+", color: C.orange },
    { icon: Award,    label: "Awards Won",       value: 28,    suffix: "",  color: C.yellow },
  ];

  /* ── Features ── */
  const features = [
    { icon: Mic2,   title: "Dolby-Certified Studios",  desc: "State-of-the-art acoustics with industry-standard gear.",           glow: C.orange },
    { icon: Users,  title: "Expert Instructors",        desc: "Coaches trained at Berklee, FTII & leading Indian institutions.",   glow: C.navy   },
    { icon: Award,  title: "28+ Industry Awards",       desc: "Recognized excellence across live events, education & production.", glow: C.yellow },
    { icon: Heart,  title: "Artist-First Culture",      desc: "A community where every artist is nurtured and elevated.",          glow: C.orange },
    { icon: Zap,    title: "Fast Turnaround",           desc: "Quick session bookings, rapid delivery of recordings and media.",   glow: C.yellow },
    { icon: Shield, title: "100% Satisfaction",         desc: "We guarantee quality — reshoot or re-record at no extra charge.",   glow: C.navy   },
  ];

  /* ── Testimonials ── */
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Professional Singer",
      text: "IMC transformed my career. The studio quality is world-class and the instructors are phenomenal. Best investment I've ever made!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      stars: 5,
      badge: "Club Member",
    },
    {
      name: "Rohan Mehta",
      role: "Music Producer",
      text: "The sound system they set up for my wedding was absolutely incredible. Every guest was blown away. Truly professional team!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      stars: 5,
      badge: "Sound Client",
    },
    {
      name: "Ananya Kapoor",
      role: "Bollywood Playback Artist",
      text: "I've recorded in studios across Mumbai and Pune — IMC Music Hub stands out for its equipment, acoustics, and welcoming atmosphere.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      stars: 5,
      badge: "Studio Artist",
    },
    {
      name: "Vikram Desai",
      role: "Event Organizer",
      text: "We've partnered with IMC for 12+ events — zero failures, flawless execution. They're our go-to music & AV partner in Pune.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
      stars: 5,
      badge: "Event Partner",
    },
  ];

  /* ── Gallery ── */
  const gallery = [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=90",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=90",
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=90",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=90",
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=90",
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=90",
  ];

  /* ── Brands ── */
  const brands = ["Sony Music", "Zee Music", "T-Series", "Saregama", "YRF", "Dharma Prod.", "Tips Music"];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  /* ── Events ── */
  const carouselRef  = useRef(null);
  const [isPaused,      setIsPaused]      = useState(false);
  const [events,        setEvents]        = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError,   setEventsError]   = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await api.get(EVENTS_URL);
      const now = new Date();
      const arr = res.data.results || res.data;
      const upcoming = arr?.filter((e) => new Date(e.event_date) > now).slice(0, 12);
      setEvents(upcoming || []);
    } catch {
      setEventsError("Could not load upcoming events.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || events.length === 0 || isPaused) return;
    let animFrame;
    let pos = carousel.scrollLeft;
    const max = carousel.scrollWidth - carousel.clientWidth;
    const scroll = () => {
      if (pos >= max - 1) return;
      pos += 0.6;
      carousel.scrollLeft = pos;
      animFrame = requestAnimationFrame(scroll);
    };
    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [events, isPaused]);

  const scrollLeft  = () => carouselRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  const scrollRight = () => carouselRef.current?.scrollBy({ left:  360, behavior: "smooth" });

  useEffect(() => {
    const t = setInterval(
      () => setActiveTestimonial((p) => (p + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(t);
  }, [testimonials.length]);

  const { scrollY } = useScroll();
  const heroY       = useTransform(scrollY, [0, 600], [0, 180]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  /* ═══════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: C.cream }}>
      <MouseGlow />

      {/* ══════════════════════════════════════ HERO ══ */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 scale-110">
          <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
            <source src={heroVideo} type="video/mp4" />
          </video>
        </motion.div>

        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${C.navyDark}E8, ${C.navy}70, ${C.navyDark}F5)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${C.orange}20, transparent, ${C.yellow}15)` }}
        />
        <NoiseOverlay />

        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${C.yellow}60 1px, transparent 1px),
                              linear-gradient(90deg, ${C.yellow}60 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 60%, ${C.orange}18 0%, transparent 70%)`,
          }}
        />

        <FloatingParticles count={28} dark />

        <div className="relative z-10 text-center px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, type: "spring", bounce: 0.4 }}
            className="inline-flex items-center gap-2.5 backdrop-blur-md px-6 py-2.5 rounded-full mb-10 border"
            style={{ background: `${C.yellow}18`, borderColor: `${C.yellow}50`, color: C.yellow }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: C.yellow }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: C.yellow }} />
            </span>
            <span className="font-bold text-xs tracking-[0.2em] uppercase">Pune's #1 Music Hub — Now Open</span>
            <Sparkles size={12} />
          </motion.div>

          <div className="overflow-hidden mb-4">
            <motion.h1
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.88] tracking-tighter text-white"
            >
              Where Music
            </motion.h1>
          </div>

          <div className="overflow-hidden mb-8">
            <motion.h1
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.88] tracking-tighter relative inline-block"
            >
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.orange} 0%, ${C.yellow} 50%, ${C.orange} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Comes Alive
              </span>
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 1.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-3 left-0 right-0 h-[3px] rounded-full origin-left"
                style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.yellow}, transparent)` }}
              />
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 1 }}
            className="text-[clamp(0.9rem,2vw,1.15rem)] max-w-2xl mx-auto leading-relaxed font-light mb-12"
            style={{ color: "#E8D9B0" }}
          >
            World-class studio recording · Professional singing classes ·
            <br className="hidden md:block" />
            Spectacular live events · Premium audio-visual services
          </motion.p>

          {/* ── HERO BUTTONS (no underline, smaller size) ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            {/* Get Started Free */}
            <Link
              to="/singer/register"
              className="no-underline group relative inline-flex items-center gap-2.5 px-8 py-3 rounded-full font-bold text-base overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                color: C.white,
                boxShadow: `0 0 40px ${C.orange}55`,
                textDecoration: "none",
              }}
            >
              <motion.span
                className="absolute inset-0 rounded-full"
                animate={{ opacity: [0, 0.15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ background: "linear-gradient(135deg, white, transparent)" }}
              />
              <Play size={16} className="fill-white text-white" />
              <span>Get Started Free</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Explore Events */}
            <Link
              to="/events-booking"
              className="no-underline group inline-flex items-center gap-2.5 px-8 py-3 rounded-full font-bold text-base backdrop-blur-sm transition-all duration-300 hover:scale-105 border"
              style={{
                borderColor: `${C.yellow}50`,
                color: C.yellow,
                textDecoration: "none",
              }}
            >
              <Calendar size={16} />
              Explore Events
              <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: `${C.yellow}80` }}>
              Scroll to explore
            </span>
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown size={22} style={{ color: `${C.yellow}80` }} />
            </motion.div>
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-10"
          style={{ background: `linear-gradient(to top, ${C.navy}, transparent)` }}
        />
      </section>

      {/* MARQUEE */}
      <div className="relative z-20"><MarqueeStrip /></div>

      {/* ══════════════════════════════════════ STATS BAR ══ */}
      <section className="relative z-10" style={{ background: C.navy }}>
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, label, value, suffix, color }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="relative group text-center"
            >
              <div
                className="relative z-10 p-6 rounded-2xl border transition-all duration-400"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto border"
                  style={{ background: `${color}18`, borderColor: `${color}30` }}
                >
                  <Icon size={26} style={{ color }} />
                </div>
                <div
                  className="text-[2.8rem] font-black mb-1 leading-none"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${C.white})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <p className="font-semibold text-xs uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <WaveDivider fromColor={C.navy} toColor={C.cream} />
      </section>

      {/* ══════════════════════════════════════ SERVICES ══ */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: C.cream }}>
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.orange}, transparent)` }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.yellow}, transparent)` }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <SectionBadge icon={Volume2} label="What We Offer" />
            <h2
              className="text-[clamp(2.5rem,6vw,5rem)] font-black mb-5 leading-tight"
              style={{ color: C.navy }}
            >
              Our{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Services
              </span>
            </h2>
            <p className="text-xl max-w-2xl mx-auto font-light" style={{ color: `${C.navy}80` }}>
              From recording studios to live events — everything you need for your musical journey
            </p>
          </motion.div>

          {/* ── SERVICE CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, i) => {
              const Icon = service.icon;
              const isWide = i === 0 || i === 4;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative ${isWide ? "lg:col-span-2" : ""}`}
                >
                  <Link
                    to={service.link}
                    className="no-underline block h-full"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className={`relative overflow-hidden rounded-3xl border transition-all duration-500
                                  group-hover:-translate-y-3
                                  group-hover:shadow-[0_30px_60px_rgba(30,58,110,0.20)]
                                  ${isWide ? "h-[340px]" : "h-[320px]"}`}
                      style={{
                        borderColor: `${C.navy}15`,
                        boxShadow: "0 4px 20px rgba(30,58,110,0.10)",
                      }}
                    >
                      <img
                        src={service.image}
                        alt={service.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform
                                   duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.72) 100%)",
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(to top, ${service.accent}55 0%, transparent 60%)`,
                        }}
                      />
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                        <div
                          className="text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase backdrop-blur-md border"
                          style={{
                            background: "rgba(255,255,255,0.18)",
                            borderColor: "rgba(255,255,255,0.30)",
                            color: "#fff",
                          }}
                        >
                          {service.category}
                        </div>
                        {service.badge && (
                          <div
                            className="text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                              color: C.navyDark,
                            }}
                          >
                            ✦ {service.badge}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                        <div
                          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-3 border backdrop-blur-md"
                          style={{
                            background: `${service.accent}35`,
                            borderColor: `${service.accent}60`,
                          }}
                        >
                          <Icon size={22} color="#fff" />
                        </div>
                        <h3 className="font-black text-xl leading-tight text-white mb-1.5 drop-shadow-lg">
                          {service.title}
                        </h3>
                        <p className="text-[13px] leading-snug font-light text-white/75 line-clamp-2 mb-3">
                          {service.desc}
                        </p>
                        <div
                          className="flex items-center gap-1.5 text-xs font-bold
                                     opacity-0 group-hover:opacity-100
                                     translate-y-2 group-hover:translate-y-0
                                     transition-all duration-300"
                          style={{ color: C.yellow }}
                        >
                          Book Now <ArrowRight size={13} />
                        </div>
                      </div>
                      <div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
                                   transition-opacity duration-500 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 0 2px ${service.accent}60` }}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ BRAND PARTNERS ══ */}
      <section
        className="py-12 relative overflow-hidden border-y"
        style={{ background: C.creamDark, borderColor: `${C.navy}15` }}
      >
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: `${C.navy}50` }}>
            Trusted by leading music brands
          </p>
        </div>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-16 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, ease: "linear", repeat: Infinity }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="font-black text-xl tracking-widest uppercase cursor-default transition-colors duration-200"
                style={{ color: `${C.navy}30` }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.orange)}
                onMouseLeave={(e) => (e.currentTarget.style.color = `${C.navy}30`)}
              >
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ WHY CHOOSE IMC ══ */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: C.navy }}>
        <FloatingParticles count={20} dark />
        <NoiseOverlay />
        <WaveDivider fromColor={C.cream} toColor={C.navy} flip />

        <div className="max-w-7xl mx-auto relative z-10 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <SectionBadge icon={TrendingUp} label="Why Choose IMC" dark />
            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black text-white mb-5 leading-tight">
              The Premier{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Music Hub
              </span>{" "}
              in Pune
            </h2>
            <p className="text-xl max-w-2xl mx-auto font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
              State-of-the-art infrastructure. Seasoned professionals. Unforgettable experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {features.map(({ icon: Icon, title, desc, glow }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
              >
                <GlowCard
                  glowColor={glow}
                  className="group h-full p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 cursor-default"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border"
                    style={{ background: `${glow}20`, borderColor: `${glow}30` }}
                  >
                    <Icon size={24} style={{ color: glow }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="leading-relaxed font-light" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                  <div
                    className="mt-6 h-px rounded-full w-0 group-hover:w-full transition-all duration-700"
                    style={{ background: `linear-gradient(90deg, ${glow}, transparent)` }}
                  />
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p className="text-lg leading-relaxed mb-10 font-light" style={{ color: "rgba(255,255,255,0.55)" }}>
                IMC Music Hub is where raw talent transforms into polished artistry. With
                state-of-the-art infrastructure and a team of seasoned professionals, we deliver
                experiences that exceed every expectation.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  "₹0 joining fee for first month",
                  "Flexible booking — 24/7",
                  "Industry-grade equipment",
                  "Expert post-production team",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <CheckCircle size={16} style={{ color: C.yellow }} className="flex-shrink-0" />
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{item}</span>
                  </div>
                ))}
              </div>
              {/* Discover Our Story — no underline, smaller */}
              <Link
                to="/about"
                className="no-underline inline-flex items-center gap-2.5 px-7 py-3 rounded-full font-bold text-sm text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                  boxShadow: `0 0 30px ${C.orange}40`,
                  textDecoration: "none",
                }}
              >
                Discover Our Story <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="relative h-[560px] hidden lg:block"
            >
              {[
                {
                  src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=90",
                  cls: "absolute top-0 left-4 w-56 h-72 rounded-3xl rotate-2",
                },
                {
                  src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=90",
                  cls: "absolute top-16 right-0 w-60 h-80 rounded-3xl -rotate-3",
                },
                {
                  src: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=90",
                  cls: "absolute bottom-0 left-10 w-72 h-56 rounded-3xl rotate-1",
                },
              ].map(({ src, cls }, i) => (
                <motion.div
                  key={i}
                  className={`${cls} overflow-hidden border`}
                  style={{
                    borderColor: `${C.yellow}25`,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  }}
                  whileHover={{ rotate: 0, scale: 1.04 }}
                  transition={{ duration: 0.4 }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.navy}60, transparent)` }} />
                </motion.div>
              ))}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40
                           rounded-full blur-3xl opacity-25 pointer-events-none"
                style={{ background: C.yellow }}
              />
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 right-4 rounded-2xl px-5 py-4 shadow-2xl z-20 border"
                style={{
                  background: `${C.navy}F0`,
                  backdropFilter: "blur(16px)",
                  borderColor: `${C.yellow}30`,
                }}
              >
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>This Month</p>
                <p className="font-black text-xl text-white">127 Sessions</p>
                <p className="text-xs font-semibold mt-1" style={{ color: C.yellow }}>↑ +18% vs last month</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <WaveDivider fromColor={C.navy} toColor={C.cream} />
      </section>

      {/* ══════════════════════════════ UPCOMING EVENTS ══ */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.cream }}>
        <div className="absolute inset-0 z-0">
          <img src={EventBackground} alt="" className="w-full h-full object-cover opacity-20" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${C.cream}F5, ${C.cream}CC, ${C.cream}F8)` }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6"
          >
            <div>
              <SectionBadge icon={Radio} label="Live Events" />
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-tight" style={{ color: C.navy }}>
                Upcoming
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Events
                </span>
              </h2>
            </div>
            {/* View All Events — no underline */}
            <Link
              to="/events-booking"
              className="no-underline self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all group border"
              style={{ borderColor: `${C.navy}30`, color: C.navy, textDecoration: "none" }}
            >
              View All Events{" "}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loadingEvents ? (
            <div className="flex gap-5 overflow-hidden pb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[300px] h-[430px] rounded-3xl animate-pulse flex-shrink-0"
                  style={{ background: `${C.navy}10` }}
                />
              ))}
            </div>
          ) : eventsError ? (
            <div className="text-center py-20 text-xl font-semibold" style={{ color: C.orange }}>
              {eventsError}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Music size={64} className="mx-auto mb-4" style={{ color: `${C.navy}30` }} />
              <p className="text-xl" style={{ color: `${C.navy}50` }}>No upcoming events right now. Check back soon!</p>
            </div>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full
                           text-white flex items-center justify-center transition-all shadow-xl border -translate-x-5"
                style={{ background: C.navy, borderColor: `${C.yellow}30` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.orange)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
              >
                <ChevronLeft size={22} />
              </button>

              <div
                ref={carouselRef}
                className="flex overflow-x-auto gap-5 pb-8 snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06, duration: 0.6 }}
                    className="min-w-[300px] sm:min-w-[340px] flex-shrink-0 snap-center group"
                  >
                    <div
                      className="relative h-[440px] rounded-3xl overflow-hidden flex flex-col
                                 transition-all duration-500 group-hover:-translate-y-3 border"
                      style={{
                        background: C.white,
                        borderColor: `${C.navy}12`,
                        boxShadow: "0 4px 24px rgba(30,58,110,0.08)",
                      }}
                    >
                      <div className="h-[190px] relative overflow-hidden flex-shrink-0">
                        <img
                          src={event.image || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=700&q=90"}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
                        />
                        <div
                          className="absolute top-3 left-3 inline-flex items-center gap-1.5
                                     text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                            color: C.white,
                          }}
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          UPCOMING
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <h3
                          className="text-lg font-bold mb-5 line-clamp-2 transition-colors leading-snug"
                          style={{ color: C.navy }}
                        >
                          {event.name || "Musical Event"}
                        </h3>
                        <div className="space-y-2.5 text-sm flex-grow" style={{ color: `${C.navy}70` }}>
                          {[
                            { icon: Calendar, val: event.event_date },
                            { icon: Clock,    val: event.event_time || "TBA" },
                            { icon: MapPin,   val: event.location   || "Pune" },
                          ].map(({ icon: Icon, val }, j) => (
                            <div
                              key={j}
                              className="flex items-center gap-3 rounded-xl px-3 py-2 border"
                              style={{ background: `${C.navy}06`, borderColor: `${C.navy}10` }}
                            >
                              <Icon size={13} style={{ color: C.orange }} className="flex-shrink-0" />
                              <span className="truncate">{val}</span>
                            </div>
                          ))}
                        </div>

                        <div
                          className="flex items-center justify-between mt-5 pt-4 border-t"
                          style={{ borderColor: `${C.navy}10` }}
                        >
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: `${C.navy}50` }}>Starting from</p>
                            <span className="text-2xl font-black" style={{ color: C.navy }}>
                              ₹{event.ticket_price || "0"}
                            </span>
                          </div>
                          {/* Book button — no underline */}
                          <Link
                            to={`/events/${event.id}`}
                            className="no-underline inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                                       font-semibold text-sm text-white transition-all hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                              boxShadow: `0 0 20px ${C.orange}30`,
                              textDecoration: "none",
                            }}
                          >
                            Book <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full
                           text-white flex items-center justify-center transition-all shadow-xl border translate-x-5"
                style={{ background: C.navy, borderColor: `${C.yellow}30` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.orange)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════ GALLERY STRIP ══ */}
      <section className="py-20 overflow-hidden" style={{ background: C.creamDark }}>
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
          <SectionBadge icon={Camera} label="Gallery" />
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-black" style={{ color: C.navy }}>
            Behind the{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Scenes
            </span>
          </h2>
        </div>

        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, ease: "linear", repeat: Infinity }}
        >
          {[...gallery, ...gallery].map((src, i) => (
            <div
              key={i}
              className="relative min-w-[260px] h-[200px] rounded-2xl overflow-hidden flex-shrink-0 group border"
              style={{ borderColor: `${C.navy}10` }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(to top, ${C.navy}70, transparent)` }}
              />
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════ TESTIMONIALS ══ */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: C.navy }}>
        <FloatingParticles count={15} dark />
        <NoiseOverlay />
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 text-[18rem] font-black
                     pointer-events-none select-none leading-none"
          style={{ color: `${C.yellow}05` }}
        >
          "
        </div>
        <WaveDivider fromColor={C.creamDark} toColor={C.navy} flip />

        <div className="max-w-5xl mx-auto relative z-10 text-center pt-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <SectionBadge icon={Quote} label="Testimonials" dark />
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black text-white">
              What Artists{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Say
              </span>
            </h2>
          </motion.div>

          <div className="relative h-[320px] mb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-3xl p-10 flex flex-col items-center
                           justify-center border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  borderColor: `${C.yellow}20`,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex gap-1.5 mb-6">
                  {Array.from({ length: testimonials[activeTestimonial].stars }).map((_, i) => (
                    <Star key={i} size={18} style={{ color: C.yellow }} className="fill-current" />
                  ))}
                </div>
                <p className="text-xl leading-relaxed font-light mb-8 italic max-w-2xl" style={{ color: "rgba(255,255,255,0.85)" }}>
                  "{testimonials[activeTestimonial].text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={testimonials[activeTestimonial].avatar}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border-2 shadow-lg"
                      style={{ borderColor: `${C.orange}70` }}
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full p-1" style={{ background: C.orange }}>
                      <CheckCircle size={10} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm" style={{ color: C.yellow }}>{testimonials[activeTestimonial].role}</p>
                  </div>
                  <div
                    className="ml-4 text-xs font-bold px-3 py-1 rounded-full border"
                    style={{ background: `${C.orange}20`, borderColor: `${C.orange}40`, color: C.orange }}
                  >
                    {testimonials[activeTestimonial].badge}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-3">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}>
                <div
                  className="h-2 rounded-full transition-all duration-400"
                  style={{
                    width: i === activeTestimonial ? 40 : 8,
                    background:
                      i === activeTestimonial
                        ? `linear-gradient(90deg, ${C.orange}, ${C.yellow})`
                        : "rgba(255,255,255,0.2)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
        <WaveDivider fromColor={C.navy} toColor={C.cream} />
      </section>


      {/* ══════════════════════════════ FINAL CTA ══ */}
      <section className="py-36 px-6 relative overflow-hidden" style={{ background: C.navy }}>
        <FloatingParticles count={35} dark />
        <NoiseOverlay />
        <WaveDivider fromColor={C.cream} toColor={C.navy} flip />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]
                     rounded-full border pointer-events-none"
          style={{ borderColor: `${C.yellow}10` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px]
                     rounded-full border pointer-events-none"
          style={{ borderColor: `${C.yellow}06` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                     rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${C.orange} 0%, ${C.yellow} 40%, transparent 70%)`,
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10 text-center pt-8">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full mb-10 border"
              style={{ background: `${C.yellow}15`, borderColor: `${C.yellow}30`, color: C.yellow }}
            >
              <Sparkles size={14} />
              <span className="font-bold text-xs tracking-[0.2em] uppercase">Your Musical Journey Starts Here</span>
            </div>

            <h2 className="text-[clamp(3rem,9vw,7rem)] font-black mb-8 leading-[0.9] tracking-tight text-white">
              Ready to Make
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Music Magic?
              </span>
            </h2>

            <p className="text-xl md:text-2xl mb-14 max-w-3xl mx-auto font-light leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              Join{" "}
              <span className="font-bold" style={{ color: C.yellow }}>5,000+ artists</span>{" "}
              who've found their musical home at IMC —
              <br className="hidden md:block" />
              Pune's most trusted music hub.
            </p>

            {/* ── FINAL CTA BUTTONS (no underline, smaller) ── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {/* Get Started Now */}
              <Link
                to="/singer/register"
                className="no-underline group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full
                           font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                  color: C.white,
                  boxShadow: `0 0 60px ${C.orange}45`,
                  textDecoration: "none",
                }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ background: "linear-gradient(135deg, white, transparent)" }}
                />
                <Play size={19} className="fill-white text-white" />
                Get Started Now
                <ArrowRight size={17} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>

              {/* Contact Us */}
              <Link
                to="/contact"
                className="no-underline group inline-flex items-center gap-2.5 px-10 py-4 rounded-full font-bold
                           text-lg border transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: `${C.yellow}30`,
                  color: C.yellow,
                  textDecoration: "none",
                }}
              >
                <Phone size={18} />
                Contact Us
              </Link>
            </div>

            <div
              className="flex items-center justify-center gap-5 pt-8 border-t"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Follow us</p>
              {[
                { icon: Instagram, href: "#", hoverColor: "#E1306C" },
                { icon: Youtube,   href: "#", hoverColor: "#FF0000" },
                { icon: Facebook,  href: "#", hoverColor: "#1877F2" },
              ].map(({ icon: Icon, href, hoverColor }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  whileHover={{ scale: 1.15 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center border
                             transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background  = `${hoverColor}22`;
                    e.currentTarget.style.borderColor = `${hoverColor}50`;
                    e.currentTarget.style.color       = hoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background  = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                    e.currentTarget.style.color       = "rgba(255,255,255,0.4)";
                  }}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
