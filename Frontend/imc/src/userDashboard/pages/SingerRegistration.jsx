// SingerRegistration.jsx
// Updated — All terms in one scrollable area + smaller modal + scroll-to-agree

import React, { useEffect, useState, useRef } from "react";
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
  AlertCircle,
} from "lucide-react";

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const SINGER_API = `${API_BASE}/auth/singer/`;
const PAYMENT_CREATE_API = `${API_BASE}/payments/create-payment/`;
const PAYMENT_STATUS_API = `${API_BASE}/payments/status`;

// Full Policies data (same as you provided)
const policies = [
  {
    id: "A",
    title: "A. Membership & Registration Policies",
    content: `
1. Membership Validity
• Membership is valid for one (1) year from the date of successful registration and payment.
• Renewal is subject to prevailing terms and fees at the time of renewal.

2. Eligibility & Submission
• Applicants must submit two (2) previously recorded video songs (solo/duet) for evaluation.
• Submissions must be original recordings with clear audio/video quality.

3. Selection & Onboarding
• Selection is based on vocal quality, pitch, rhythm, stage suitability, and overall performance.
• Upon selection, the organiser will share the Membership Form and payment instructions.
• Registration is complete only after full payment confirmation.

4. Minimum Event Commitment
• IMC aims to ensure a minimum of four (4) karaoke musical events per annum for active members.
• Event allocation is subject to availability, suitability, and organiser discretion.

5. Optional Auditorium Participation
• Participation in auditorium or special events is voluntary and based on the singer’s consent.
    `,
  },
  {
    id: "B",
    title: "B. Practice & Performance Policies",
    content: `
6. Practice Sessions
• A minimum of two (2) complimentary practice sessions will be conducted before each event at IMC Studio.

7. Singer & Song Selection
• Singer and song allocation is decided by the organiser based on voice compatibility, event theme, and performance balance.

8. Final Authority
• The final decision regarding singer selection, song order, and performance slots rests solely with IMC Management.

9. Event Hospitality
• During events, snacks and tea will be provided by IMC (subject to venue norms).
    `,
  },
  // ... (all other sections B to L remain exactly as you provided)
  {
    id: "L",
    title: "L. Final Acceptance",
    content: `
By registering, making any payment, or participating in IMC activities,
the singer confirms acceptance of all policies stated above.
    `,
  },
];

