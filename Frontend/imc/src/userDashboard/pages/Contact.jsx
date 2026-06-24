import React, { useState } from "react";
import Footer from "../../components/footer";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Music,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ---------------- DATA ---------------- */

const contactInfo = [
  {
    icon: Phone,
    title: "Call Us",
    value: "+91 8767055580 / 9834944461",
    description: "Mon–Sat 9AM–9PM",
  },
  {
    icon: Mail,
    title: "Email",
    value: "IMCPCMC@gmail.com",
    description: "Reply in 24h",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Indian Musical Club",
    description: "Address - Indian Musical club S-19, Ground floor, Greens Center, Opposite Pudumjee Paper Mill, Aditya Birla Hospital Road, Thergaon, Chinchwad 411033",
  },
  {
    icon: Clock,
    title: "We're Open",
    value: "9AM – 10PM",
    description: "7 Days a Week",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const GOOGLE_MAPS_KEY = "AIzaSyDHENL1zGd1L54VvhO0c6q6p8FJkBdg3AU";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Name, Email & Message are required!");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    toast.success("Message Sent Successfully 🎵");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/70 to-white">
      {/* HERO */}
      <section className="relative pt-16 pb-24 bg-gradient-to-br from-black via-orange-950 to-amber-950">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-600/30 rounded-full mb-6">
            <Music className="w-4 h-4 text-orange-300" />
            <span className="text-xs font-bold text-orange-200 uppercase tracking-wider">
              Harmony Awaits
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Let’s <span className="text-orange-400">Connect</span>
          </h1>

          <p className="text-lg text-orange-100 max-w-2xl mx-auto">
            Questions about classes, sessions or events? Just drop us a message 🎤
          </p>
        </div>
      </section>

      {/* INFO CARDS - smaller */}
      <section className="-mt-20 relative z-10 px-5">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl p-5 shadow-lg border border-orange-100 hover:border-orange-300 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-3">
                <info.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{info.title}</h3>
              <p className="text-orange-700 font-medium text-sm mt-0.5">{info.value}</p>
              <p className="text-gray-600 text-xs mt-1">{info.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

{/* CONTACT SECTION */}
<section className="py-14 px-5 lg:py-20 bg-gradient-to-b from-orange-50 to-white">
  <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">

    {/* CONTACT FORM CARD */}
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden"
    >
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="text-lg font-semibold tracking-wide">
              Get in Touch
            </h3>
            <p className="text-xs opacity-90">
              We usually respond within 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* FORM BODY */}
      <form
        onSubmit={handleSubmit}
        className="p-7 space-y-6"
      >
        {/* Name + Email Row */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Full Name *
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Phone (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50"
          />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Your Message *
          </label>
          <textarea
            rows={4}
            required
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition resize-none bg-gray-50"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 text-center">
          <div className="flex justify-center">
  <button
    type="submit"
    disabled={loading}
    className={`w-[220px] h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
      loading
        ? "bg-orange-400 cursor-not-allowed"
        : "bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-[1.02] hover:shadow-orange-400/40"
    }`}
  >
    <Send className="w-4 h-4" />
    {loading ? "Sending..." : "Send Message"}
  </button>
</div>

        </div>
      </form>
    </motion.div>

    {/* GOOGLE MAP CARD */}
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl overflow-hidden shadow-2xl h-[460px] lg:h-[520px] border border-orange-100"
    >
      <iframe
        title="Indian Musical Club - Thergaon, Pune"
        src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=S-19%2C+Ground+floor%2C+Greens+Center%2C+Opposite+Pudumjee+Paper+Mill%2C+Aditya+Birla+Hospital+Road%2C+Thergaon%2C+Chinchwad%2C+Pune+411033&zoom=18`}
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </motion.div>
  </div>
</section>


      <Footer />
    </div>
  );
}