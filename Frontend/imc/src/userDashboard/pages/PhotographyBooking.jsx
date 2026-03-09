// PhotographyBooking.jsx
// Simplified version — removed online payment integration

import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg";
import {
  Loader2, CheckCircle, Calendar, Clock, MapPin, Users,
  Phone, Mail, User, Camera, ChevronDown, Sparkles,
  Star, Award, Drone,
} from "lucide-react";

// ────────────────────────────────────────────────
// API Configuration
// ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const PHOTOGRAPHY_API = `${API_BASE.replace(/\/$/, "")}/auth/photography-bookings/`;

const SHOOT_TYPES = [
  "Engagement/Wedding Photography",
  "Maternity Shoot",
  "Newborn/Baby Shoot",
  "Fashion/Portfolio",
  "Product Photography",
  "Corporate shots",
  "Musical Event Coverage",
  "Birthday Party",
  "Other",
];

const PACKAGE_TYPES = ["Basic", "Standard", "Premium", "Luxury", "Custom"];

const DURATION_OPTIONS = [
  { value: 6,  label: "Half Day (0 to 4 Hours)" },
  { value: 8,  label: "Full Day (5-10 Hours)" },
  { value: 24, label: "Multi-Day / Overnight" },
];

// ────────────────────────────────────────────────
// Policies (same as before)
// ────────────────────────────────────────────────
const policies = [
  {
    id: "A",
    title: "A. Booking & Confirmation Policies",
    content: `
1. Booking Confirmation
• Booking is confirmed only after receipt of advance payment / full payment (as per package).
• A confirmation message with shoot details will be sent via WhatsApp / email within 24 hours.

2. Advance Payment
• Minimum 30–50% advance is mandatory to block the date and team.
• Balance payment must be cleared at least 48 hours before the shoot (or on the day as agreed).

3. Package & Pricing
• Quoted prices are approximate and subject to final confirmation based on location, travel, and requirements.
• Any additional services (extra hours, drone, album, editing) will be charged extra.

4. Date & Time Changes
• Date changes requested 15+ days in advance are free (subject to availability).
• Changes within 7–14 days attract 25% rescheduling fee.
• Changes within 7 days may not be possible or attract full cancellation charge.
    `,
  },
  {
    id: "B",
    title: "B. Cancellation & Refund Policies",
    content: `
5. Cancellation by Client
• 15+ days before shoot → 100% refund of advance (minus any gateway charges).
• 8–14 days before shoot → 50% refund of advance.
• Less than 7 days before shoot → No refund.

6. Cancellation by IMC
• In case of unavoidable circumstances (force majeure, illness, equipment failure), full advance will be refunded or alternative date provided.
• IMC not liable for any consequential losses.

7. No-show / Late Arrival
• If client is not present at agreed time + 60 minutes grace period → shoot may be cancelled without refund.
    `,
  },
  // ... (rest of the policies remain the same — omitted here for brevity)
  {
    id: "F",
    title: "F. Final Acceptance",
    content: `
By submitting this booking form,
the client confirms acceptance of all the above policies.
Any disputes will be subject to Mumbai jurisdiction only.
    `,
  },
];

// Policies Modal (unchanged)
function PoliciesModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("A");
  const current = policies.find((p) => p.id === activeTab);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-gray-950 text-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-amber-800/50"
      >
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">Terms & Conditions</h2>
            <p className="text-amber-200 mt-1">IMC Photography Booking Policies</p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-bold hover:text-amber-200 transition"
          >
            ×
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-800 bg-gray-900/70">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === p.id
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-amber-400 mb-5">{current.title}</h3>
            <pre className="whitespace-pre-wrap font-sans text-gray-200 text-base leading-relaxed">
              {current.content.trim()}
            </pre>
          </motion.div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-center">
          <button
            onClick={onClose}
            className="px-12 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PhotographyBooking() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

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

  const createBooking = async () => {
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
      payment_status:       "pending", // or "manual" / "to_be_confirmed"
    };

    const response = await axios.post(PHOTOGRAPHY_API, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status !== 201) {
      throw new Error("Failed to create booking");
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);

    try {
      await createBooking();
      setSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      let msg = "Something went wrong. Please try again later.";

      if (err.response?.data) {
        const serverError = err.response.data;
        if (typeof serverError === "object") {
          const firstKey = Object.keys(serverError)[0];
          msg = Array.isArray(serverError[firstKey])
            ? serverError[firstKey][0]
            : serverError[firstKey] || msg;
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
      agreed_terms: false,
    });
  };

  // ────────────────────────────────────────────────
  // SUCCESS VIEW
  // ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-3xl shadow-2xl p-10 md:p-16 text-center max-w-2xl w-full border border-green-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <CheckCircle className="w-24 h-24 md:w-32 md:h-32 text-green-500 mx-auto mb-8" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-4">
            Booking Received!
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Thank you, {form.client}!
          </p>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10">
            <p className="text-lg text-gray-800 leading-relaxed">
              Your photography booking request has been submitted successfully.<br />
              Our team will contact you shortly (usually within 24 hours) to confirm details, availability and discuss payment.
            </p>
            <p className="text-base text-gray-600 mt-4">
              We will reach you via WhatsApp / call / email.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3"
            >
              Go to Dashboard
            </button>

            <button
              onClick={resetForm}
              className="px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl shadow transition transform hover:scale-105 flex items-center justify-center gap-3"
            >
              Book Another Shoot
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-12">
            Thank you for choosing IMC Visual Arts!
          </p>
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
                  <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-center">
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

                {/* Terms */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="agreed_terms"
                    name="agreed_terms"
                    checked={form.agreed_terms}
                    onChange={handleChange}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                  />
                  <label htmlFor="agreed_terms" className="text-gray-700 text-lg leading-relaxed select-none">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowPoliciesModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowPoliciesModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      Privacy Policy
                    </button>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.agreed_terms}
                  className="mt-8 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Booking Request"
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

      {showPoliciesModal && <PoliciesModal onClose={() => setShowPoliciesModal(false)} />}
    </div>
  );
}