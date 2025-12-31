import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.jpg";
import {
  Loader2,
  CheckCircle,
  ChevronDown,
  Sparkles,
  Music,
  Star,
  Award,
  Phone,
  User,
  MapPin,
  IndianRupee,
  CreditCard,
  Wallet,
  Building2,
  ArrowLeft,
} from "lucide-react";

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const STUDENT_API = `${API_BASE.replace(/\/$/, "")}/auth/singing-classes/`;
const BATCH_API = `${API_BASE.replace(/\/$/, "")}/auth/batches/`;

const PAYMENT_OPTIONS = [
  { key: "card", label: "Credit / Debit Card", icon: CreditCard },
  { key: "upi", label: "UPI", icon: Wallet },
  { key: "netbanking", label: "Net Banking", icon: Building2 },
];

export default function SingingClassRegistration() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal_code: "",
    batch: "",
    reference_by: "",
    fee: "",
    payment_method: "",
    agreed_terms: false,
  });

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      setBatchesLoading(true);
      try {
        const res = await axios.get(BATCH_API, { params: { page_size: 100 } });
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setBatches(data);
      } catch (err) {
        console.error("Failed to load batches:", err);
        alert("Could not load available batches. Please try again later.");
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Auto-fill fee
  const selectedBatch = useMemo(() => {
    return batches.find((b) => String(b.id) === String(form.batch));
  }, [form.batch, batches]);

  useEffect(() => {
    if (selectedBatch?.class_fee) {
      setForm((prev) => ({ ...prev, fee: selectedBatch.class_fee }));
    }
  }, [selectedBatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setPaymentMethod = (method) => {
    setForm((prev) => ({
      ...prev,
      payment_method: prev.payment_method === method ? "" : method,
    }));
  };

  const validateForm = () => {
    if (!form.first_name.trim()) return "First name is required";
    if (!form.last_name.trim()) return "Last name is required";
    if (!form.phone.trim()) return "Phone number is required";
    if (!form.batch) return "Please select a batch";
    if (!form.fee || isNaN(form.fee) || Number(form.fee) <= 0) return "Valid fee amount is required";
    if (!form.payment_method) return "Please select a payment method";
    if (!form.agreed_terms) return "You must agree to terms and conditions";
    return null;
  };

  const handleEnrollClick = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    setShowPaymentPage(true);
  };

  const handlePaymentSubmit = async () => {
    if (!form.payment_method) {
      alert("Please select a payment method");
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address1: form.address1.trim() || null,
      address2: form.address2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      batch: Number(form.batch),
      reference_by: form.reference_by.trim() || null,
      fee: Number(form.fee),
      payment_method: form.payment_method,
      agreed_terms: form.agreed_terms,
    };

    try {
      setLoading(true);
      await axios.post(STUDENT_API, payload);
      setSuccess(true);
    } catch (err) {
      console.error("Enrollment failed:", err.response?.data || err);
      const msg =
        err.response?.data
          ? Object.values(err.response.data).flat().join(" ")
          : "Submission failed. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setShowPaymentPage(false);
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postal_code: "",
      batch: "",
      reference_by: "",
      fee: "",
      payment_method: "",
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
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Enrollment Successful!
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Thank you, {form.first_name}! Your seat is reserved. We’ll contact you soon with class details.
          </p>
          <button
            onClick={resetForm}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Enroll Another Student
          </button>
        </motion.div>
      </div>
    );
  }

  // Payment Confirmation Page
  if (showPaymentPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full"
        >
          <button
            onClick={() => setShowPaymentPage(false)}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-8 font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Edit Details
          </button>

          <h2 className="text-4xl font-bold text-center mb-6 text-amber-800">
            Complete Your Payment
          </h2>

          {/* Summary Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-amber-900 mb-4">Enrollment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-800">
              <div>
                <p className="font-medium">Student</p>
                <p>{form.first_name} {form.last_name}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{form.phone}</p>
              </div>
              <div>
                <p className="font-medium">Batch</p>
                <p>{selectedBatch?.class_name}</p>
              </div>
              <div>
                <p className="font-medium">Schedule</p>
                <p>{selectedBatch?.day} • {selectedBatch?.time_slot}</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-8 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl mb-10">
            <p className="text-2xl text-gray-700">Amount to Pay</p>
            <p className="text-6xl font-extrabold text-amber-700 mt-4">
              ₹{Number(form.fee).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-center mb-6">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = form.payment_method === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setPaymentMethod(option.key)}
                    className={`p-6 rounded-2xl border-4 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 shadow-xl"
                        : "border-gray-200 bg-gray-50 hover:border-amber-300"
                    }`}
                  >
                    <Icon className={`w-12 h-12 mx-auto mb-4 ${isSelected ? "text-amber-600" : "text-gray-600"}`} />
                    <p className={`font-bold text-lg ${isSelected ? "text-amber-800" : "text-gray-800"}`}>
                      {option.label}
                    </p>
                    {isSelected && <CheckCircle className="w-8 h-8 text-green-500 mx-auto mt-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePaymentSubmit}
            disabled={loading || !form.payment_method}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-8 h-8" />
                Processing Payment...
              </>
            ) : (
              <>
                <IndianRupee className="w-8 h-8" />
                Pay ₹{Number(form.fee).toLocaleString("en-IN")} Now
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-8">
            🔒 Secure • 256-bit SSL Encrypted • Powered by Trusted Gateway
          </p>
        </motion.div>
      </div>
    );
  }

  // Main Registration Form
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
              Singing Class Enrollment
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-amber-400 mt-2 drop-shadow">
              IMC Music Academy
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 mt-4 max-w-2xl"
          >
            Join professional vocal training with limited seats per batch
          </motion.p>
        </div>
      </section>

      {/* Form Section */}
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
                  <Music className="w-12 h-12 text-amber-600" />
                  Enroll Now
                </h2>

                {/* Student Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">Email (optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-medium mb-3">
                    <MapPin className="inline w-5 h-5 mr-2" />
                    Address (optional)
                  </label>
                  <input
                    type="text"
                    name="address1"
                    placeholder="Street Address / Locality"
                    value={form.address1}
                    onChange={handleChange}
                    className="w-full h-12 px-5 mb-4 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                  />
                  <input
                    type="text"
                    name="address2"
                    placeholder="Apartment, building, etc."
                    value={form.address2}
                    onChange={handleChange}
                    className="w-full h-12 px-5 mb-4 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={form.city}
                      onChange={handleChange}
                      className="h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={form.state}
                      onChange={handleChange}
                      className="h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="PIN Code"
                      value={form.postal_code}
                      onChange={handleChange}
                      className="h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>
                </div>

                {/* Batch Selection */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-medium mb-3">
                    Select Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="batch"
                      value={form.batch}
                      onChange={handleChange}
                      disabled={batchesLoading}
                      className="w-full h-14 px-5 pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition text-gray-700"
                    >
                      <option value="">
                        {batchesLoading ? "Loading batches..." : "-- Choose a Batch --"}
                      </option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.day} | {b.time_slot} | {b.trainer_name || "Teacher TBD"} | {b.class_name} | ₹
                          {b.class_fee} | Seats: {b.capacity}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                  </div>

                  {selectedBatch && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl"
                    >
                      <p className="font-semibold text-amber-900 mb-2">Selected Batch Details</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <p><strong>Class:</strong> {selectedBatch.class_name}</p>
                        <p><strong>Day & Time:</strong> {selectedBatch.day} {selectedBatch.time_slot}</p>
                        <p><strong>Teacher:</strong> {selectedBatch.trainer_name || "To be assigned"}</p>
                        <p>
                          <strong>Monthly Fee:</strong>{" "}
                          <span className="text-green-600 font-bold">₹{selectedBatch.class_fee}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Monthly Fee */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-medium mb-3">
                    Monthly Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="fee"
                      value={form.fee}
                      onChange={handleChange}
                      min="0"
                      className="w-full h-12 pl-12 pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                    />
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  </div>
                  {selectedBatch?.class_fee && (
                    <p className="text-sm text-emerald-600 mt-2">
                      Suggested: ₹{selectedBatch.class_fee} (auto-filled from batch)
                    </p>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-bold mb-4">
                    Choose Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PAYMENT_OPTIONS.map((option) => {
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

                {/* Reference */}
                <div className="mt-12">
                  <label className="block text-gray-700 font-medium mb-3">Reference By (optional)</label>
                  <input
                    type="text"
                    name="reference_by"
                    value={form.reference_by}
                    onChange={handleChange}
                    placeholder="Referred by friend, social media, etc."
                    className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreed_terms"
                    checked={form.agreed_terms}
                    onChange={handleChange}
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                  />
                  <label htmlFor="terms" className="text-gray-700 text-lg leading-relaxed">
                    I agree to the <span className="font-bold text-amber-700">Terms & Conditions</span> and{" "}
                    <span className="font-bold text-amber-700">Privacy Policy</span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                {/* Proceed to Payment Button */}
                <button
                  onClick={handleEnrollClick}
                  disabled={loading || batchesLoading}
                  className="w-full max-w-md mx-auto mt-12 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Sidebar Benefits */}
          <div className="lg:col-span-1 space-y-8 mt-20">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Academy Highlights
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex gap-4">
                  <User className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Limited Batch Size</strong><br />
                    <span className="text-white/80">Personal attention guaranteed</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Music className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Expert Trainers</strong><br />
                    <span className="text-white/80">Performing artists & certified coaches</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <strong>Live Performances</strong><br />
                    <span className="text-white/80">Annual concerts & competitions</span>
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
              <h3 className="text-2xl font-bold text-center mb-3">Official Certification</h3>
              <p className="text-gray-600 text-center">
                Earn an <strong>IMC Certified Vocalist</strong> certificate upon completion.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}