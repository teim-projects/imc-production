import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Home,
  IndianRupee,
  User,
  Sparkles,
  Calendar,
  CreditCard,
} from "lucide-react";

const API_BASE = "http://localhost:8000"; // ← use env variable in production

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id") || searchParams.get("OrderId");

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing from URL");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/payments/check_status/`, {
          params: { order_id: orderId },
        });

        setPaymentData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Payment verification failed:", err);
        setError(
          err.response?.data?.message ||
            "Failed to verify payment status. Please contact support."
        );
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const apiData = paymentData?.data || paymentData || {};

  const isSuccess =
    paymentData?.gateway_status === "CHARGED" ||
    paymentData?.success === true ||
    apiData?.status === "CHARGED";

  const displayAmount = () => {
    const raw =
      apiData.amount ||
      apiData.effective_amount ||
      apiData.net_amount ||
      apiData.txnx_amount ||
      0;
    return Number(raw).toLocaleString("en-IN");
  };

  const formatDate = () => {
    const dateStr =
      apiData["last-updated"] ||
      apiData.date_updated ||
      apiData["date-created"];
    return dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-cream-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-amber-700" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-amber-800">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error || !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-red-800 mb-4">Payment Failed</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {error || "We couldn't process your transaction."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold rounded-xl shadow-lg transition-all text-base"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-cream-50 flex items-center justify-center px-4 py-6 sm:py-8">
      <div
        className="relative bg-gradient-to-b from-cream-50 to-amber-50/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-sm sm:max-w-md w-full border border-amber-200/40"
        style={{
          background: "linear-gradient(135deg, rgba(255,251,235,0.95), rgba(255,245,220,0.90))",
        }}
      >
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-amber-300/5 via-yellow-300/5 to-amber-300/5 animate-gradient-x"></div>

        <div className="relative z-10 text-center space-y-5">

          {/* Success icon */}
          <div className="relative inline-flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center shadow-md ring-4 ring-amber-200/30">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 bg-clip-text text-transparent">
            Payment Successful!
          </h1>

          <div className="flex items-center justify-center gap-2 my-5">
            <IndianRupee className="w-8 h-8 text-amber-800" strokeWidth={2.5} />
            <span className="text-5xl sm:text-6xl font-black text-amber-900 tracking-tighter">
              {displayAmount()}
            </span>
          </div>

          {/* Greeting pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full border border-amber-300 shadow-sm mx-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-800" />
            </div>
            <span className="font-bold text-amber-900 text-sm">
              {apiData.customer_name || apiData.customer_email?.split("@")[0] || "Thank You!"}
            </span>
          </div>

          {/* Blue-themed detail cards (4 small cards) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/90 rounded-lg p-3 border border-blue-200 shadow-sm flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-700 text-xs font-medium">Order ID</p>
                <p className="font-mono font-semibold text-blue-900 text-xs break-all">{orderId}</p>
              </div>
            </div>

            <div className="bg-white/90 rounded-lg p-3 border border-blue-200 shadow-sm flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-700 text-xs font-medium">Date</p>
                <p className="font-semibold text-blue-900 text-xs">{formatDate()}</p>
              </div>
            </div>

            <div className="bg-white/90 rounded-lg p-3 border border-blue-200 shadow-sm flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-700 text-xs font-medium">Method</p>
                <p className="font-semibold text-blue-900 text-xs">{apiData.payment_method || "UPI / Card"}</p>
              </div>
            </div>

            <div className="bg-white/90 rounded-lg p-3 border border-blue-200 shadow-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-700 text-xs font-medium">Status</p>
                <p className="font-bold text-green-600 text-sm">Success ✓</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:via-yellow-700 hover:to-amber-800 text-white font-medium rounded-xl shadow-md transition-all hover:shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Dashboard
            </button>

            <button
              onClick={() => navigate("/my-registrations")}
              className="flex-1 py-3 bg-white border-2 border-amber-600 text-amber-800 font-medium rounded-xl hover:bg-amber-50 transition-all hover:shadow-md text-sm flex items-center justify-center gap-2"
            >
              My Registrations
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="text-xs text-amber-800 pt-3">
            Receipt sent to email & mobile
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes gradient-x {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 16s ease infinite;
        }
      `}</style>
    </div>
  );
}