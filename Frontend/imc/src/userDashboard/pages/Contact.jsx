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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const GOOGLE_MAPS_KEY = "AIzaSyDHENL1zGd1L54VvhO0c6q6p8FJkBdg3AU";

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementsByName(firstErrorField)[0]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    toast.success("Message Sent Successfully 🎵");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setErrors({});
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
        {/* Error Summary Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">
                  Please fill in all required fields correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Name + Email Row */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Full Name *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Email *
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Phone (Optional)
          </label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={`w-full h-12 px-4 rounded-xl border ${
              errors.phone ? "border-red-500" : "border-gray-300"
            } focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-gray-50`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">
            Your Message *
          </label>
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.message ? "border-red-500" : "border-gray-300"
            } focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition resize-none bg-gray-50`}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">{errors.message}</p>
          )}
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