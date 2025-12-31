import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg"; // Replace with photography-themed image if desired
import {
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
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

// API Configuration - Update if you have a specific endpoint
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const PHOTOGRAPHY_API = `${API_BASE.replace(/\/$/, "")}/auth/photography-bookings/`; // Change as needed

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

const DURATION_OPTIONS = [
  "2 Hours",
  "4 Hours",
  "Half Day (6 Hours)",
  "Full Day (8-10 Hours)",
  "Multi-Day",
];

export default function PhotographyBooking() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    contact_number: "",
    email: "",
    address: "",
    shoot_type: "",
    location: "",
    date: "",
    time_slot: "",
    duration: "",
    people_count: "",
    notes: "",
    reference_images: null,
    agreed_terms: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, reference_images: e.target.files?.[0] || null }));
  };

  const validateForm = () => {
    if (!form.customer.trim()) return "Full name is required";
    if (!form.contact_number.trim()) return "Contact number is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.shoot_type) return "Please select shoot type";
    if (!form.location.trim()) return "Location is required";
    if (!form.date) return "Date is required";
    if (!form.duration) return "Duration is required";
    if (!form.people_count || form.people_count <= 0) return "Number of people must be greater than 0";
    if (!form.agreed_terms) return "You must agree to terms";
    return null;
  };

  const submitBooking = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    const data = new FormData();
    data.append("customer", form.customer.trim());
    data.append("contact_number", form.contact_number.trim());
    data.append("email", form.email.trim());
    if (form.address.trim()) data.append("address", form.address.trim());
    data.append("shoot_type", form.shoot_type);
    data.append("location", form.location.trim());
    data.append("date", form.date);
    if (form.time_slot.trim()) data.append("time_slot", form.time_slot.trim());
    data.append("duration", form.duration);
    data.append("people_count", Number(form.people_count));
    if (form.notes.trim()) data.append("notes", form.notes.trim());
    if (form.reference_images) data.append("reference_images", form.reference_images);

    try {
      setLoading(true);
      await axios.post(PHOTOGRAPHY_API, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      console.error("Booking failed:", err.response?.data || err);
      alert("Booking submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({
      customer: "",
      contact_number: "",
      email: "",
      address: "",
      shoot_type: "",
      location: "",
      date: "",
      time_slot: "",
      duration: "",
      people_count: "",
      notes: "",
      reference_images: null,
      agreed_terms: false,
    });
  };

  // Success Page
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
            Thank you, {form.customer}! Your photography booking request has been received. We’ll contact you soon with availability and quote.
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

  // Main Form
  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* HERO SECTION */}
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
            Professional photography for weddings, portraits, events, fashion, and more
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
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <Camera className="w-12 h-12 text-amber-600" />
                  Book Your Photoshoot
                </h2>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <User className="inline w-5 h-5 mr-2" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customer"
                      value={form.customer}
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
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Shoot Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Type of Shoot <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="shoot_type"
                        value={form.shoot_type}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                      >
                        <option value="">Select Shoot Type</option>
                        {SHOOT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
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
                      placeholder="e.g. Marine Drive, Mumbai"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
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
                      Preferred Time (Optional)
                    </label>
                    <input
                      type="text"
                      name="time_slot"
                      value={form.time_slot}
                      onChange={handleChange}
                      placeholder="e.g. Golden hour / 4 PM onwards"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                      >
                        <option value="">Select Duration</option>
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      <Users className="inline w-5 h-5 mr-2" />
                      Number of People <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="people_count"
                      value={form.people_count}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g. 2 (couple) or 10 (family)"
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Upload & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">
                      <Camera className="inline w-6 h-6 mr-2" />
                      Reference Images / Mood Board (Optional)
                    </label>
                    <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 flex flex-col items-center cursor-pointer hover:border-amber-400 transition">
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        <span className="text-amber-600 font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Images up to 10MB (Pinterest links welcome)</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    {form.reference_images && (
                      <p className="text-sm text-green-600 mt-2 text-center">
                        ✓ {form.reference_images.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-800 mb-3">
                      <FileText className="inline w-6 h-6 mr-2" />
                      Special Requests / Style Preferences
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows="6"
                      placeholder="e.g. Candid style, black & white edits, outdoor only, specific poses..."
                      className="w-full px-5 py-4 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none"
                    />
                  </div>
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
                  onClick={submitBooking}
                  disabled={loading}
                  className="w-full max-w-md mx-auto mt-12 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center justify-center gap-4 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Photography Booking"
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
                Why Choose Us
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Camera className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Professional Gear</strong><br />
                    <span className="text-white/80">Full-frame cameras, prime lenses, lighting</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Edited Gallery</strong><br />
                    <span className="text-white/80">100+ hand-edited high-res photos</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Award className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Experienced Team</strong><br />
                    <span className="text-white/80">10+ years in wedding & portrait photography</span>
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
              <h3 className="text-2xl font-bold text-center mb-3">Premium Experience</h3>
              <p className="text-gray-600 text-center">
                Trusted by hundreds of clients for capturing life's most precious moments beautifully.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}