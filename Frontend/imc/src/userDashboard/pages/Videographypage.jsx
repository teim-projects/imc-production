import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg";
import {
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users, // ← Fixed: Added missing import
  Phone,
  Mail,
  User,
  Video,
  ChevronDown,
  Sparkles,
  Star,
  Award,
  FileText,
  IndianRupee,
  Wallet,
  CreditCard,
  Building2,
} from "lucide-react";

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const VIDEOGRAPHY_API = `${API_BASE.replace(/\/$/, "")}/auth/videography-bookings/`;

const PACKAGE_TYPES = [
  "Basic Highlight Reel",
  "Premium Cinematic Film",
  "Wedding Full Package",
  "Music Video Pro",
  "Corporate Branding",
  "Drone + Ground Combo",
  "Custom Package",
];

export default function VideographyForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    client_name: "",
    email: "",
    mobile_no: "",
    project: "",
    editor: "",
    shoot_date: "",
    start_time: "",
    duration_hours: "",
    location: "",
    package_type: "",
    package_price: "",
    event_type: "",
    other_event_name: "",
    payment_method: "",
    notes: "",
    agreed_terms: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setPaymentMethod = (method) => {
    setForm((prev) => ({ ...prev, payment_method: method }));
  };

  const validateForm = () => {
    if (!form.client_name.trim()) return "Client name is required";
    if (!form.mobile_no.trim()) return "Mobile number is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.project.trim()) return "Project / Event Name is required";
    if (!form.editor.trim()) return "Editor is required";
    if (!form.shoot_date) return "Shoot date is required";
    if (!form.duration_hours) return "Duration is required";
    if (!form.location.trim()) return "Location is required";
    if (!form.package_type) return "Package type is required";
    if (!form.payment_method) return "Payment method is required";
    if (!form.agreed_terms) return "You must agree to terms and conditions";
    return null;
  };

  const submit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    const payload = {
      client_name: form.client_name.trim(),
      email: form.email.trim(),
      mobile_no: form.mobile_no.trim(),
      project: form.project.trim(),
      editor: form.editor.trim(),
      shoot_date: form.shoot_date,
      start_time: form.start_time || null,
      duration_hours: Number(form.duration_hours),
      location: form.location.trim(),
      package_type: form.package_type,
      package_price: form.package_price ? Number(form.package_price) : null,
      event_type: form.event_type || null,
      other_event_name: form.other_event_name.trim() || null,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
    };

    try {
      setLoading(true);
      await axios.post(VIDEOGRAPHY_API, payload);
      setSuccess(true);
    } catch (err) {
      console.error("Submission failed:", err.response?.data || err);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({
      client_name: "",
      email: "",
      mobile_no: "",
      project: "",
      editor: "",
      shoot_date: "",
      start_time: "",
      duration_hours: "",
      location: "",
      package_type: "",
      package_price: "",
      event_type: "",
      other_event_name: "",
      payment_method: "",
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
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Booking Request Sent!
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Thank you, {form.client_name}! We’ll contact you soon.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Book Another Project
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* Hero */}
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
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Videography Booking
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-amber-400 mt-2 drop-shadow">
              IMC Cinematic Arts
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 mt-4 max-w-2xl"
          >
            Professional videography for weddings, music videos, corporate films, and events
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 -mt-20 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <Video className="w-12 h-12 text-amber-600" />
                  Book Your Videography Project
                </h2>

                {/* Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="client_name"
                      value={form.client_name}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="mobile_no"
                        value={form.mobile_no}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Project / Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="project"
                      value={form.project}
                      onChange={handleChange}
                      placeholder="e.g. Wedding Film - Rahul & Priya"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Editor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="editor"
                      value={form.editor}
                      onChange={handleChange}
                      placeholder="Preferred editor name"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Event Type
                    </label>
                    <input
                      type="text"
                      name="event_type"
                      value={form.event_type}
                      onChange={handleChange}
                      placeholder="e.g. Wedding, Corporate"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Package & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Package Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="package_type"
                        value={form.package_type}
                        onChange={handleChange}
                        className="w-full h-12 px-5 pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                      >
                        <option value="">Select Package</option>
                        {PACKAGE_TYPES.map((pkg) => (
                          <option key={pkg} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Package Price (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="package_price"
                        value={form.package_price}
                        onChange={handleChange}
                        placeholder="e.g. 75000"
                        className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Shoot Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="shoot_date"
                        value={form.shoot_date}
                        onChange={handleChange}
                        className="w-full h-12 px-5 pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Start Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="start_time"
                        value={form.start_time}
                        onChange={handleChange}
                        className="w-full h-12 px-5 pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Duration (Hours) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={form.duration_hours}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g. 8"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="City / Venue"
                        className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-bold mb-4">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: "cash", label: "Cash", icon: IndianRupee },
                      { key: "card", label: "Card", icon: CreditCard },
                      { key: "upi", label: "UPI", icon: Wallet },
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = form.payment_method === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setPaymentMethod(option.key)}
                          className={`p-6 rounded-2xl border-4 transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 shadow-lg"
                              : "border-gray-200 hover:border-amber-300 bg-gray-50"
                          }`}
                        >
                          <Icon className={`w-12 h-12 mx-auto mb-4 ${isSelected ? "text-amber-600" : "text-gray-600"}`} />
                          <p className={`font-bold ${isSelected ? "text-amber-800" : "text-gray-800"}`}>
                            {option.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-medium mb-3">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Any special requirements, deliverables, style preferences..."
                    className="w-full px-5 py-4 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={form.agreed_terms}
                    onChange={(e) => setForm({ ...form, agreed_terms: e.target.checked })}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                  />
                  <label htmlFor="terms" className="text-gray-700 text-lg leading-relaxed">
                    I agree to the <span className="font-bold text-amber-700">Terms & Conditions</span> and{" "}
                    <span className="font-bold text-amber-700">Privacy Policy</span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full max-w-md mx-auto mt-12 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed"
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

          {/* Benefits Sidebar */}
          <div className="lg:col-span-1 space-y-8 mt-20">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Premium Features
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Video className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>4K Cinematic</strong><br />
                    <span className="text-white/80">Ultra HD footage with color grading</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Users className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Drone & Gimbal</strong><br />
                    <span className="text-white/80">Smooth aerial and stabilized shots</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Full Package</strong><br />
                    <span className="text-white/80">Teaser, highlight & full film</span>
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
              <h3 className="text-2xl font-bold text-center mb-3">Professional Quality</h3>
              <p className="text-gray-600 text-center">
                Trusted by hundreds of clients for cinematic storytelling and emotional films.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}