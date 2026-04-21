import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.webp";
import {
  Loader2,
  CheckCircle,
  Speaker,
  ChevronDown,
  Sparkles,
  Star,
  Award,
  FileText,
  Mic,
} from "lucide-react";

// ────────────────────────────────────────────────
//  API SETUP WITH AUTH
// ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_BASE_API_URL || "https://www.imcpune.in/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SOUND_BOOKING_API = "/auth/sound/"; // relative path

const SYSTEM_TYPES = [
  "Basic PA System",
  "DJ Setup",
  "Concert Sound System",
  "Wireless Microphones",
  "Stage Lighting + Sound",
  "Full Event Package",
  "Custom Setup",
];

export default function SoundBooking() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    client_name: "",           // changed key name to match backend expectation
    contact_number: "",
    email: "",
    address: "",
    system_type: "",
    event_date: "",
    mixer_model: "",
    price: "",
    speakers_count: "",
    microphones_count: "",
    payment_method: "Cash",
    notes: "",
    agreed_terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrorMsg(""); // clear error when user types
  };

  const validateForm = () => {
    if (!form.client_name.trim()) return "Customer name is required";
    if (!form.contact_number.trim()) return "Contact number is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      return "Valid email is required";
    if (!form.system_type) return "Please select system type";
    if (!form.event_date) return "Event date is required";
    if (!form.agreed_terms) return "You must agree to terms & conditions";
    return null;
  };

  const submitBooking = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const data = new FormData();
    data.append("client_name", form.client_name.trim());     // ← changed to client_name
    data.append("contact_number", form.contact_number.trim());
    data.append("email", form.email.trim());
    if (form.address.trim()) data.append("address", form.address.trim());
    data.append("system_type", form.system_type);
    data.append("event_date", form.event_date);
    if (form.mixer_model.trim()) data.append("mixer_model", form.mixer_model.trim());
    if (form.price.trim()) data.append("price", form.price.trim());
    if (form.speakers_count) data.append("speakers_count", Number(form.speakers_count));
    if (form.microphones_count) data.append("microphones_count", Number(form.microphones_count));
    data.append("payment_method", form.payment_method);
    if (form.notes.trim()) data.append("notes", form.notes.trim());

    try {
      // Debug log (you can remove later)
      const token = localStorage.getItem("access");
      console.log("Submitting booking → Token present:", !!token, token ? `(${token.length} chars)` : "");

      await api.post(SOUND_BOOKING_API, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setErrorMsg("");
    } catch (err) {
      console.error("Booking failed:", err);

      let msg = "Failed to submit booking. Please try again later.";

      if (err.response?.status === 401) {
        msg = "Authentication required. Please log in first.";
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.response?.data) {
        msg = JSON.stringify(err.response.data);
      } else if (err.message) {
        msg = err.message;
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
      client_name: "",
      contact_number: "",
      email: "",
      address: "",
      system_type: "",
      event_date: "",
      mixer_model: "",
      price: "",
      speakers_count: "",
      microphones_count: "",
      payment_method: "Cash",
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
            Thank you, {form.client_name || "customer"}!<br />
            We’ve received your sound system request.<br />
            Our team will contact you within 24 hours.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Book Another System
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* HERO */}
      <section className="relative h-96 md:h-[28rem] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-75"
          style={{ backgroundImage: `url(${SingerBackground})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Sound System Booking
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-amber-400 mt-2 drop-shadow">
              IMC Sound & Lighting
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 mt-4 max-w-2xl"
          >
            Professional PA systems, DJ setup, microphones, and lighting for events of any size
          </motion.p>
        </div>
      </section>

      {/* MAIN FORM SECTION */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="sticky top-20 -mt-20 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <Speaker className="w-12 h-12 text-amber-600" />
                  Book Your Sound System
                </h2>

                {errorMsg && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Client & Contact */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-700">
                    Client & Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="client_name"
                        value={form.client_name}
                        onChange={handleChange}
                        placeholder="e.g., Virat Sharma"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="yourname@example.com"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <label className="block text-gray-700 font-medium mb-3">
                      Address / Venue
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="e.g., Hinjawadi Phase 1, Pune, Maharashtra"
                      disabled={loading}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Setup & Schedule */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-700">
                    Setup & Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative">
                      <label className="block text-gray-700 font-medium mb-3">
                        System Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="system_type"
                        value={form.system_type}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition disabled:opacity-60"
                      >
                        <option value="">— Select System —</option>
                        {SYSTEM_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="event_date"
                        value={form.event_date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Mixer Model (optional)
                      </label>
                      <input
                        type="text"
                        name="mixer_model"
                        value={form.mixer_model}
                        onChange={handleChange}
                        placeholder="e.g., Yamaha MG10XU, Allen & Heath ZEDi-10"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Expected Price (₹) optional
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="e.g., 18000"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment Details */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-700">
                    Equipment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Number of Speakers
                      </label>
                      <input
                        type="number"
                        name="speakers_count"
                        value={form.speakers_count}
                        onChange={handleChange}
                        min="0"
                        placeholder="e.g., 4"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Number of Microphones
                      </label>
                      <input
                        type="number"
                        name="microphones_count"
                        value={form.microphones_count}
                        onChange={handleChange}
                        min="0"
                        placeholder="e.g., 2 wireless + 2 wired"
                        disabled={loading}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment & Notes */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-700">
                    Payment & Additional Notes
                  </h3>

                  <div className="mb-8">
                    <label className="block text-gray-700 font-medium mb-3">
                      Preferred Payment Method
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {["Cash", "Card", "UPI"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          disabled={loading}
                          onClick={() => setForm((prev) => ({ ...prev, payment_method: method }))}
                          className={`px-8 py-3 rounded-full font-medium transition disabled:opacity-60 ${
                            form.payment_method === method
                              ? "bg-amber-600 text-white shadow-lg"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">
                      <FileText className="inline w-6 h-6 mr-2" />
                      Additional Notes / Requirements
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Venue address details, event start time, any special requirements, backup power needed, etc..."
                      disabled={loading}
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreed_terms"
                    checked={form.agreed_terms}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1 disabled:opacity-60"
                  />
                  <label htmlFor="terms" className="text-gray-700 text-lg leading-relaxed cursor-pointer">
                    I agree to the <span className="font-bold text-amber-700">Terms & Conditions</span> and{" "}
                    <span className="font-bold text-amber-700">Privacy Policy</span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitBooking}
                  disabled={loading}
                  className="mt-10 w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-7 h-7" />
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
                What You Get
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Speaker className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Crystal Clear Sound</strong><br />
                    <span className="text-white/80">Professional-grade equipment</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Mic className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Wireless Microphones</strong><br />
                    <span className="text-white/80">Freedom of movement on stage</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Stage & DJ Lighting</strong><br />
                    <span className="text-white/80">Included in most packages</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100 text-center"
            >
              <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Trusted Quality</h3>
              <p className="text-gray-600">
                Serving 500+ events across Pune, Mumbai and Maharashtra.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}