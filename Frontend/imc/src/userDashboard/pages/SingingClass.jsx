// SingingClassRegistration.jsx
// Updated — Date of Birth & Preferred Class Start Date side-by-side

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singing ccclass banner desktop.webp";
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
} from "lucide-react";

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const STUDENT_API = `${API_BASE.replace(/\/$/, "")}/auth/singing-classes/`;
const BATCH_API = `${API_BASE.replace(/\/$/, "")}/auth/batches/`;
const PAYMENT_CREATE_API = `${API_BASE}/payments/create-payment/`;

const PAYMENT_OPTIONS = [
  { key: "card", label: "Credit / Debit Card", icon: CreditCard },
  { key: "upi", label: "UPI", icon: Wallet },
  { key: "netbanking", label: "Net Banking", icon: Building2 },
];

// ────────────────────────────────────────────────
// Policies (all sections)
// ────────────────────────────────────────────────
const policies = [
  {
    id: "A",
    title: "A. Enrollment & Fee Policies",
    content: `
1. Enrollment Confirmation
• Enrollment is confirmed only after full fee payment and seat availability.
• Confirmation with batch details, schedule, and teacher info sent via WhatsApp/email within 24 hours.

2. Fee Structure
• Monthly fee is non-refundable and non-transferable once batch starts.
• One-time registration fee (if any) is separate and non-refundable.

3. Batch Allocation
• Batch allocation is subject to availability and trainer discretion.
• Change of batch allowed only within first 7 days (subject to seat availability).
    `,
  },
  {
    id: "B",
    title: "B. Cancellation & Refund Policies",
    content: `
4. Cancellation Before Batch Starts
• 15+ days before batch start → 100% refund (minus gateway charges).
• 7–14 days before batch start → 50% refund.
• Less than 7 days before batch start → No refund.

5. Mid-Batch Withdrawal
• No refund for any reason after batch has started (including missed classes).

6. Batch Cancellation by IMC
• In case of unavoidable circumstances, full fee refunded or alternate batch provided.
    `,
  },
  {
    id: "C",
    title: "C. Class Execution & Attendance",
    content: `
7. Attendance & Missed Classes
• Minimum 75% attendance required for certification.
• Missed classes not compensated unless due to IMC fault.

8. Class Recordings
• Recordings (if provided) for personal reference only — not for commercial use.

9. Conduct
• Respectful behaviour towards teachers and fellow students mandatory.
• Misconduct may lead to immediate termination without refund.
    `,
  },
  {
    id: "D",
    title: "D. Certification & Deliverables",
    content: `
10. Certification
• Official IMC Certified Vocalist certificate issued after course completion and minimum attendance.

11. Materials
• Study material / song sheets provided digitally or in class.

12. Force Majeure
• IMC not liable for class disruptions due to natural disasters, government orders, etc.
    `,
  },
  {
    id: "E",
    title: "E. Payment & General Policies",
    content: `
13. Payment Modes
• UPI, Card, Net Banking, Bank Transfer.

14. Policy Updates
• Policies subject to change — latest version communicated via official channels.

15. Acceptance
• Enrollment/payment implies acceptance of all policies.
    `,
  },
  {
    id: "F",
    title: "F. Final Acceptance",
    content: `
By enrolling and making payment, the student/guardian confirms acceptance of all the above policies.
    `,
  },
];

