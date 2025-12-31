import React from "react";
import { Link } from "react-router-dom";
import {
  Mic2,
  Calendar,
  Camera,
  Speaker,
  Music,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

/* ---------------- SERVICES DATA ---------------- */
const services = [
  {
    icon: Music,
    title: "Club Membership",
    description:
      "Join our exclusive music community with premium benefits and priority access.",
    features: [
      "Priority event booking",
      "Member-only discounts",
      "Exclusive masterclasses",
      "VIP lounge access",
    ],
    color: "from-violet-500 to-purple-600",
    price: "From ₹1999/month",
    link: "/singer", // SingerRegistration
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  },

  {
    icon: Mic2,
    title: "Studio Booking",
    description:
      "Professional recording studios equipped with industry-standard gear.",
    features: [
      "Sound-proof rooms",
      "High-end equipment",
      "Professional engineers",
      "Flexible time slots",
    ],
    color: "from-fuchsia-500 to-pink-600",
    price: "From ₹1500/hour",
    link: "/studio-booking",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
  },

  {
    icon: Users,
    title: "Singing Classes",
    description:
      "Learn from industry professionals with structured & flexible batches.",
    features: [
      "Expert instructors",
      "Beginner to advanced",
      "Flexible schedules",
      "Live performances",
    ],
    color: "from-blue-500 to-cyan-600",
    price: "From ₹2500/month",
    link: "/classes",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80",
  },

  {
    icon: Calendar,
    title: "Live Events & Shows",
    description:
      "Experience electrifying live performances and music festivals.",
    features: [
      "Live concerts",
      "Open mic nights",
      "DJ nights",
      "Music festivals",
    ],
    color: "from-orange-500 to-red-600",
    price: "Tickets from ₹499",
    link: "/events",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
  },

  {
    icon: Star,
    title: "Private Events",
    description:
      "Host weddings, parties, and corporate events with full music setup.",
    features: [
      "Birthday parties",
      "Corporate events",
      "Wedding shows",
      "Private concerts",
    ],
    color: "from-emerald-500 to-teal-600",
    price: "Custom pricing",
    link: "/private-booking",
    image:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
  },

  {
    icon: Camera,
    title: "Photography",
    description:
      "Professional photography services for all kinds of events.",
    features: [
      "Event photography",
      "Music videos",
      "Album artwork",
      "Behind-the-scenes",
    ],
    color: "from-pink-500 to-rose-600",
    price: "From ₹3000/session",
    link: "/photography-booking",
    image:
      "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&q=80",
  },

  {
    icon: Camera,
    title: "Videography",
    description:
      "Professional videography services for all kinds of events.",
    features: [
      "Event videography",
      "Music videos",
      "Album artwork",
      "Behind-the-scenes",
    ],
    color: "from-indigo-500 to-purple-600",
    price: "From ₹5000/session",
    link: "/videography",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
  },

  {
    icon: Speaker,
    title: "Sound System Services",
    description:
      "High-quality PA systems and live sound engineering services.",
    features: [
      "PA systems",
      "DJ setup",
      "Stage monitoring",
      "Live mixing",
    ],
    color: "from-amber-500 to-yellow-600",
    price: "From ₹4000/event",
    link: "/sound-booking",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-[#FFF6E5] pt-8">

      {/* SERVICES LIST - Starts directly */}
      <section className="py-16 px-6 max-w-7xl mx-auto space-y-24">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
              index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
            }`}
          >
            {/* Image */}
            <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
              <img
                src={service.image}
                alt={service.title}
                className="w-full rounded-3xl shadow-2xl object-cover h-96 lg:h-full hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Content */}
            <div className="space-y-8">
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-xl`}
              >
                <service.icon className="text-white w-10 h-10" />
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B2B4E] mb-4">
                  {service.title}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <ul className="space-y-4">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-4 text-slate-700">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                    <span className="text-lg">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-8 pt-6">
                <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  {service.price}
                </span>

                <Link
                  to={service.link}
                  className={`inline-flex items-center gap-4 px-8 py-4 rounded-xl font-bold text-white text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all bg-gradient-to-r ${service.color}`}
                >
                  Get Started
                  <ArrowRight size={22} />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}