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

// API Configuration
const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const SINGER_API = `${API_BASE}/auth/singer/`;
const PAYMENT_CREATE_API = `${API_BASE}/api/payments/create-payment/`;

// Policies data - complete (unchanged)
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

// Modal Component - unchanged
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
            <p className="text-amber-200 mt-1">IMC Singer Registration Policies</p>
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

export default function SingerRegistration() {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  const canSubmit = form.name.trim() && form.mobile.trim() && form.genre.trim() && form.agreed_terms;

  const handleRegistrationAndPayment = async () => {
    if (!canSubmit) {
      alert("Please fill required fields and agree to the Terms & Conditions");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "agreed_terms") return;
      if (value === "" || value === null) return;
      data.append(key, value);
    });

    data.append("active", "true");

    try {
      setLoading(true);

      // Step 1: Create singer profile
      const singerResponse = await axios.post(SINGER_API, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Singer created successfully:", singerResponse.data);

      // Step 2: Start payment
      setLoading(false);
      setPaymentLoading(true);

      const paymentPayload = {
        amount: 1000,  // Fixed as per your current button
        customer_id: `IMC_SINGER_${form.mobile.replace(/\D/g, '') || 'guest'}`,
        email: "singer@imc.com", // You can collect real email later
        phone: form.mobile,
      };

      console.log("Initiating payment with payload:", paymentPayload);

      const paymentResponse = await axios.post(PAYMENT_CREATE_API, paymentPayload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Payment initiation response:", paymentResponse.data);

      if (paymentResponse.data?.payment_links?.web) {
        // Success → redirect to payment gateway link
        window.location.href = paymentResponse.data.payment_links.web;
      } else {
        alert("Registration successful, but payment link was not received from server.");
      }
    } catch (err) {
      console.error("Registration/Payment error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status:", err.response?.status);

      let errorMsg = "Something went wrong. Please try again or contact support.";

      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data) {
        errorMsg = JSON.stringify(err.response.data);
      }

      alert(errorMsg);
    } finally {
      setLoading(false);
      setPaymentLoading(false);
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

  // Success screen (shown only if something goes wrong before redirect)
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
          <p className="text-lg text-gray-700 mb-8">
            Your profile has been created. You should be redirected to payment...
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
      {/* HERO SECTION - unchanged */}
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

      {/* MAIN CONTENT */}
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
                      Musical Education
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
                      Annual Fee(₹ per event)
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
                  <label htmlFor="terms" className="text-lg text-slate-700 select-none">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 underline transition-colors"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="font-bold text-amber-600 hover:text-amber-500 underline transition-colors"
                    >
                      Privacy Policy
                    </button>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <button
                  onClick={handleRegistrationAndPayment}
                  disabled={loading || paymentLoading || !canSubmit}
                  className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Registering...
                    </>
                  ) : paymentLoading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    "Register & Pay ₹1000"
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* RIGHT: BENEFITS PANELS - unchanged */}
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

      {/* Modal Popup */}
      {showModal && <PoliciesModal onClose={() => setShowModal(false)} />}
    </div>
  );
}