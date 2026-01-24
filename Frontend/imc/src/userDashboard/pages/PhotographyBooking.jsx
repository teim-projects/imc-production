// PhotographyBooking.jsx
// Updated — Added colored buttons for Preferred Payment Methods

import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg";
import {
  Loader2, CheckCircle, Calendar, Clock, MapPin, Users,
  Phone, Mail, User, Camera, ChevronDown, Sparkles,
  Star, Award, DollarSign, Drone,
} from "lucide-react";

// ────────────────────────────────────────────────
// API Configuration
// ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const PHOTOGRAPHY_API = `${API_BASE.replace(/\/$/, "")}/auth/photography-bookings/`;

const SHOOT_TYPES = [
  "Wedding Photography",
  "Pre-Wedding Shoot",
  "Maternity Shoot",
  "Newborn/Baby Shoot",
  "Family Portrait",
  "Fashion/Portfolio",
  "Product Photography",
  "Corporate Headshots",
  "Event Coverage",
  "Birthday Party",
  "Engagement",
  "Other",
];

const PACKAGE_TYPES = ["Basic", "Standard", "Premium", "Luxury", "Custom"];

const DURATION_OPTIONS = [
  { value: 2,  label: "2 Hours" },
  { value: 4,  label: "4 Hours" },
  { value: 6,  label: "Half Day (6 Hours)" },
  { value: 8,  label: "Full Day (8-10 Hours)" },
  { value: 24, label: "Multi-Day / Overnight" },
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Google Pay", "PhonePe"];

export default function PhotographyBooking() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    client: "",
    email: "",
    contact_number: "",
    event_type: "",
    event_type_other: "",
    package_type: "",
    package_price: "",
    addon_name: "",
    addon_price: "",
    date: "",
    start_time: "",
    duration_hours: "",
    location: "",
    photographers_count: "1",
    drone_needed: false,
    payment_methods_list: [],
    agreed_terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const togglePayment = (method) => {
    setForm((prev) => {
      if (prev.payment_methods_list.includes(method)) {
        return {
          ...prev,
          payment_methods_list: prev.payment_methods_list.filter((m) => m !== method),
        };
      }
      return { ...prev, payment_methods_list: [...prev.payment_methods_list, method] };
    });
  };

  const validateForm = () => {
    if (!form.client.trim())              return "Client name is required";
    if (!form.contact_number.trim())      return "Contact number is required";
    if (!form.email.trim())               return "Email is required";
    if (!form.event_type)                 return "Please select event / shoot type";
    if (form.event_type === "Other" && !form.event_type_other.trim()) {
      return "Please specify the other event type";
    }
    if (!form.date)                       return "Shoot date is required";
    if (!form.location.trim())            return "Location is required";
    if (!form.duration_hours)             return "Duration is required";
    if (Number(form.photographers_count) < 1) {
      return "At least 1 photographer is required";
    }
    if (!form.agreed_terms)               return "You must agree to the terms & conditions";
    return null;
  };

  const submitBooking = async () => {
    setErrorMsg("");
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      client:               form.client.trim(),
      email:                form.email.trim(),
      contact_number:       form.contact_number.trim(),
      event_type:           form.event_type,
      event_type_other:     form.event_type === "Other" ? form.event_type_other.trim() : "",
      package_type:         form.package_type || "",
      package_price:        form.package_price ? Number(form.package_price) : null,
      addon_name:           form.addon_name || "",
      addon_price:          form.addon_price  ? Number(form.addon_price)  : null,
      date:                 form.date,
      start_time:           form.start_time || null,
      duration_hours:       Number(form.duration_hours),
      location:             form.location.trim(),
      photographers_count:  Number(form.photographers_count),
      drone_needed:         Boolean(form.drone_needed),
      payment_methods_list: form.payment_methods_list,
    };

    try {
      const response = await axios.post(PHOTOGRAPHY_API, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Booking submission failed:", err);
      const serverError = err.response?.data;
      let msg = "Failed to submit booking. Please try again.";

      if (serverError) {
        if (typeof serverError === "object") {
          const firstError = Object.values(serverError)[0];
          msg = Array.isArray(firstError) ? firstError[0] : firstError || msg;
        } else if (typeof serverError === "string") {
          msg = serverError;
        }
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setErrorMsg("");
    setForm({
      client: "",
      email: "",
      contact_number: "",
      event_type: "",
      event_type_other: "",
      package_type: "",
      package_price: "",
      addon_name: "",
      addon_price: "",
      date: "",
      start_time: "",
      duration_hours: "",
      location: "",
      photographers_count: "1",
      drone_needed: false,
      payment_methods_list: [],
      agreed_terms: false,
    });
  };

  // ────────────────────────────────────────────────
  // SUCCESS VIEW
  // ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full border border-white/50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Booking Request Sent!
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Thank you, {form.client}! We have received your photography booking request.<br />
            We'll contact you soon with confirmation and details.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Book Another Shoot
          </button>
        </motion.div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // MAIN FORM
  // ────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-96 md:h-[28rem] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-75"
          style={{ backgroundImage: `url(${SingerBackground})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Photography Booking
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-amber-400 mt-2 drop-shadow">
              IMC Visual Arts
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 mt-4 max-w-2xl"
          >
            Capture your special moments with professional photography
          </motion.p>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FORM COLUMN */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 -mt-20 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <Camera className="w-12 h-12 text-amber-600" />
                  Book Your Photoshoot
                </h2>

                {errorMsg && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <User className="inline w-5 h-5 mr-2" />
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="client"
                      value={form.client}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Phone className="inline w-5 h-5 mr-2" />
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={form.contact_number}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Mail className="inline w-5 h-5 mr-2" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <MapPin className="inline w-5 h-5 mr-2" />
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. New Delhi, Pune, Mumbai..."
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Shoot Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Event / Shoot Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="event_type"
                        value={form.event_type}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 appearance-none transition"
                      >
                        <option value="">Select Type</option>
                        {SHOOT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>

                    {form.event_type === "Other" && (
                      <input
                        type="text"
                        name="event_type_other"
                        value={form.event_type_other}
                        onChange={handleChange}
                        placeholder="Please specify your event..."
                        className="mt-3 w-full h-10 px-4 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:border-amber-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Calendar className="inline w-5 h-5 mr-2" />
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Clock className="inline w-5 h-5 mr-2" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Clock className="inline w-5 h-5 mr-2" />
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="duration_hours"
                        value={form.duration_hours}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 appearance-none transition"
                      >
                        <option value="">Select Duration</option>
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Users className="inline w-5 h-5 mr-2" />
                      Number of Photographers <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="photographers_count"
                      value={form.photographers_count}
                      onChange={handleChange}
                      min="1"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-8">
                    <input
                      type="checkbox"
                      id="drone_needed"
                      name="drone_needed"
                      checked={form.drone_needed}
                      onChange={handleChange}
                      className="w-5 h-5 text-amber-600 rounded"
                    />
                    <label htmlFor="drone_needed" className="text-gray-700 font-medium flex items-center gap-2">
                      <Drone className="w-5 h-5" /> I need drone photography
                    </label>
                  </div>
                </div>

                {/* Package & Add-ons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">Package Type</label>
                    <div className="relative">
                      <select
                        name="package_type"
                        value={form.package_type}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 appearance-none transition"
                      >
                        <option value="">Select Package (optional)</option>
                        {PACKAGE_TYPES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <DollarSign className="inline w-5 h-5 mr-2" />
                      Package Price (₹) – approximate
                    </label>
                    <input
                      type="number"
                      name="package_price"
                      value={form.package_price}
                      onChange={handleChange}
                      placeholder="e.g. 25000"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">Add-on / Extra Service</label>
                    <input
                      type="text"
                      name="addon_name"
                      value={form.addon_name}
                      onChange={handleChange}
                      placeholder="e.g. Extra hour, Photo album, Reels editing"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <DollarSign className="inline w-5 h-5 mr-2" />
                      Add-on Price (₹)
                    </label>
                    <input
                      type="number"
                      name="addon_price"
                      value={form.addon_price}
                      onChange={handleChange}
                      placeholder="e.g. 8000"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Preferred Payment Methods - With Colored Buttons */}
                <div className="mt-12">
                  <label className="block text-lg font-bold text-gray-800 mb-3">
                    Preferred Payment Methods
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => togglePayment(method)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm transform hover:scale-105 ${
                          form.payment_methods_list.includes(method)
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terms & Submit */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="agreed_terms"
                    name="agreed_terms"
                    checked={form.agreed_terms}
                    onChange={handleChange}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                  />
                  <label htmlFor="agreed_terms" className="text-gray-700 text-lg leading-relaxed">
                    I agree to the <span className="font-bold text-amber-700">Terms & Conditions</span> and{" "}
                    <span className="font-bold text-amber-700">Privacy Policy</span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  onClick={submitBooking}
                  disabled={loading}
                  className="mt-5 w-full max-w-[200px] mx-auto mt-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm Booking Request"
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* BENEFITS SIDEBAR */}
          <div className="lg:col-span-1 space-y-8 mt-20">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Why Choose IMC Visual Arts
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Camera className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Pro Equipment</strong><br />
                    <span className="text-white/80">Full-frame cameras, prime lenses, professional lighting</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Edited Delivery</strong><br />
                    <span className="text-white/80">Hand-edited high-resolution photos + video highlights</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Award className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Experienced Team</strong><br />
                    <span className="text-white/80">10+ years capturing weddings, events & portraits</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100 text-center"
            >
              <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Premium Memories</h3>
              <p className="text-gray-600">
                Trusted by families and couples across India to preserve their most precious moments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}