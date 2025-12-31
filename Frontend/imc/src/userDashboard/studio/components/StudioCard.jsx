import React from "react";
import { Star, MapPin, Zap, Users, Mic2, Headphones, Clock } from "lucide-react";

export default function StudioCard({ studio }) {
  return (
    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT: Image */}
        <div className="relative w-full lg:w-[400px] flex-shrink-0">
          <img
            src={studio.image}
            alt={studio.name}
            className="w-full h-[280px] lg:h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Rating Badge */}
          <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-2xl">
            <Star size={16} fill="white" className="text-white" />
            {studio.rating || "4.9"}
          </div>

          {/* Instant Booking Tag */}
          {studio.instant && (
            <div className="absolute top-6 left-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Zap size={14} />
              Instant Booking
            </div>
          )}
        </div>

        {/* CENTER: Info */}
        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Title & Location */}
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              {studio.name}
            </h2>

            <p className="flex items-center gap-2 text-gray-600 text-lg mb-6">
              <MapPin size={18} className="text-red-500" />
              <span>{studio.location}</span>
            </p>

            {/* Capacity & Tags */}
            <div className="flex flex-wrap gap-4 mb-8">
              <span className="px-5 py-2 rounded-full bg-purple-50 text-purple-700 font-semibold text-sm flex items-center gap-2 shadow-sm">
                <Users size={16} />
                Up to {studio.capacity} people
              </span>

              {studio.type && (
                <span className="px-5 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm flex items-center gap-2 shadow-sm">
                  {studio.type === "vocal" ? <Headphones size={16} /> : <Mic2 size={16} />}
                  {studio.type === "vocal" ? "Vocal Booth" : "Full Band Setup"}
                </span>
              )}
            </div>

            {/* Features List */}
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Professional sound-treated acoustics
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Premium microphones & preamps
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                High-end monitoring & mixing console
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <Clock size={16} className="text-orange-600" /> Flexible hourly slots
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Price & CTA */}
        <div className="p-8 lg:p-10 flex flex-col justify-between items-end bg-gradient-to-b from-gray-50 to-white lg:border-l border-gray-200">
          <div className="text-right mb-8">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              ₹{studio.price.toLocaleString()}
            </div>
            <div className="text-gray-500 text-sm mt-1">per hour</div>
            {studio.originalPrice && (
              <div className="text-gray-400 text-sm line-through mt-1">
                ₹{studio.originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          <button className="px-10 py-4 rounded-full bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3">
            Book Now
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}