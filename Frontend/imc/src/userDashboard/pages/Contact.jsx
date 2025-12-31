import React, { useState } from "react";
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
  { icon: Phone, title: "Phone", value: "+1 (555) 123-4567", description: "Mon–Sat, 9am–9pm" },
  { icon: Mail, title: "Email", value: "hello@imcmusic.com", description: "We reply within 24 hours" },
  { icon: MapPin, title: "Location", value: "123 Music Street, NY 10001", description: "Visit our center" },
  { icon: Clock, title: "Hours", value: "9:00 AM – 10:00 PM", description: "Open 7 days a week" },
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
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent successfully! (Demo)");

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
    <div className="min-h-screen bg-[#FFF6E5]">

      {/* ---------- HERO ---------- */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 to-violet-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920')] bg-cover bg-center opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-violet-400 font-semibold uppercase tracking-wider">
              Get In Touch
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white mt-4">
              Contact Us
            </h1>
            <p className="text-slate-300 mt-4 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ---------- INFO CARDS ---------- */}
      <section className="-mt-16 relative z-10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
                <info.icon className="text-white" />
              </div>
              <h3 className="font-semibold">{info.title}</h3>
              <p className="text-violet-600 font-medium">{info.value}</p>
              <p className="text-sm text-slate-500">{info.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- FORM ---------- */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 flex items-center gap-3">
            <MessageSquare className="text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Send us a Message</h2>
              <p className="text-violet-100">We reply within 24 hours</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <input
                placeholder="Your Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border rounded-xl px-4 py-3"
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border rounded-xl px-4 py-3"
              />
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="border rounded-xl px-4 py-3"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <textarea
              rows="4"
              placeholder="Your Message *"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="border rounded-xl px-4 py-3 w-full"
            />

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
