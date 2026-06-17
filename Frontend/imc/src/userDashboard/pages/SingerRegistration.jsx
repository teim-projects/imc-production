// SingerRegistration.jsx
// Exactly matches the SingingClassRegistration pattern:
// - Scroll‑to‑agree Policies Modal
// - Terms notice with "Terms & Conditions" link
// - Clean separation of logic (hooks + sub‑components)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Footer from "../../components/footer";
import SingerBackground from "../../assets/singerbag.webp";
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

// ----------------------------------------------------------------------
// 1. Constants & API
// ----------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const SINGER_API = `${API_BASE}/auth/singer/`;
const PAYMENT_CREATE_API = `${API_BASE}/payments/create-payment/`;
const PAYMENT_STATUS_API = `${API_BASE}/payments/check-status/`;

const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;

// ----------------------------------------------------------------------
// 2. Policies (full content – same as your original)
// ----------------------------------------------------------------------
const POLICIES = [
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
  {
    id: "C",
    title: "C. Booking, Payment & Contribution Policies",
    content: `
10. Event Booking Confirmation
• Event participation is confirmed only after receipt of the applicable contribution.
• Seats/slots are allotted on a first-paid, first-confirmed basis.

11. Contribution Structure
• Auditorium Karaoke Events – ₹1500 per solo song, ₹1000 per partner (duet)
• Live Events – ₹3000 per solo song, ₹1500 per partner (duet)

12. Payment Modes
• UPI / Bank Transfer / Online Payment Gateway
• All applicable taxes or platform charges are borne by the participant.

13. Price Variations
• Contributions may vary based on venue, artists, equipment, or event format.
• Any revisions will be communicated in advance.
    `,
  },
  {
    id: "D",
    title: "D. Cancellation, Refund & Transfer Policies",
    content: `
14. Membership Fees
• Membership fees are non-refundable and non-transferable.

15. Event Cancellation – Auditorium Events Only
• 50% refund if cancellation is informed at least 28 days prior.
• No refund within 29 days of the event.

16. Live Events
• Contributions are non-refundable once paid.

17. Transfer of Participation
• Transfer permitted only with written approval and suitability.
    `,
  },
  {
    id: "E",
    title: "E. Post-Event Policies & Deliverables",
    content: `
18. Media Sharing
• Event photo links will be shared within 3 days post-event.

19. Usage Rights
• IMC may use event media for promotion and marketing.
• Singers may share content with due credit to IMC.
    `,
  },
  {
    id: "F",
    title: "F. Code of Conduct & Common Policies",
    content: `
20. Professional Conduct
• Discipline, punctuality, and respectful behaviour are mandatory.

21. Substance Policy
• Participation under influence of alcohol or drugs is prohibited.

22. Venue Rules
• All venue-specific rules must be followed.

23. Health & Safety
• Singers are responsible for their own health.
• IMC is not liable for personal injury or loss.

24. Force Majeure
• IMC not liable for uncontrollable events.

25. Policy Updates
• Policies may be modified anytime.

26. Acceptance
• Registration or participation implies acceptance.
    `,
  },
  {
    id: "G",
    title: "G. Payment, Billing & Compliance",
    content: `
27. Payment Confirmation
• Booking confirmed only after successful payment.
• IMC not responsible for bank or gateway delays.

28. Invoices & Taxes
• Digital invoices issued.
• GST/service charges applied as per law.

29. Chargebacks & Disputes
• Unauthorized disputes may cause suspension.
• Must be reported within 7 days.
    `,
  },
  {
    id: "H",
    title: "H. Event, Media & Operations",
    content: `
30. Event Recording
• IMC may record media for documentation and memories.
• Media will not be misused.

31. Participant Media Usage
• Singers may use their own content freely.
• Credit to IMC appreciated.

32. Commercial Use
• Commercial resale requires mutual consent.
    `,
  },
  {
    id: "I",
    title: "I. Communication & Support",
    content: `
33. Official Communication
• Updates shared via WhatsApp, email, or IMC platforms.

34. Support
• Issues must be reported politely via official channels.
    `,
  },
  {
    id: "J",
    title: "J. Discipline, Safety & Responsibility",
    content: `
35. Punctuality
• Late arrivals may affect future selection.

36. Behaviour
• Misconduct may lead to removal.

37. Health & Safety
• IMC not liable for negligence or over-exertion.
    `,
  },
  {
    id: "K",
    title: "K. Event Changes & Disclaimer",
    content: `
38. Event Modifications
• IMC may reschedule or cancel events.

39. Force Majeure
• IMC not responsible for uncontrollable events.

40. Policy Updates
• Updates communicated via official channels.
    `,
  },
  {
    id: "L",
    title: "L. Final Acceptance",
    content: `
By registering, making any payment, or participating in IMC activities,
the singer confirms acceptance of all policies stated above.
    `,
  },
];