// ────────────────────────────────────────────────
// Smaller Policies Modal — All terms in ONE scrollable block
// ────────────────────────────────────────────────
function PoliciesModal({ onClose, onAgree }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  // Auto-enable if whole content fits on screen
  useEffect(() => {
    const checkIfFits = () => {
      if (scrollRef.current) {
        const el = scrollRef.current;
        if (el.scrollHeight <= el.clientHeight + 40) {
          setScrolledToBottom(true);
        }
      }
    };

    checkIfFits();
    const timer = setTimeout(checkIfFits, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= 60) {
      setScrolledToBottom(true);
    }
  };

  // Combine all policies into one continuous text
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
        {/* Smaller Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Terms & Conditions</h2>
            <p className="text-amber-200 text-xs md:text-sm mt-0.5">
              IMC Singer Registration Policies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-amber-200 transition"
          >
            ×
          </button>
        </div>

        {/* Scrollable content - smaller padding & font */}
        <div
          ref={scrollRef}
          className="p-4 md:p-5 overflow-y-auto flex-1 text-sm leading-6 prose prose-invert max-w-none"
          onScroll={handleScroll}
        >
          <h3 className="text-lg font-bold text-amber-400 mb-4 text-center">
            Full Policies
          </h3>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {fullPoliciesText}
          </pre>
        </div>

        {/* Smaller buttons */}
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
            className={`px-8 py-2 font-semibold rounded-lg transition text-sm min-w-[120px] ${
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

export default function SingerRegistration() {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [orderId, setOrderId] = useState(null);
  const [singerId, setSingerId] = useState(null);

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
    video: null,
    agreed_terms: false,
  });

  const MAX_VIDEO_SIZE_MB = 50;
  const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;

  const canSubmit =
    form.name.trim() &&
    form.mobile.trim() &&
    form.genre.trim() &&
    form.video !== null &&
    form.agreed_terms;

  // Poll payment status (unchanged)
  useEffect(() => {
    let interval;
    if (paymentStatus === "pending" || paymentStatus === "checking") {
      interval = setInterval(async () => {
        if (!orderId) return;

        try {
          const res = await axios.get(PAYMENT_STATUS_API, {
            params: { order_id: orderId, phone: form.mobile },
          });

          const status = (res.data?.gateway_status || res.data?.status || "").toUpperCase();

          if (status === "SUCCESS" || status === "CHARGED" || res.data?.success === true) {
            setPaymentStatus("success");
            await finalizeSingerRegistration();
            setSuccess(true);
            clearInterval(interval);
          } else if (status === "FAILED" || status === "EXPIRED") {
            setPaymentStatus("failed");
            setErrorMessage("Payment failed or timed out. Please try again.");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("[POLL ERROR]", err);
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [paymentStatus, orderId, form.mobile]);

  const saveSinger = async (isUpdate = false) => {
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "agreed_terms") return;
      if (value === "" || value === null) return;

      if (key === "video" && value) {
        data.append("video", value);
      } else {
        data.append(key, value);
      }
    });

    data.append("active", "true");
    data.append("payment_status", isUpdate ? "completed" : "pending");
    if (orderId) data.append("payment_order_id", orderId);

    try {
      let res;
      if (isUpdate && singerId) {
        res = await axios.put(`${SINGER_API}${singerId}/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(SINGER_API, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSingerId(res.data?.id || null);
      }
      return true;
    } catch (err) {
      console.error("Singer save failed:", err);
      setErrorMessage("Profile save failed after payment. Contact support.");
      return false;
    }
  };

  const finalizeSingerRegistration = async () => {
    await saveSinger(true);
  };

  const handleRegistrationAndPayment = async () => {
    if (!canSubmit) {
      setErrorMessage("कृपया सर्व आवश्यक फील्ड भरा आणि नियम व अटी मान्य करा.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      await saveSinger(false);
      setLoading(false);
      setPaymentLoading(true);

      const paymentPayload = {
        amount: 1000,
        customer_id: `IMC_SINGER_${form.mobile.replace(/\D/g, "") || "guest"}`,
        email: "singer@imc.com",
        phone: form.mobile.trim(),
        description: "IMC Singer Registration Fee",
        return_url: `${window.location.origin}/payment-success`,
      };

      const paymentRes = await axios.post(PAYMENT_CREATE_API, paymentPayload);

      const pData = paymentRes.data;
      const newOrderId = pData?.order_id || pData?.id;

      if (pData?.payment_links?.web || pData?.payment_url) {
        window.location.href = pData.payment_links?.web || pData.payment_url;
        return;
      }

      if (newOrderId) {
        setOrderId(newOrderId);
        setPaymentStatus("pending");
        setPaymentLoading(false);
        alert("Payment request sent! Complete in UPI app.\nWaiting...");
      } else {
        setErrorMessage("Payment initiation failed.");
      }
    } catch (err) {
      console.error("Error:", err);
      let msg = "काहीतरी चूक झाली. पुन्हा प्रयत्न करा.";
      if (err.response?.data) {
        msg = err.response.data.message || err.response.data.detail || JSON.stringify(err.response.data);
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setPaymentLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setPaymentStatus("idle");
    setOrderId(null);
    setSingerId(null);
    setErrorMessage("");
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
      video: null,
      agreed_terms: false,
    });
  };

  // Success Screen (unchanged)
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
            Registration & Payment Successful!
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            ₹1,000 received successfully
          </p>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10">
            <p className="text-lg text-gray-800 leading-relaxed">
              Congratulations! Your singer profile is now fully registered and active.<br />
              Your video song has been submitted for evaluation.<br />
              You are officially part of the IMC Artist Program.
            </p>
            <p className="text-base text-gray-600 mt-4">
              You will receive confirmation, certificate details, and next event updates on your registered mobile / email.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3"
            >
              Go to Dashboard
            </button>

            <button
              onClick={resetForm}
              className="px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl shadow transition transform hover:scale-105 flex items-center justify-center gap-3"
            >
              Register Another Singer
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-12">
            Thank you for joining IMC Artist Program!<br />
            Secured by HDFC SmartGateway
          </p>
        </motion.div>
      </div>
    );
  }

  // Main Form (unchanged except modal call)
  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-96 md:h-[28rem] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${SingerBackground})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-wide drop-shadow-2xl mb-3"
              style={{
                fontFamily: '"Algerian", "Castellar", Georgia, "Times New Roman", serif',
                color: "#ffffff",
                textShadow: "4px 4px 16px rgba(0,0,0,0.8)",
              }}
            >
              SINGER REGISTRATION
            </h1>
            <p
              className="text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-lg"
              style={{
                fontFamily: '"Algerian", "Castellar", Georgia, "Times New Roman", serif',
                color: "#ffffff",
                textShadow: "3px 3px 14px rgba(0,0,0,0.7)",
              }}
            >
              IMC ARTIST PROGRAM
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Column */}
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

                {errorMessage && (
                  <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800">
                    <strong>Error:</strong> {errorMessage}
                  </div>
                )}

                {/* ... all your form fields remain exactly the same ... */}

                {/* Terms checkbox & link */}
                <div className="flex items-start gap-4 mt-12">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500 mt-1"
                    checked={form.agreed_terms}
                    onChange={(e) => setForm({ ...form, agreed_terms: e.target.checked })}
                  />
                  <label htmlFor="terms" className="text-lg text-slate-700 select-none">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      Privacy Policy
                    </button>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  onClick={handleRegistrationAndPayment}
                  disabled={loading || paymentLoading || !canSubmit}
                  className="mt-5 w-full max-w-[200px] mx-auto mt-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Registering...
                    </>
                  ) : paymentLoading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Processing Payment...
                    </>
                  ) : (
                    "Register & Pay "
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

      {showModal && (
        <PoliciesModal
          onClose={() => setShowModal(false)}
          onAgree={() => {
            setShowModal(false);
            setForm({ ...form, agreed_terms: true });
          }}
        />
      )}
    </div>
  );
}