import React from "react";
import { Star, MapPin, Users, Mic2, Headphones, Clock, Zap } from "lucide-react";

export default function StudioCard({ studio }) {
  return (
    <div
      className={`
        group relative bg-white rounded-3xl overflow-hidden
        border border-gray-100 shadow-xl hover:shadow-2xl
        transition-all duration-500 ease-out
        hover:-translate-y-3 hover:border-orange-200/70
      `}
    >
      <div className="flex flex-col lg:flex-row h-full min-h-[480px] lg:min-h-[420px]">

        {/* ===== LEFT: Image Section ===== */}
        <div className="relative w-full lg:w-5/12 flex-shrink-0 overflow-hidden">
          <img
            src={studio.image}
            alt={studio.name}
            className="w-full h-80 lg:h-full object-cover transition-transform duration-700 
                       group-hover:scale-105 group-hover:rotate-[0.8deg]"
          />

          {/* Badges */}
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start gap-3">
            {studio.instant && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white 
                              px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Zap size={15} className="fill-white/80" />
                Instant
              </div>
            )}

            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white 
                            px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl ml-auto">
              <Star size={16} fill="white" className="text-white" />
              {studio.rating || "4.9"}
            </div>
          </div>
        </div>

        {/* ===== MIDDLE: Main Content ===== */}
        <div className="flex-1 p-7 lg:p-9 flex flex-col">
          {/* Title & Location */}
          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight mb-2.5">
              {studio.name}
            </h2>
            <p className="flex items-center gap-2 text-gray-600 text-base lg:text-lg">
              <MapPin size={18} className="text-red-500 flex-shrink-0" />
              {studio.location}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-7">
            <div className="px-4 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold flex items-center gap-2 shadow-sm">
              <Users size={15} />
              Up to {studio.capacity}
            </div>

            {studio.type && (
              <div className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm">
                {studio.type === "vocal" ? (
                  <Headphones size={15} />
                ) : (
                  <Mic2 size={15} />
                )}
                {studio.type === "vocal" ? "Vocal Booth" : "Band Room"}
              </div>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-2.5 text-gray-700 text-[15px] lg:text-base mb-auto">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0" />
              Professional acoustic treatment
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0" />
              Premium mics & preamps
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0" />
              High-end monitors & console
            </li>
            <li className="flex items-center gap-3">
              <Clock size={15} className="text-orange-600 flex-shrink-0" />
              Flexible hourly bookings
            </li>
          </ul>
        </div>

        {/* ===== RIGHT: Pricing & CTA ===== */}
        <div
          className="p-7 lg:p-9 lg:w-80 xl:w-96 flex flex-col justify-between items-center lg:items-end
                     bg-gradient-to-b from-gray-50/80 to-white border-t lg:border-t-0 lg:border-l border-gray-100"
        >
          <div className="text-center lg:text-right w-full">
            <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              ₹{studio.price?.toLocaleString() || "2,499"}
            </div>
            <div className="text-gray-500 text-sm mt-1 font-medium">per hour</div>

            {studio.originalPrice && (
              <div className="text-gray-400 text-sm line-through mt-1">
                ₹{studio.originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          <button
            className="mt-8 lg:mt-0 w-full lg:w-auto px-10 py-4 rounded-2xl
                       bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700
                       text-white font-bold text-lg shadow-xl hover:shadow-2xl
                       transform transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]
                       flex items-center justify-center gap-3"
          >
            Book Now
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}