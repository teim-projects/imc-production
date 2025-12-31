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
} from "lucide-react";
import { motion } from "framer-motion";

const services = [
  {
    icon: Music,
    title: "Club Membership",
    description:
      "Exclusive access to all events, priority booking, and special member discounts.",
    color: "from-violet-500 to-purple-600",
    route: "/user-dashboard",
  },
  {
    icon: Mic2,
    title: "Studio Booking",
    description:
      "Professional recording studios with state-of-the-art equipment.",
    color: "from-fuchsia-500 to-pink-600",
    route: "/studio-booking",
  },
  {
    icon: Users,
    title: "Singing Classes",
    description:
      "Learn from industry professionals with personalized coaching.",
    color: "from-blue-500 to-cyan-600",
    route: "/singing-classes",
  },
  {
    icon: Calendar,
    title: "Live Events",
    description:
      "Experience electrifying live performances and karaoke nights.",
    color: "from-orange-500 to-red-600",
    route: "/events-booking",
  },
  {
    icon: Camera,
    title: "Media Services",
    description:
      "Professional photography and videography for your special moments.",
    color: "from-emerald-500 to-teal-600",
    route: "/photography-booking",
  },
  {
    icon: Speaker,
    title: "Sound Systems",
    description: "Complete sound solutions for events of any scale.",
    color: "from-amber-500 to-yellow-600",
    route: "/sound-booking",
  },
];

export default function ServicesPreview() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-violet-600 font-semibold text-sm tracking-wider uppercase mb-4">
            What We Offer
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Our Premium Services
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            From recording to performing, we provide everything you need to bring
            your musical vision to life.
          </p>
        </motion.div>

        {/* SERVICES GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={service.route}>
                <div className="group relative bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 h-full border border-slate-100 hover:border-violet-200 overflow-hidden">
                  {/* Hover Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  {/* ICON */}
                  <div
                    className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <service.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* CONTENT */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-violet-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center text-violet-600 font-medium text-sm">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* VIEW ALL */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/services">
            <button className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              View All Services
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
