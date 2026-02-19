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
} from "lucide-react";

const API_BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";

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
        const res = await axios.get(`${API_BASE}/api/payments/status/`, {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-14 h-14 animate-spin text-emerald-600" />
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-emerald-700">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error || !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center border border-rose-100">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-rose-800 mb-4">Payment Failed</h2>
          <p className="text-gray-700 mb-8 leading-relaxed">{error || "We couldn't process your transaction"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold rounded-2xl shadow-lg transition-all text-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-8">
      <div
        className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-white/50"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.85), rgba(240,255,245,0.7))",
        }}
      >
        {/* Subtle animated border */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-transparent bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 animate-gradient-x"></div>

        <div className="relative z-10 text-center space-y-6 sm:space-y-7">

          {/* Success icon */}
          <div className="relative inline-flex justify-center mb-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl ring-8 ring-emerald-100/60">
              <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
            </div>
            <Sparkles className="absolute -top-3 -right-1 w-10 h-10 text-yellow-300 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-700 via-teal-600 to-teal-700 bg-clip-text text-transparent tracking-tight">
            Payment Confirmed
          </h1>

          {/* Amount - responsive scaling */}
          <div className="flex items-center justify-center gap-2.5 my-6 sm:my-8">
            <IndianRupee className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" strokeWidth={2.5} />
            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-emerald-900 tracking-tighter drop-shadow">
              {displayAmount()}
            </span>
          </div>

          {/* User greeting pill */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/70 rounded-full border border-emerald-100 shadow-sm mx-auto">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="font-semibold text-gray-800 text-base sm:text-lg">
              {apiData.customer_name || apiData.customer_email?.split("@")[0] || "Welcome back"}
            </span>
          </div>

          {/* Details grid – becomes stacked on very small screens */}
          <div className="bg-white/60 rounded-2xl p-5 sm:p-6 text-sm sm:text-base border border-white/70 shadow-inner">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:gap-y-5 text-left">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Order</p>
                <p className="font-mono font-semibold text-gray-900 break-all">{orderId}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Method</p>
                <p className="font-semibold text-gray-900">{apiData.payment_method || "UPI / Card"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Date</p>
                <p className="font-semibold text-gray-900">{formatDate()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Status</p>
                <p className="font-bold text-emerald-600 text-base sm:text-lg">Success ✓</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-3 sm:pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg transition-all hover:shadow-xl text-base sm:text-lg flex items-center justify-center gap-2.5"
            >
              <Home size={18} />
              Dashboard
            </button>

            <button
              onClick={() => navigate("/my-registrations")}
              className="flex-1 py-4 bg-white border-2 border-emerald-600/80 text-emerald-700 font-semibold rounded-2xl hover:bg-emerald-50 transition-all hover:shadow-md text-base sm:text-lg flex items-center justify-center gap-2.5"
            >
              My Registrations
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 pt-3">
            Confirmation sent to your registered email & mobile
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
          animation: gradient-x 14s ease infinite;
        }
      `}</style>
    </div>
  );
}