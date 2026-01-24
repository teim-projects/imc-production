import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/footer.jsx";
import heroVideo from "../assets/bharat.mp4";
import EventBackground from "../assets/event banner desktop.png";
import { motion } from "framer-motion";
import {
  Mic2,
  Users,
  Camera,
  Calendar,
  Star,
  Clock,
  MapPin,
  Speaker,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UserDashboard() {
  const
  
  services = [
    {
      title: "Club Membership",
      
    
      link: "/singer",
      img: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&q=80",
      icon: Sparkles,
      gradient: "from-pink-600 via-purple-600 to-indigo-600",
      accent: "#FF69B4",
    },
    {
      title: "Studio Booking",
    
      link: "/studio-booking",
      img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
      icon: Mic2,
      gradient: "from-cyan-600 via-blue-600 to-indigo-600",
      accent: "#00CED1",
    },
    {
      title: "Singing Classes",
     
      link: "/singing-classes",
      img: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80",
      icon: Users,
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      accent: "#00FF7F",
    },
    {
      title: "Live Shows & Karaoke",
  
      link: "/events",
      img: "https://images.unsplash.com/photo-1507679799987-c737218594e0?w=800&q=80",
      icon: Calendar,
      gradient: "from-rose-600 via-pink-600 to-purple-600",
      accent: "#FF1493",
    },
    {
      title: "Private Events",

      link: "/private-booking",
      img: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
      icon: Star,
      gradient: "from-amber-600 via-orange-600 to-rose-600",
      accent: "#FFA500",
    },
    {
      title: "Photography",

      link: "/photography-booking",
      img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      icon: Camera,
      gradient: "from-yellow-600 via-amber-600 to-orange-600",
      accent: "#FFD700",
    },
    {
      title: "Videography",
      
      link: "/videography",
      img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      icon: Camera,
      gradient: "from-orange-600 via-rose-600 to-pink-600",
      accent: "#FF4500",
    },
    {
      title: "Sound System",
     
      link: "/sound-booking",
      img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
      icon: Speaker,
      gradient: "from-purple-600 via-indigo-600 to-blue-600",
      accent: "#8A2BE2",
    },
  ];

  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let animationFrame;
    let scrollAmount = 0;

    const scroll = () => {
      scrollAmount += 0.5;
      if (carousel) {
        carousel.scrollLeft = scrollAmount;
        if (scrollAmount >= carousel.scrollWidth / 2) {
          scrollAmount = 0;
          carousel.scrollLeft = 0;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const upcomingEvents = [
    {
      tag: "WORKSHOP",
      title: "Vocal Workshop with Experts",
      date: "Mar 08, 2025",
      time: "10:00 AM",
      venue: "IMC Training Room",
      price: "₹1499",
      accent: "from-amber-600 to-orange-500",
      bg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    },
    {
      tag: "CONCERT",
      title: "Classical Music Evening",
      date: "Mar 01, 2025",
      time: "6:30 PM",
      venue: "IMC Grand Hall",
      price: "₹799",
      accent: "from-purple-700 to-indigo-600",
      bg: "https://images.unsplash.com/photo-1507679799987-c737218594e0?auto=format&fit=crop&q=80&w=800",
    },
    {
      tag: "KARAOKE",
      title: "Karaoke Night Special",
      date: "Feb 22, 2025",
      time: "8:00 PM",
      venue: "IMC Lounge",
      price: "₹299",
      accent: "from-rose-600 to-pink-500",
      bg: "https://images.unsplash.com/photo-1511671782779-c97d3d27c1d4?auto=format&fit=crop&q=80&w=800",
    },
    {
      tag: "LIVE",
      title: "Bollywood Live Night",
      date: "Apr 12, 2025",
      time: "7:00 PM",
      venue: "IMC Main Stage",
      price: "₹999",
      accent: "from-red-600 to-rose-500",
      bg: "https://images.unsplash.com/photo-1540039151398-5b0d0c3e3e1d?auto=format&fit=crop&q=80&w=800",
    },
    {
      tag: "FEST",
      title: "Sufi & Folk Fest",
      date: "May 18, 2025",
      time: "5:00 PM",
      venue: "IMC Open Arena",
      price: "₹599",
      accent: "from-teal-600 to-cyan-500",
      bg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    },
    {
      tag: "OPEN MIC",
      title: "Open Mic Night",
      date: "Jun 10, 2025",
      time: "9:00 PM",
      venue: "IMC Lounge",
      price: "Free",
      accent: "from-green-600 to-emerald-500",
      bg: "https://images.unsplash.com/photo-1511671782779-c97d3d27c1d4?auto=format&fit=crop&q=80&w=800",
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* ================= HERO ================= */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-7xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-orange-400 font-bold text-2xl mb-8 tracking-widest"
          >
            WELCOME TO IMC MUSIC HUB
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1.2 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black mb-12 leading-tight text-white"
          >
            Where Music<br />
            <span className="text-orange-500">Comes Alive</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-xl md:text-3xl mb-20 text-gray-200 max-w-5xl mx-auto leading-relaxed font-medium"
          >
            Experience world-class studio recording, professional singing classes, spectacular live events, and premium audio-visual services — all under one roof.
          </motion.p>
        </motion.div>
      </section>

      {/* ================= OUR SERVICES – IMPROVED ANIMATION ================= */}
      <section className="py-24 px-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-cream-50 relative overflow-hidden">
        {/* Subtle golden light overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-amber-300/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-amber-600 font-bold text-xl mb-4 tracking-widest uppercase">
              WHAT WE OFFER
            </p>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-amber-800">
              Our Services
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              From recording studios to live events, we provide everything you need for your musical journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                whileHover={{
                  scale: 1.12,
                  y: -15,
                  rotateX: 8,
                  boxShadow: "0 25px 60px rgba(180, 83, 9, 0.3)",
                  transition: { duration: 0.5, ease: "easeOut" }
                }}
                className="group relative rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-amber-200/60 shadow-xl transition-all duration-500"
              >
                <Link to={service.link} className="block h-full">
                  {/* Image */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={service.img}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                    <h3 className="text-3xl font-bold mb-2 drop-shadow-lg group-hover:text-amber-300 transition-colors duration-400">
                      {service.title}
                    </h3>
                    <div className="w-20 h-1 bg-amber-400 rounded-full mb-4 group-hover:w-32 transition-all duration-500" />
                    <p className="text-base leading-relaxed drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                      {service.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= UPCOMING EVENTS ================= */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={EventBackground}
            alt="Events section background"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-orange-400 font-bold text-xl uppercase tracking-widest mb-2">
              DON'T MISS OUT
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Join unforgettable musical experiences at IMC
            </p>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scroll-smooth scrollbar-hide"
            >
              {upcomingEvents.concat(upcomingEvents).map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i % upcomingEvents.length) * 0.1, duration: 0.7 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="min-w-[280px] max-w-[280px] h-[420px] flex-shrink-0 snap-center group relative rounded-xl overflow-hidden shadow-xl border border-white/10 bg-black/55 backdrop-blur-lg flex flex-col"
                >
                  <div className="h-[140px] relative overflow-hidden flex-shrink-0">
                    <img
                      src={event.bg}
                      alt={event.title}
                      className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.6] transition-all duration-700 scale-105 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

                    <div className="absolute top-2 left-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-white text-[10px] font-bold bg-gradient-to-r ${event.accent} shadow-sm`}
                      >
                        {event.tag}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-base font-semibold text-white mb-3 line-clamp-2 leading-tight group-hover:text-orange-300 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-xs text-gray-200 mb-4 flex-grow">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-orange-300 flex-shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-orange-300 flex-shrink-0" />
                        <span className="truncate">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-orange-300 flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                      <span className="text-xl font-bold text-white">
                        {event.price}
                      </span>

                      <Link
                        to="/events-booking"
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-medium rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1"
                        style={{ textDecoration: "none" }}
                      >
                        Book
                        <span className="hidden sm:inline">→</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-32 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <span className="text-orange-600 font-bold text-xl tracking-widest uppercase">
                Your Musical Journey Starts Here
              </span>
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-gray-900">
              Ready to Make<br />
              <span className="text-orange-600">Music Magic?</span>
            </h2>

            <p className="text-2xl md:text-3xl text-gray-700 mb-16 max-w-4xl mx-auto font-medium">
              Join thousands of artists who have found their musical<br />
              <span className="text-gray-800 font-bold">home at IMC</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/singer/register"
                className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-colors duration-200 shadow-md"
                style={{ textDecoration: "none" }}
              >
                Get Started Now
              </Link>

              <Link
                to="/contact"
                className="px-8 py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors duration-200 shadow-md"
                style={{ textDecoration: "none" }}
              >
                Contact Us
              </Link>
            </div>

            <p className="text-lg text-gray-600 font-medium flex items-center justify-center gap-3">
              <span className="text-2xl rotate-12">🎤</span>
              Trusted by <span className="text-orange-600 font-black">5,000+</span> singers, performers & music lovers
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}