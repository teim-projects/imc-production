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

const API_BASE = "https://www.imcpune.in";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId =
    searchParams.get("order_id") ||
    searchParams.get("OrderId") ||
    searchParams.get("id") ||
    searchParams.get("OrderID");

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing from URL. Please try again or contact support.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/payments/check-status/`, {
          params: { order_id: orderId },
        });

        setPaymentData(res.data);
        
        // ← Debug: open browser console (F12) to see exact backend response
        console.log("Backend Payment Response:", res.data);
        console.log("All keys in response:", Object.keys(res.data).join(", "));

        setLoading(false);
      } catch (err) {
        console.error("Payment verification failed:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to verify payment. Please contact support.";
        setError(errorMsg);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const apiData = paymentData?.data || paymentData || {};

  const isSuccess =
    apiData.status === "CHARGED" ||
    apiData.gateway_status === "CHARGED" ||
    apiData.success === true ||
    apiData.payment_status === "success" ||
    apiData.status?.toUpperCase() === "SUCCESS";

  // Super flexible amount extraction
  const getRawAmount = () => {
    if (!apiData) return 0;

    // Direct top-level keys (most common)
    let raw =
      apiData.amount ||
      apiData.order_amount ||
      apiData.paid_amount ||
      apiData.transaction_amount ||
      apiData.amount_paid ||
      apiData.total_amount ||
      apiData.effective_amount ||
      apiData.net_amount ||
      apiData.txn_amount ||
      apiData.cf_order_amount ||
      apiData.real_amount ||
      apiData.pay_amount ||
      apiData.final_amount ||
      0;

    // Nested common structures
    if (raw === 0) {
      if (apiData.order) {
        raw =
          apiData.order.amount ||
          apiData.order.order_amount ||
          apiData.order.paid_amount ||
          apiData.order.total_amount ||
          apiData.order.amount_paid ||
          0;
      }
      if (apiData.payment) {
        raw = apiData.payment.amount || apiData.payment.paid_amount || 0;
      }
      if (apiData.transaction) {
        raw = apiData.transaction.amount || 0;
      }
      if (apiData.data) {
        raw = apiData.data.amount || apiData.data.order_amount || 0;
      }
    }

    // Last resort: search any key containing "amount"
    if (raw === 0) {
      for (const key in apiData) {
        if (typeof apiData[key] === "number" && key.toLowerCase().includes("amount")) {
          raw = apiData[key];
          break;
        }
      }
    }

    return raw;
  };

  const displayAmount = () => {
    const raw = getRawAmount();
    const num = Number(raw);

    if (isNaN(num) || num <= 0) {
      return "Free";
    }

    return num.toLocaleString("en-IN");
  };

  const showRupee = () => {
    const raw = getRawAmount();
    const num = Number(raw);
    return !isNaN(num) && num > 0;
  };

  const formatDate = () => {
    const dateStr =
      apiData.date_updated ||
      apiData["date-updated"] ||
      apiData["last-updated"] ||
      apiData.date_created ||
      apiData["date-created"] ||
      apiData.created_at ||
      apiData.payment_date;

    return dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <Loader2 className="w-14 h-14 animate-spin text-amber-700" />
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-amber-800">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center border border-red-100">
          <AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-red-800 mb-4">Payment Failed</h2>
          <p className="text-gray-700 mb-8 leading-relaxed">{error || "Transaction could not be verified."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold rounded-xl shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 max-w-md sm:max-w-lg w-full border border-amber-200/60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-yellow-100/20 to-amber-50/10 pointer-events-none" />

        <div className="relative z-10 text-center space-y-6">
          <div className="relative inline-flex justify-center mb-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg ring-8 ring-amber-200/40">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 bg-clip-text text-transparent">
            Payment Successful!
          </h1>

          <div className="flex items-center justify-center gap-3 my-6">
            {showRupee() && (
              <IndianRupee className="w-10 h-10 text-amber-800" strokeWidth={2.5} />
            )}
            <span className="text-5xl sm:text-6xl font-black text-amber-900 tracking-tight">
              {displayAmount()}
            </span>
          </div>

          {/* Greeting pill */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/80 rounded-full border border-amber-300 shadow-sm mx-auto">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-800" />
            </div>
            <span className="font-bold text-amber-900">
              {apiData.customer_name || apiData.customer_email?.split("@")[0] || "Thank You!"}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5 mt-6">
            <DetailCard icon={CreditCard} label="Order ID" value={orderId} isMono />
            <DetailCard icon={Calendar} label="Date" value={formatDate()} />
            <DetailCard
              icon={CreditCard}
              label="Method"
              value={apiData.payment_method || apiData.gateway || apiData.mode || "UPI / Card"}
            />
            <DetailCard
              icon={CheckCircle}
              label="Status"
              value="Success ✓"
              color="text-green-600"
              bold
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 hover:brightness-110 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Go to Dashboard
            </button>

            <button
              onClick={() => navigate("/my-registrations")}
              className="flex-1 py-4 border-2 border-amber-600 text-amber-800 font-semibold rounded-xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
            >
              My Registrations
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="text-sm text-amber-800/80 pt-4">
            Receipt has been sent to your email & registered mobile
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value, isMono = false, color = "", bold = false }) {
  return (
    <div className="bg-white/80 rounded-xl p-4 border border-blue-100 shadow-sm flex items-start gap-3">
      <Icon className={`w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0 ${color}`} />
      <div className="text-left">
        <p className="text-blue-700 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p
          className={`text-blue-900 text-sm ${isMono ? "font-mono break-all" : ""} ${
            bold ? "font-bold" : "font-semibold"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}