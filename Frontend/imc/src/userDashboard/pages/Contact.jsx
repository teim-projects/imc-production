import React, { useState } from "react";
import Footer from "../../components/footer";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ---------------- DATA ---------------- */

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    value: "+91 8767055580 / 9834944461",
    description: "Mon–Sat, 9am–9pm",
  },
  {
    icon: Mail,
    title: "Email",
    value: "IMCPCMC@gmail.com",
    description: "We reply within 24 hours",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Indian Musical Hub",
    description:
      "S-19, Ground floor, Greens Center, Opposite Pudumjee Paper Mill, Aditya Birla Hospital Road, Thergaon, Chinchwad 411033",
  },
  {
    icon: Clock,
    title: "Hours",
    value: "9:00 AM – 10:00 PM",
    description: "Open 7 days a week",
  },
];

const subjects = [
  "General Inquiry",
  "Studio Booking",
  "Event Tickets",
  "Singing Classes",
  "Private Events",
  "Partnership",
  "Other",
];

/* ---------------- COMPONENT ---------------- */

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    // Simulate sending (replace with real API later)
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message sent successfully! We'll get back to you soon.");

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">

      {/* ================= HERO ================= */}
      <section className="relative py-28 md:py-32 bg-gradient-to-br from-orange-950 via-amber-950 to-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-6 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm font-semibold uppercase tracking-widest mb-6">
              Get In Touch
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto opacity-90">
              Have questions about music classes, studio booking, events or anything else? We're here to help!
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= INFO CARDS ================= */}
      <section className="-mt-20 md:-mt-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {contactInfo.map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-orange-100/50 hover:shadow-orange-500/20 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-5 shadow-lg">
                <info.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{info.title}</h3>
              <p className="text-orange-700 font-medium text-lg">{info.value}</p>
              <p className="text-sm text-gray-600 mt-2">{info.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CONTACT FORM ================= */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100">
          <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 p-8 md:p-10 flex items-center gap-4">
            <MessageSquare className="w-10 h-10 text-white opacity-90" />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Send us a Message</h2>
              <p className="text-orange-100 mt-1 text-lg">We usually reply within 24 hours</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-5 py-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-5 py-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 8767055580"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-5 py-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-orange-200 rounded-xl px-5 py-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
              <textarea
                required
                rows={5}
                placeholder="How can we help you today?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border border-orange-200 rounded-xl px-5 py-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition resize-none"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-5 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg hover:shadow-orange-500/40"
              }`}
            >
              <Send size={20} />
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}