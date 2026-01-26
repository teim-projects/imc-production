// src/userDashboard/studio/components/StudioList.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MapPin, Users } from "lucide-react";

const BASE = import.meta.env.VITE_BASE_API_URL || "https://www.imcpune.in/api";

const STUDIOS_URL = `${BASE}/auth/studio-master/`;

// Public API – no auth needed
const publicApi = axios.create({
  timeout: 15000,
});

export default function StudioList({
  searchTerm = "",
  priceRange = "",
  locationFilter = "",
  onBook,
}) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch studios
  useEffect(() => {
    let mounted = true;

    const fetchStudios = async () => {
      setLoading(true);
      setError("");

      try {
        const resp = await publicApi.get(STUDIOS_URL);
        console.log("Studio API Response:", resp.data);

        const rows = Array.isArray(resp.data?.results)
          ? resp.data.results
          : Array.isArray(resp.data)
          ? resp.data
          : [];

        const activeStudios = rows.filter(
          (s) => s.is_active === true || s.is_active === 1
        );

        if (mounted) setStudios(activeStudios);
      } catch (err) {
        console.error("Failed to fetch studios:", err);
        if (mounted) {
          setError("Unable to load studios. Please try again later.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStudios();
    return () => { mounted = false; };
  }, []);

  // Filtering logic
  const filteredStudios = useMemo(() => {
    let result = [...studios];

    // 1. Search by name or location
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const loc = (
          s.full_location ||
          s.location ||
          [s.area, s.city, s.state]
            .filter(Boolean)
            .join(", ")
        ).toLowerCase();
        return name.includes(query) || loc.includes(query);
      });
    }

    // 2. Price range filter – FIXED: using 's' instead of 'studio'
    if (priceRange) {
      result = result.filter((s) => {
        const rate = Number(s.hourly_rate || 0);

        if (priceRange === "0-500") return rate <= 500;
        if (priceRange === "500-1000") return rate > 500 && rate <= 1000;
        if (priceRange === "1000-2000") return rate > 1000 && rate <= 2000;
        if (priceRange === "2000+") return rate > 2000;
        return true;
      });
    }

    // 3. Location filter
    if (locationFilter.trim()) {
      const locQuery = locationFilter.toLowerCase().trim();
      result = result.filter((s) => {
        const loc = (
          s.full_location ||
          s.location ||
          [s.area, s.city, s.state, s.pincode]
            .filter(Boolean)
            .join(" ")
        ).toLowerCase();
        return loc.includes(locQuery);
      });
    }

    return result;
  }, [studios, searchTerm, priceRange, locationFilter]);

  // Loading UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-lg font-medium text-gray-700">Loading premium studios...</p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-xl font-semibold text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No results
  if (filteredStudios.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">No Studios Found</h2>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          Try adjusting your search term, price range or location.
        </p>
      </div>
    );
  }

  // Render list
  return (
    <section className="py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {filteredStudios.map((s) => {
          const imageUrl =
            s.images?.[0]?.url?.replace("http://", "https://") ||
            s.image ||
            "https://via.placeholder.com/500x320?text=Studio";

          const locationText =
            s.full_location ||
            [s.area, s.city, s.state]
              .filter(Boolean)
              .join(", ") ||
            "Location not specified";

          return (
            <div
              key={s.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={s.name || "Music Studio"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/500x320?text=Image+Not+Found";
                  }}
                />

                {s.is_featured && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg animate-pulse">
                    Featured
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {s.name}
                </h3>

                <p className="text-gray-600 flex items-center gap-2 text-sm mb-4">
                  <MapPin size={16} className="text-orange-500" />
                  <span className="line-clamp-1">{locationText}</span>
                </p>

                {/* Price + Button */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-2xl font-extrabold text-orange-600">
                      ₹{Number(s.hourly_rate || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 font-medium"> / hr</span>
                  </div>

                  <button
                    onClick={() => onBook?.(s)}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    Book Now
                  </button>
                </div>

                {s.capacity && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-gray-500" />
                    Capacity: <span className="font-medium">{s.capacity} pax</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}