// ----------------------------------------------------------------------
// 3. Policies Modal (exactly the same as SingingClassRegistration)
// ----------------------------------------------------------------------
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

  const fullPoliciesText = POLICIES.map(
    (p) => `${p.title}\n\n${p.content.trim()}`
  ).join("\n\n──────────────────────────────\n\n");

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

// ----------------------------------------------------------------------
// 4. Custom Hooks
// ----------------------------------------------------------------------

// Form state + validation
function useSingerForm() {
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
    rate: "1000",
    gender: "",
    active: true,
    video: null,
    agreed_terms: false,
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    if (!form.name.trim()) return "Full name is required";
    if (!form.mobile.trim()) return "Mobile number is required";
    if (!form.genre.trim()) return "Genre is required";
    if (!form.video) return "Please upload a video song";
    if (!form.agreed_terms) return "You must agree to the Terms & Conditions";
    return null;
  }, [form]);

  const resetForm = useCallback(() => {
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
      rate: "1000",
      gender: "",
      active: true,
      video: null,
      agreed_terms: false,
    });
    setErrorMessage("");
  }, []);

  return { form, errorMessage, setErrorMessage, handleChange, validate, resetForm };
}

// Payment & registration logic
function useSingerPayment() {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [orderId, setOrderId] = useState(null);
  const [singerId, setSingerId] = useState(null);

  const createSinger = useCallback(async (formData) => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "agreed_terms") return;
      if (value === "" || value === null) return;
      if (key === "video" && value) {
        data.append("video", value);
      } else {
        data.append(key, value);
      }
    });
    data.append("active", "true");
    data.append("payment_method", "Online");
    data.append("payment_status", "pending");

    const res = await axios.post(SINGER_API, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const newId = res.data?.id || res.data?.data?.id;
    if (!newId) throw new Error("Singer created but no ID returned");
    setSingerId(newId);
    return newId;
  }, []);

  const initiatePayment = useCallback(async (regId) => {
    const payload = {
      registration_id: regId,
      service: "singer_registration",
    };
    const paymentRes = await axios.post(PAYMENT_CREATE_API, payload, {
      headers: { "Content-Type": "application/json" },
    });
    const pData = paymentRes.data;
    const paymentUrl =
      pData?.payment_links?.web ||
      pData?.payment_url ||
      pData?.link ||
      pData?.redirect_url;

    if (paymentUrl) {
      window.location.href = paymentUrl;
      return true;
    } else {
      const newOrderId = pData?.order_id;
      if (newOrderId) {
        setOrderId(newOrderId);
        setPaymentStatus("pending");
        setPaymentLoading(false);
        alert("Payment initiated. Please complete payment in the next window.");
        return false;
      } else {
        throw new Error("No payment URL or order ID received");
      }
    }
  }, []);

  const processRegistration = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const regId = await createSinger(formData);
        setLoading(false);
        setPaymentLoading(true);
        await initiatePayment(regId);
      } catch (err) {
        let msg = "काहीतरी चूक झाली. पुन्हा प्रयत्न करा.";
        if (err.response?.data?.error) msg = err.response.data.error;
        else if (err.response?.data?.detail) msg = err.response.data.detail;
        else if (err.message) msg = err.message;
        throw new Error(msg);
      } finally {
        setLoading(false);
        setPaymentLoading(false);
      }
    },
    [createSinger, initiatePayment]
  );

  // Poll payment status
  useEffect(() => {
    let interval;
    if (paymentStatus === "pending" || paymentStatus === "checking") {
      interval = setInterval(async () => {
        if (!orderId) return;
        try {
          const res = await axios.get(PAYMENT_STATUS_API, {
            params: { order_id: orderId },
          });
          const status = res.data?.status?.toUpperCase() || "";
          if (status === "CHARGED" || res.data?.success === true) {
            setPaymentStatus("success");
            setSuccess(true);
            clearInterval(interval);
          } else if (status === "FAILED" || status === "EXPIRED") {
            setPaymentStatus("failed");
            setSuccess(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("[POLL ERROR]", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentStatus, orderId]);

  return {
    loading,
    paymentLoading,
    success,
    paymentStatus,
    singerId,
    setSuccess,
    processRegistration,
  };
}

// ----------------------------------------------------------------------
// 5. Sub‑components (Hero, Sidebar, SuccessScreen, Form)
// ----------------------------------------------------------------------

function Hero() {
  return (
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
  );
}

function Sidebar() {
  return (
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
              <strong>Live Shows</strong>
              <br />
              <span className="text-white/80">Corporate, weddings & concerts</span>
            </div>
          </li>
          <li className="flex gap-4">
            <Mic className="w-7 h-7 text-amber-300 flex-shrink-0" />
            <div>
              <strong>Studio Recording</strong>
              <br />
              <span className="text-white/80">Professional tracks & covers</span>
            </div>
          </li>
          <li className="flex gap-4">
            <Star className="w-7 h-7 text-amber-300 flex-shrink-0" />
            <div>
              <strong>Paid Gigs</strong>
              <br />
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
  );
}

function SuccessScreen({ onReset }) {
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
            Congratulations! Your singer profile is now fully registered and active.
            <br />
            Your video song has been submitted for evaluation.
            <br />
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
            onClick={onReset}
            className="px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl shadow transition transform hover:scale-105 flex items-center justify-center gap-3"
          >
            Register Another Singer
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-12">
          Thank you for joining IMC Artist Program!
          <br />
          Secured by HDFC SmartGateway
        </p>
      </motion.div>
    </div>
  );
}

// Main Registration Form (with the exact Terms notice from the reference)
function RegistrationForm({
  form,
  errorMessage,
  onFormChange,
  onRegisterClick,
  loading,
  paymentLoading,
  onPoliciesOpen,
  canSubmit,
}) {
  return (
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

          {/* -------- All form fields (unchanged) -------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
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
                  onChange={(e) => onFormChange("birth_date", e.target.value)}
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
                onChange={(e) => onFormChange("mobile", e.target.value)}
                className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Profession
              </label>
              <input
                type="text"
                value={form.profession}
                onChange={(e) => onFormChange("profession", e.target.value)}
                className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Musical Education
              </label>
              <input
                type="text"
                value={form.education}
                onChange={(e) => onFormChange("education", e.target.value)}
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
                onChange={(e) => onFormChange("favourite_singer", e.target.value)}
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
                onChange={(e) => onFormChange("reference_by", e.target.value)}
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
                  onChange={(e) => onFormChange("genre", e.target.value)}
                  className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                >
                  <option value="" disabled>
                    Select Genre
                  </option>
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
                onChange={(e) => onFormChange("experience", e.target.value)}
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
                onChange={(e) => onFormChange("area", e.target.value)}
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
                onChange={(e) => onFormChange("city", e.target.value)}
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
                onChange={(e) => onFormChange("state", e.target.value)}
                className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Annual Fee
              </label>
              <input
                type="text"
                value={form.rate}
                onChange={(e) => onFormChange("rate", e.target.value)}
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
                  onChange={(e) => onFormChange("gender", e.target.value)}
                  className="w-full h-12 px-5 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 appearance-none transition"
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option>male</option>
                  <option>female</option>
                  <option>other</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Video Upload & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="flex flex-col">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                Upload Video Song <span className="text-red-500">*</span>
              </label>
              <label
                className={`border-2 border-dashed rounded-2xl p-6 md:p-10 text-center bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition min-h-[180px] ${
                  form.video
                    ? "border-green-400 bg-green-50/30"
                    : "border-gray-300 hover:border-amber-400"
                }`}
              >
                {form.video ? (
                  <div className="space-y-3 w-full">
                    <Music className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="font-medium text-green-800 break-words max-w-full">
                      {form.video.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(form.video.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFormChange("video", null);
                      }}
                      className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-1">
                      <span className="text-amber-600">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-sm text-gray-500">
                      MP4, MOV, WebM • Max {MAX_VIDEO_SIZE_MB}MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("video/")) {
                      alert("Please select a video file (MP4, MOV, WebM, etc.)");
                      return;
                    }
                    if (file.size > MAX_VIDEO_SIZE) {
                      alert(`Video file exceeds ${MAX_VIDEO_SIZE_MB}MB limit.`);
                      return;
                    }
                    onFormChange("video", file);
                  }}
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
                onChange={(e) => onFormChange("achievement", e.target.value)}
                className="w-full px-5 py-3 bg-gray-100 rounded-2xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none text-base"
                placeholder="Mention awards, notable performances, YouTube links, collaborations..."
              />
            </div>
          </div>

          {/* -------- TERMS NOTICE (exactly as in the reference) -------- */}
          <div className="mt-10 md:mt-12 p-5 bg-amber-50/50 border border-amber-200 rounded-2xl text-center">
            <p className="text-gray-700 text-base">
              By proceeding to payment, you will need to read and accept our{" "}
              <button
                type="button"
                onClick={onPoliciesOpen}
                className="font-bold text-amber-700 hover:text-amber-600 underline"
              >
                Terms & Conditions
              </button>
              .
            </p>
          </div>

          {/* -------- SUBMIT BUTTON (same style) -------- */}
          <button
            onClick={onRegisterClick}
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
              "Proceed to Payment"
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 6. Main Component
// ----------------------------------------------------------------------
export default function SingerRegistration() {
  // Hooks
  const { form, errorMessage, setErrorMessage, handleChange, validate, resetForm } =
    useSingerForm();
  const {
    loading,
    paymentLoading,
    success,
    setSuccess,
    processRegistration,
  } = useSingerPayment();

  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

  // Derived
  const canSubmit =
    form.name.trim() &&
    form.mobile.trim() &&
    form.genre.trim() &&
    form.video !== null &&
    form.agreed_terms;

  // Handlers
  const handleRegisterClick = useCallback(() => {
    const error = validate();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setShowPoliciesModal(true);
  }, [validate, setErrorMessage]);

  const handleAgreeAndProceed = useCallback(async () => {
    setShowPoliciesModal(false);
    try {
      await processRegistration(form);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }, [form, processRegistration, setErrorMessage]);

  const handleReset = useCallback(() => {
    resetForm();
    setSuccess(false);
  }, [resetForm, setSuccess]);

  // If success, show success screen
  if (success) {
    return <SuccessScreen onReset={handleReset} />;
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col">
      <Hero />

      <section className="relative px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <RegistrationForm
            form={form}
            errorMessage={errorMessage}
            onFormChange={handleChange}
            onRegisterClick={handleRegisterClick}
            loading={loading}
            paymentLoading={paymentLoading}
            onPoliciesOpen={() => setShowPoliciesModal(true)}
            canSubmit={canSubmit}
          />
          <Sidebar />
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