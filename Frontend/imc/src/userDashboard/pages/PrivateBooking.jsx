// src/pages/PrivateEventBooking.jsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/private event banner desktop.webp";
import {
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  Mic,
  MapPin,
  Users,
  Phone,
  Mail,
  User,
  Camera,
  Upload,
  ChevronDown,
  Sparkles,
  Star,
  Award,
  FileText,
} from "lucide-react";

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const PRIVATE_BOOKING_API = `${API_BASE.replace(/\/$/, "")}/auth/private-bookings/`;

const EVENT_TYPES = [
  "Wedding",
  "Pre-Wedding Shoot",
  "Birthday Party",
  "Anniversary",
  "Corporate Event",
  "Engagement",
  "Baby Shower",
  "Housewarming",
  "Private Concert",
  "Fashion Shoot",
  "Product Launch",
  "Other",
];

const DURATION_OPTIONS = [
  "2 Hours",
  "4 Hours",
  "6 Hours",
  "8 Hours",
  "Full Day (10+ Hours)",
  "Multi-Day",
];

// Policies (complete)
const policies = [
  {
    id: "A",
    title: "A. Booking & Confirmation Policies",
    content: `
1. Booking Confirmation
• Booking is confirmed only after receipt of advance payment (minimum 30–50% depending on event type).
• Confirmation details (team lineup, quote, timeline) will be shared via WhatsApp/email within 24–48 hours.

2. Advance & Balance Payment
• Advance locks your date and team.
• Balance must be cleared at least 72 hours before the event (or as mutually agreed).
• All payments are non-refundable except as per cancellation policy.

3. Custom Quote
• Final pricing depends on location, travel, guest count, equipment, and special requirements.
• Any add-ons (extra hours, special lighting, additional performers) will be charged extra.
    `,
  },
  {
    id: "B",
    title: "B. Cancellation & Refund Policies",
    content: `
4. Cancellation by Client
• 30+ days before event → 75% refund of advance (minus gateway charges).
• 15–29 days before event → 50% refund of advance.
• 7–14 days before event → 25% refund of advance.
• Less than 7 days before event → No refund.

5. Cancellation by IMC
• In case of unavoidable circumstances (force majeure, health emergency, government restrictions), full advance refunded or alternate date provided.
• IMC not liable for any indirect/consequential losses.

6. No-show / Late Arrival
• If client is unavailable at agreed time + 90 minutes grace → event may be cancelled without refund.
    `,
  },
  {
    id: "C",
    title: "C. Event Execution & Deliverables",
    content: `
7. Performance / Service Duration
• Service starts at agreed time slot.
• Extra hours charged as per prevailing rates.

8. Deliverables (Photography / Videography)
• Edited photos/videos delivered within 30–60 days (rush delivery extra).
• RAW files not provided unless specifically paid for.

9. Usage Rights
• Client gets personal & social media usage rights.
• IMC reserves right to use selected content for portfolio/promotion (credit given where possible).

10. Weather / Venue Issues
• Outdoor events affected by weather → rescheduling mutually decided, no automatic refund if partial service delivered.
    `,
  },
  {
    id: "D",
    title: "D. Travel, Permissions & Responsibility",
    content: `
11. Travel & Logistics
• Outstation events: Travel, accommodation, food & permits borne by client (or included in quote).

12. Permissions
• Client responsible for venue permissions, parking, electricity, sound limits, drone NOC, etc.

13. Code of Conduct
• Respectful behaviour expected from all parties.
• Misconduct may lead to immediate termination without refund.
    `,
  },
  {
    id: "E",
    title: "E. Payment & Force Majeure",
    content: `
14. Payment Modes
• UPI, Bank Transfer, Online Gateway, Cash (balance only on event day).

15. Force Majeure
• IMC not liable for delays/cancellations due to natural disasters, strikes, government orders, etc.

16. Jurisdiction
• All disputes subject to Pune jurisdiction only.
    `,
  },
  {
    id: "F",
    title: "F. Final Acceptance",
    content: `
By submitting this booking request and making any payment,
the client confirms full acceptance of the above policies.
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
            <p className="text-amber-200 mt-1">IMC Private Event Booking Policies</p>
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

export default function PrivateEventBooking() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    customer: "",
    contact_number: "",
    email: "",
    address: "",
    event_type: "",
    venue: "",
    guest_count: "",
    date: "",
    time: "",
    duration: "",
    notes: "",
    agreed_terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.customer.trim()) newErrors.customer = "Customer name is required";
    if (!form.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(form.contact_number.trim())) {
      newErrors.contact_number = "Contact number must be 10 digits";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!form.event_type.trim()) newErrors.event_type = "Event type is required";
    if (!form.venue.trim()) newErrors.venue = "Venue is required";
    if (!form.date) newErrors.date = "Date is required";
    if (!form.duration.trim()) newErrors.duration = "Duration is required";
    if (!form.agreed_terms) newErrors.agreed_terms = "You must agree to terms";
    return newErrors;
  };

  const submitBooking = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});

    const data = new FormData();
    data.append("customer", form.customer.trim());
    data.append("contact_number", form.contact_number.trim());
    data.append("email", form.email.trim());
    if (form.address.trim()) data.append("address", form.address.trim());
    data.append("event_type", form.event_type.trim());
    data.append("venue", form.venue.trim());
    data.append("date", form.date);
    if (form.time.trim()) data.append("time", form.time.trim());
    data.append("duration", form.duration.trim());
    if (form.guest_count.trim()) data.append("guest_count", Number(form.guest_count));
    if (form.notes.trim()) data.append("notes", form.notes.trim());

    try {
      setLoading(true);
      await axios.post(PRIVATE_BOOKING_API, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      console.error("Booking failed:", err.response?.data || err);
      alert("Booking submission failed. Please try again.");
    } finally {      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setErrors({});
    setForm({
      customer: "",
      contact_number: "",
      email: "",
      address: "",
      event_type: "",
      venue: "",
      guest_count: "",
      date: "",
      time: "",
      duration: "",
      notes: "",
      agreed_terms: false,
    });
  };

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
            Thank you, {form.customer}! We’ve received your private event request. Our team will contact you within 24 hours with a custom quote.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Book Another Event
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* HERO SECTION - Updated heading with your requested style */}
      <section className="relative h-96 md:h-[28rem] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-75"
          style={{ backgroundImage: `url(${SingerBackground})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-wide"
              style={{
                fontFamily: '"Algerian", "Castellar", Georgia, "Times New Roman", serif',
                textShadow: "4px 4px 16px rgba(0,0,0,0.8)",
                letterSpacing: "0.05em",
              }}
            >
              BOOK YOUR PRIVATE EVENT
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 mt-4 max-w-2xl"
          >
            {/* You can add subtitle here if needed */}
          </motion.p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FORM */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 -mt-20 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16"
              >
                {/* Form heading with tight star */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center text-3xl md:text-4xl font-bold text-gray-900">
                    <span className="text-5xl text-orange-500 mr-0">⭐</span>
                    Book Your Private Event
                  </div>
              
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl font-medium">
                    Please fill in all required fields correctly.
                  </div>
                )}

                {/* Customer Details */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-red-600 mb-6">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Customer Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customer"
                        value={form.customer}
                        onChange={handleChange}
                        placeholder="e.g., Rahul Verma"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.customer ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Contact Number<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                        placeholder="+91XXXXXXXXXX"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.contact_number ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.contact_number && <p className="text-red-500 text-sm mt-1">{errors.contact_number}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Email<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="customer@email.com"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.email ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Street, City"
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-red-600 mb-6">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Event Type<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="event_type"
                        value={form.event_type}
                        onChange={handleChange}
                        placeholder="Birthday / Wedding / Corporate / Private Party"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.event_type ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.event_type && <p className="text-red-500 text-sm mt-1">{errors.event_type}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Venue<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="venue"
                        value={form.venue}
                        onChange={handleChange}
                        placeholder="IMC Banquet Hall / Client Venue"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.venue ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Guest Count</label>
                      <input
                        type="text"
                        name="guest_count"
                        value={form.guest_count}
                        onChange={handleChange}
                        placeholder="e.g., 120"
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-red-600 mb-6">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.date ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                      <p className="text-xs text-gray-500 mt-1">dd-mm-yyyy</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Time</label>
                      <input
                        type="time"
                        name="time"
                        value={form.time}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">
                        Duration (hours)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        placeholder="e.g, 3"
                        className={`w-full h-12 px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition ${errors.duration ? "border-red-500" : "border-gray-300"}`}
                      />
                      {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-red-600 mb-6">Special Notes</h3>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Any special arrangements,artist requirements, A/V setup, lighting preferences, etc."
                    className="w-full px-5 py-4 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-4 mt-10">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreed_terms"
                    checked={form.agreed_terms}
                    onChange={(e) => {
                      setForm({ ...form, agreed_terms: e.target.checked });
                      if (errors.agreed_terms) setErrors((prev) => ({ ...prev, agreed_terms: "" }));
                    }}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                  />
                  <div>
                    <label htmlFor="terms" className="text-gray-700 text-lg leading-relaxed select-none">
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
                    {errors.agreed_terms && <p className="text-red-500 text-sm mt-1">{errors.agreed_terms}</p>}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={submitBooking}
                    disabled={loading}
                    className="
                      group relative
                      inline-flex items-center justify-between
                      gap-3
                      px-8 py-3.5
                      bg-gradient-to-r from-amber-500 to-orange-600
                      text-white font-semibold text-base
                      rounded-full
                      shadow-md hover:shadow-xl
                      transform hover:-translate-y-0.5 active:scale-98
                      transition-all duration-200
                      disabled:opacity-60 disabled:cursor-not-allowed
                      min-w-[260px] sm:min-w-[280px]
                      overflow-hidden
                    "
                  >
                    <span className="flex-1 text-center">
                      {loading ? "Submitting..." : "Submit Booking Request"}
                    </span>
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5 flex-shrink-0" />
                    ) : (
                      <span className="text-lg font-bold group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    )}
                  </button>
                </div>
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
                What You Get
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Camera className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Professional Coverage</strong><br />
                    <span className="text-white/80">Photography & cinematic videography</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Mic className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Live Music</strong><br />
                    <span className="text-white/80">Talented singers & bands</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Custom Packages</strong><br />
                    <span className="text-white/80">Tailored to your vision & budget</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100"
            >
              <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-center mb-3">Premium Service</h3>
              <p className="text-gray-600 text-center">
                Trusted by hundreds of clients for weddings, corporate events, and private celebrations across India.
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