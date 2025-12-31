// src/userDashboard/studio/components/StudioList.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MapPin, Users, Zap, Star, Mic2 } from "lucide-react";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const STUDIOS_URL = `${BASE}/auth/studio-master/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

export default function StudioList({ searchTerm = "", onBook }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudios = async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await api.get(STUDIOS_URL);
        const rows = Array.isArray(resp.data)
          ? resp.data
          : resp.data?.results ?? resp.data ?? [];

        const activeStudios = rows.filter((s) => s.is_active !== false);
        setStudios(activeStudios);
      } catch (err) {
        console.error("Failed to fetch studios:", err.response?.data || err.message);
        setError("Unable to load studios. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudios();
  }, []);

  // Filter studios by search term (name or location)
  const filteredStudios = useMemo(() => {
    if (!searchTerm.trim()) return studios;

    const query = searchTerm.toLowerCase();
    return studios.filter((studio) => {
      const name = (studio.name || "").toLowerCase();
      const location = (
        studio.full_location ||
        studio.location ||
        [studio.area, studio.city, studio.state].filter(Boolean).join(" ")
      ).toLowerCase();

      return name.includes(query) || location.includes(query);
    });
  }, [studios, searchTerm]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading studios...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-medium text-lg">{error}</p>
      </div>
    );
  }

  // Empty State
  if (filteredStudios.length === 0) {
    return (
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">No Studios Found</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchTerm
            ? `No studios match "${searchTerm}". Try a different name or location.`
            : "No studios are currently available."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Find Your Perfect Studio
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Premium recording spaces with professional gear, soundproofing, and flexible booking
        </p>
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStudios.map((studio) => {
          const locationText =
            studio.full_location ||
            studio.location ||
            [studio.area, studio.city, studio.state].filter(Boolean).join(", ") ||
            "Location not specified";

          const capacityText =
            studio.capacity > 0 ? `${studio.capacity} people` : "Flexible capacity";

          const price = studio.hourly_rate
            ? Number(studio.hourly_rate).toLocaleString("en-IN")
            : "Contact for price";

          const imageUrl =
            studio.images?.[0]?.url ||
            studio.hero_image ||
            studio.cover_image ||
            "https://via.placeholder.com/400x300?text=No+Image";

          return (
            <article
              key={studio.id}
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100"
            >
              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={studio.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 shadow-xl">
                  <Star size={16} fill="white" />
                  4.9
                </div>

                {/* Instant Booking Tag */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Zap size={14} />
                  Instant Booking
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {studio.name}
                </h3>

                <p className="flex items-center gap-2 text-gray-600 mb-5">
                  <MapPin size={18} className="text-red-500" />
                  <span className="text-base">{locationText}</span>
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 font-medium text-sm flex items-center gap-2">
                    <Users size={16} />
                    {capacityText}
                  </span>
                  <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm flex items-center gap-2">
                    <Mic2 size={16} />
                    Professional Setup
                  </span>
                </div>

                {/* Price & Button */}
                <div className="flex items-end justify-between mt-8">
                  <div>
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                      ₹{price}
                    </div>
                    <div className="text-gray-500 text-sm">per hour</div>
                  </div>

                  <button
                    onClick={() => onBook && onBook(studio)}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    Book Now
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}