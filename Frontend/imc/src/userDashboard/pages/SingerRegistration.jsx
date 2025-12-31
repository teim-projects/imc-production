import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg";
import {
  Loader2,
  Mic,
  CheckCircle,
  Calendar,
  ChevronDown,
  Upload,
  Sparkles,
  Music,
  Star,
  Award,
} from "lucide-react";

// API Configuration - As per your request
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const SINGER_API = `${API_BASE}/auth/singers/`; // Only for POST (registration)

export default function SingerRegistration() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    birth_date: "",
    mobile: "",
    profession: "",
    education: "",
    achievement: "",
    favourite_singer: "",
    reference_by: "",
    genre: "",
    experience: "",
    area: "",
    city: "",
    state: "",
    rate: "",
    gender: "",
    active: true,
    photo: null,
    agreed_terms: false,
  });

  const submit = async () => {
    if (!form.name || !form.mobile || !form.genre) {
      alert("Please fill required fields");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "agreed_terms") return; // Skip frontend-only field
      if (value === "" || value === null) return; // Skip empty/null
      data.append(key, value);
    });

    data.append("active", "true");

    try {
      setLoading(true);
      await axios.post(SINGER_API, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      console.error("API ERROR:", err.response?.data || err.message);
      alert("Form submission failed — check console for details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({
      name: "",
      birth_date: "",
      mobile: "",
      profession: "",
      education: "",
      achievement: "",
      favourite_singer: "",
      reference_by: "",
      genre: "",
      experience: "",
      area: "",
      city: "",
      state: "",
      rate: "",
      gender: "",
      active: true,
      photo: null,
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
            Registration Successful!
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Congratulations! Our team will review your profile and contact you soon.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Register Another Singer
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* HERO SECTION */}
      <section className="relative h-96 md:h-[28rem] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${SingerBackground})`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
              Singer Registration
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-amber-600 mt-2">
              IMC Artist Program
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base md:text-lg text-gray-700 mt-4 max-w-2xl"
          >
            Join India's premier music community and unlock paid gigs, studio access, and official certification.
          </motion.p>
        </div>
      </section>

      {/* MAIN CONTENT - FORM + BENEFITS */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: REGISTRATION FORM */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 -mt-20 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <span className="text-5xl">🎤</span>
                  Register Your Talent
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                        className="w-full h-12 px-5 pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={form.profession}
                      onChange={(e) => setForm({ ...form, profession: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Education
                    </label>
                    <input
                      type="text"
                      value={form.education}
                      onChange={(e) => setForm({ ...form, education: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Favourite Singer
                    </label>
                    <input
                      type="text"
                      value={form.favourite_singer}
                      onChange={(e) => setForm({ ...form, favourite_singer: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Reference By
                    </label>
                    <input
                      type="text"
                      value={form.reference_by}
                      onChange={(e) => setForm({ ...form, reference_by: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Genre <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.genre}
                        onChange={(e) => setForm({ ...form, genre: e.target.value })}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                        required
                      >
                        <option value="" disabled>Select Genre</option>
                        <option>Classical</option>
                        <option>Bollywood</option>
                        <option>Pop</option>
                        <option>Rock</option>
                        <option>Folk</option>
                        <option>Sufi</option>
                        <option>Bhajan</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Experience (in years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Expected Rate (₹ per event)
                    </label>
                    <input
                      type="text"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                      >
                        <option value="" disabled>Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  <div className="flex flex-col">
                    <label className="block text-lg font-bold text-gray-800 mb-3">
                      Upload Photo
                    </label>
                    <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 flex flex-col justify-center cursor-pointer hover:border-amber-400 transition">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm mb-1">
                        <span className="text-amber-600 font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-lg font-bold text-gray-800 mb-3">
                      Achievements & Experience
                    </label>
                    <textarea
                      rows={5}
                      value={form.achievement}
                      onChange={(e) => setForm({ ...form, achievement: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none text-base"
                      placeholder="Mention awards, notable performances, YouTube links, collaborations..."
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    checked={form.agreed_terms}
                    onChange={(e) => setForm({ ...form, agreed_terms: e.target.checked })}
                  />
                  <label htmlFor="terms" className="text-gray-700 text-lg">
                    I agree to the <span className="font-bold text-amber-700">Terms & Conditions</span> and <span className="font-bold text-amber-700">Privacy Policy</span> <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full max-w-md mx-auto mt-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center justify-center gap-4 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* RIGHT: BENEFITS PANELS */}
          <div className="lg:col-span-1 space-y-8 mt-20">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Exclusive Benefits
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <Music className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Live Shows</strong><br />
                    <span className="text-white/80">Corporate, weddings & concerts</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Mic className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Studio Recording</strong><br />
                    <span className="text-white/80">Professional tracks & covers</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Paid Gigs</strong><br />
                    <span className="text-white/80">Earn from premium events</span>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100"
            >
              <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-center mb-3">Official Certification</h3>
              <p className="text-gray-600 text-center">
                Receive an <strong>IMC Verified Singer Certificate</strong> recognized across the industry.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}