// ────────────────────────────────────────────────
// Smaller Policies Modal
// ────────────────────────────────────────────────
function PoliciesModal({ onClose, onAgree }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const checkIfFits = () => {
      if (scrollRef.current) {
        const el = scrollRef.current;
        if (el.scrollHeight <= el.clientHeight + 30) {
          setScrolledToBottom(true);
        }
      }
    };

    checkIfFits();
    const timer = setTimeout(checkIfFits, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= 60) {
      setScrolledToBottom(true);
    }
  };

  const fullPoliciesText = policies
    .map((p) => `${p.title}\n\n${p.content.trim()}`)
    .join("\n\n──────────────────────────────\n\n");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-gray-950 text-white rounded-xl w-full max-w-3xl max-h-[75vh] flex flex-col shadow-2xl border border-amber-800/30 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Terms & Conditions</h2>
            <p className="text-amber-200 text-xs md:text-sm mt-0.5">
              IMC Singing Classes Enrollment Policies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-amber-200 transition"
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          className="p-4 md:p-5 overflow-y-auto flex-1 text-sm leading-relaxed prose prose-invert max-w-none"
          onScroll={handleScroll}
        >
          <h3 className="text-lg font-bold text-amber-400 mb-4 text-center">
            Full Enrollment Policies
          </h3>

          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {fullPoliciesText}
          </pre>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/70 flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition text-sm"
          >
            Cancel
          </button>

          <button
            disabled={!scrolledToBottom}
            onClick={onAgree}
            className={`px-8 py-2 font-semibold rounded-lg transition text-sm ${
              scrolledToBottom
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {scrolledToBottom ? "I Agree" : "Scroll to agree"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SingingClassRegistration() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

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
    birth_date: "",
    start_date: "",
    fee_month_date: "",
  });

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

  const selectedBatch = useMemo(() => {
    return batches.find((b) => String(b.id) === String(form.batch));
  }, [form.batch, batches]);

  useEffect(() => {
    if (selectedBatch?.class_fee) {
      setForm((prev) => ({ ...prev, fee: selectedBatch.class_fee }));
    }
  }, [selectedBatch]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!form.batch) newErrors.batch = "Please select a batch";
    if (!form.fee || isNaN(form.fee) || Number(form.fee) <= 0)
      newErrors.fee = "Valid fee amount is required";
    return newErrors;
  };

  const createStudent = async () => {
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
      agreed_terms: true,
      payment_status: "pending",
      birth_date: form.birth_date || null,
      start_date: form.start_date || null,
      fee_month_date: form.fee_month_date || null,
    };

    const res = await axios.post(STUDENT_API, payload);
    if (res.status === 201) {
      return res.data.id || res.data.pk || res.data._id;
    }
    throw new Error("Student creation failed");
  };

  // ─── Your provided initiatePayment function ───
  const initiatePayment = async (studentId) => {
    try {
      // 🔒 Secure payload (NO amount)
      const payload = {
        registration_id: studentId,
        service: "singing_classes"
      };
      const paymentRes = await axios.post(
        PAYMENT_CREATE_API,
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const pData = paymentRes.data;
      const paymentUrl =
        pData?.payment_url ||
        pData?.payment_links?.web ||
        pData?.redirect_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      if (pData?.success === true) {
        setSuccess(true);
        return;
      }
      throw new Error("Payment initiation failed - no redirect URL");
    } catch (error) {
      console.error("Payment error:", error);
      throw new Error(
        error.response?.data?.error ||
        error.message ||
        "Payment initiation failed"
      );
    }
  };

  const handleEnrollClick = () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setShowPoliciesModal(true);
  };

  const handleAgreeAndProceed = async () => {
    setShowPoliciesModal(false);
    setLoading(true);

    try {
      const studentId = await createStudent();
      await initiatePayment(studentId);
      // Note: success is set inside initiatePayment if no redirect
    } catch (err) {
      console.error("Enrollment/Payment error:", err);
      alert(
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setShowPaymentPage(false);
    setErrors({});
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
      birth_date: "",
      start_date: "",
      fee_month_date: "",
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
            <h1
              className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-wide"
              style={{
                fontFamily: '"Algerian", "Castellar", Georgia, "Times New Roman", serif',
                textShadow: "4px 4px 16px rgba(0,0,0,0.8)",
                letterSpacing: "0.05em",
              }}
            >
              Singing Class Enrollment
            </h1>
            <p
              className="text-3xl md:text-4xl font-bold text-amber-400 mt-2 drop-shadow"
              style={{
                fontFamily: '"Algerian", "Castellar", Georgia, "Times New Roman", serif',
                textShadow: "3px 3px 12px rgba(0,0,0,0.7)",
                letterSpacing: "0.03em",
              }}
            >
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
      <section className="relative px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="sticky top-4 sm:top-20 -mt-4 lg:-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 lg:p-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 text-gray-900 flex items-center justify-center gap-4">
                  <Music className="w-10 h-10 md:w-12 md:h-12 text-amber-600" />
                  Enroll Now
                </h2>

                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl font-medium">
                    Please fill in all required fields correctly.
                  </div>
                )}

                {/* Student Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      className={`w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base ${errors.first_name ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      className={`w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base ${errors.last_name ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`w-full h-12 sm:h-13 pl-11 sm:pl-12 pr-4 sm:pr-5 bg-gray-100 rounded-xl border focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter 10-digit number"
                      />
                      <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">Email (optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* Date of Birth & Preferred Start Date - side-by-side */}
                <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={form.birth_date || ""}
                      onChange={handleChange}
                      className="w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                      Preferred Class Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date || ""}
                      onChange={handleChange}
                      className="w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mt-10 md:mt-12">
                  <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                    <MapPin className="inline w-5 h-5 mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address1"
                    placeholder="Street Address / Locality"
                    value={form.address1}
                    onChange={handleChange}
                    className="w-full h-12 sm:h-13 px-4 sm:px-5 mb-3 sm:mb-4 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                  />
                  <input
                    type="text"
                    name="address2"
                    placeholder="Apartment, building, etc."
                    value={form.address2}
                    onChange={handleChange}
                    className="w-full h-12 sm:h-13 px-4 sm:px-5 mb-3 sm:mb-4 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={form.city}
                      onChange={handleChange}
                      className="h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={form.state}
                      onChange={handleChange}
                      className="h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="PIN Code"
                      value={form.postal_code}
                      onChange={handleChange}
                      className="h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                  </div>
                </div>

                {/* Batch Selection */}
                <div className="mt-10 md:mt-12">
                  <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                    Select Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="batch"
                      value={form.batch}
                      onChange={handleChange}
                      disabled={batchesLoading}
                      className="w-full h-13 sm:h-14 px-4 sm:px-5 pr-10 sm:pr-12 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition text-gray-700 text-base"
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
                    <ChevronDown className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400 pointer-events-none" />
                  </div>

                  {selectedBatch && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 sm:mt-6 p-5 sm:p-6 bg-amber-50 border border-amber-200 rounded-2xl text-sm sm:text-base"
                    >
                      <p className="font-semibold text-amber-900 mb-3">Selected Batch Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="mt-10 md:mt-12">
                  <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                    Monthly Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="fee"
                      value={selectedBatch?.class_fee || ""}
                      readOnly
                      min="0"
                      className="w-full h-12 sm:h-13 pl-11 sm:pl-12 pr-4 sm:pr-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                    />
                  </div>
                  {selectedBatch?.class_fee && (
                    <p className="text-sm text-emerald-600 mt-2">
                      Suggested: ₹{selectedBatch.class_fee} (auto-filled from batch)
                    </p>
                  )}
                </div>

                {/* Fee Month Date */}
                <div className="mt-6 md:mt-8">
                  <label className="block text-gray-700 font-medium mb-2 md:mb-3">
                    Fee Month Date (Payment Date)
                  </label>
                  <input
                    type="date"
                    name="fee_month_date"
                    value={form.fee_month_date || ""}
                    onChange={handleChange}
                    className="w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                  />
                </div>

                {/* Reference */}
                <div className="mt-10 md:mt-12">
                  <label className="block text-gray-700 font-medium mb-2 md:mb-3">Reference By (optional)</label>
                  <input
                    type="text"
                    name="reference_by"
                    value={form.reference_by}
                    onChange={handleChange}
                    placeholder="Referred by friend, social media, etc."
                    className="w-full h-12 sm:h-13 px-4 sm:px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition text-base"
                  />
                </div>

                {/* Terms notice */}
                <div className="mt-10 md:mt-12 p-5 bg-amber-50/50 border border-amber-200 rounded-2xl text-center">
                  <p className="text-gray-700 text-base">
                    By proceeding to payment, you will need to read and accept our{" "}
                    <button
                      type="button"
                      onClick={() => setShowPoliciesModal(true)}
                      className="font-bold text-amber-700 hover:text-amber-600 underline"
                    >
                      Terms & Conditions
                    </button>
                    .
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleEnrollClick}
                  disabled={loading || batchesLoading}
                  className="mt-5 w-full max-w-[200px] mx-auto mt-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-70"
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
          <div className="lg:col-span-1 space-y-8 mt-12 lg:mt-20">
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

      {showPoliciesModal && (
        <PoliciesModal
          onClose={() => setShowPoliciesModal(false)}
          onAgree={handleAgreeAndProceed}
        />
      )}
    </div>
  );
}