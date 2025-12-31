import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/footer.jsx";
import heroVideo from "../assets/bharat.mp4";
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
} from "lucide-react";

export default function UserDashboard() {
  const services = [
    {
      title: "Club Membership",
      desc: "Join our exclusive music community with special perks and privileges",
      link: "/singer/register",
      img: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&q=80",
      icon: Sparkles,
    },
    {
      title: "Studio Booking",
      desc: "Professional recording studios with state-of-the-art equipment",
      link: "/studio-booking",
      img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
      icon: Mic2,
    },
    {
      title: "Singing Classes",
      desc: "Learn from industry professionals and discover your voice",
      link: "/singing-classes",
      img: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80",
      icon: Users,
    },
    {
      title: "Live Shows & Karaoke",
      desc: "Experience electrifying performances and showcase your talent",
      link: "/events",
      img: "https://images.unsplash.com/photo-1507679799987-c737218594e0?w=800&q=80",
      icon: Calendar,
    },
    {
      title: "Private Events",
      desc: "Custom events for birthdays, weddings, and corporate functions",
      link: "/private-booking",
      img: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
      icon: Star,
    },
    {
      title: "Photography",
      desc: "Capture your special moments with professional photography",
      link: "/photography-booking",
      img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      icon: Camera,
    },
    {
      title: "Videography",
      desc: "Cinematic video production for all your creative needs",
      link: "/videography",
      img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      icon: Camera,
    },
    {
      title: "Sound System",
      desc: "Premium audio equipment rental for any event",
      link: "/sound-booking",
      img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
      icon: Speaker,
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

      {/* ================= OUR SERVICES ================= */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-orange-500 font-bold text-xl mb-4 tracking-widest">
              WHAT WE OFFER
            </p>
            <h2 className="text-6xl md:text-7xl font-black mb-8 text-gray-800">
              Our Services
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
              From recording studios to live events, we provide everything you need for your musical journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Link to={service.link}>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl h-96 group-hover:shadow-3xl transition-all duration-700">
                    <img
                      src={service.img}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />

                    <div className="absolute top-8 right-8">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-xl">
                        <service.icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                      <h3 className="text-3xl font-black mb-4">{service.title}</h3>
                      <p className="text-gray-300 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= UPCOMING EVENTS ================= */}
      <section className="py-32 bg-gradient-to-b from-[#FFF8E1] to-[#FFEDD5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-orange-600 font-bold text-xl mb-4 tracking-widest">
              DON'T MISS OUT
            </p>
            <h2 className="text-6xl md:text-7xl font-black mb-8 text-gray-800">
              Upcoming Events
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                tag: "WORKSHOP",
                title: "Vocal Workshop with Experts",
                date: "Mar 08, 2025",
                time: "10:00 AM",
                venue: "IMC Training Room",
                price: "₹1499",
              },
              {
                tag: "CONCERT",
                title: "Classical Music Evening",
                date: "Mar 01, 2025",
                time: "6:30 PM",
                venue: "IMC Grand Hall",
                price: "₹799",
              },
              {
                tag: "KARAOKE",
                title: "Karaoke Night Special",
                date: "Feb 22, 2025",
                time: "8:00 PM",
                venue: "IMC Lounge",
                price: "₹299",
              },
            ].map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -15 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-orange-100"
              >
                <div className="h-6 bg-gradient-to-r from-orange-400 to-orange-600" />

                <div className="p-10">
                  <span className="inline-block bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-lg mb-8">
                    {event.tag}
                  </span>

                  <h3 className="text-3xl font-black text-gray-800 mb-6">{event.title}</h3>
                  <p className="text-gray-600 mb-3 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    {event.date}
                  </p>
                  <p className="text-gray-600 mb-3 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-orange-500" />
                    {event.time}
                  </p>
                  <p className="text-gray-600 mb-10 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-orange-500" />
                    {event.venue}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-4xl font-black text-orange-600">{event.price}</p>

                    <Link
                      to="/events-booking"
                      className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL ATTRACTIVE CTA - MATCHING YOUR DESIGN ================= */}
      <section className="py-32 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            {/* Sparkle accent line */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <span className="text-orange-600 font-bold text-xl tracking-widest uppercase">
                Your Musical Journey Starts Here
              </span>
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>

            {/* Main heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-gray-900">
              Ready to Make<br />
              <span className="text-orange-600">Music Magic?</span>
            </h2>

            {/* Description */}
            <p className="text-2xl md:text-3xl text-gray-700 mb-16 max-w-4xl mx-auto font-medium">
              Join thousands of artists who have found their musical<br />
              <span className="text-gray-800 font-bold">home at IMC</span>
            </p>

            {/* Buttons - Clean pill design, NO underlines at all */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-16">
              {/* Primary Button - Only text + arrow, no underline */}
              <Link
                to="/singer/register"
                className="relative p-3 bg-orange-500 rounded-full shadow-2xl flex flex-col items-center"
              >
                <span className="text-white font-bold text-2xl">
                  Get Started Now
                </span>
               
              </Link>

              {/* Secondary Button */}
              <Link
                to="/contact"
                className="p-3 bg-white border-4 border-orange-500 rounded-full shadow-2xl"
              >
                <span className="text-blue-600 font-bold text-2xl underline decoration-blue-600/70">
                  Contact US
                </span>
              </Link>
            </div>

            {/* Trust indicator */}
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