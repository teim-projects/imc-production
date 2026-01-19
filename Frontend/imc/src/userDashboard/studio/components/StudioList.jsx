// src/userDashboard/studio/components/StudioList.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MapPin, Users, Zap, Star, Mic2 } from "lucide-react";

const BASE =
  import.meta.env.VITE_BASE_API_URL || "https://www.imcpune.in/api";

const STUDIOS_URL = `${BASE}/auth/studio-master/`;

// 🔴 IMPORTANT: PLAIN AXIOS (NO INTERCEPTOR, NO TOKEN)
const publicApi = axios.create({
  timeout: 15000,
});

export default function StudioList({ searchTerm = "", onBook }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH STUDIOS =================
  useEffect(() => {
    let mounted = true;

    const fetchStudios = async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ SAME API, BUT NO AUTH HEADER
        const resp = await publicApi.get(STUDIOS_URL);
        console.log("Studio API Response:", resp.data);

        const rows = Array.isArray(resp.data?.results)
          ? resp.data.results
          : [];

        const activeStudios = rows.filter(
          (s) => s.is_active === true || s.is_active === 1
        );

        if (mounted) {
          setStudios(activeStudios);
        }
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
    return () => {
      mounted = false;
    };
  }, []);

  // ================= SEARCH FILTER =================
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

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // ================= ERROR =================
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-medium text-lg">{error}</p>
      </div>
    );
  }

  // ================= EMPTY =================
  if (filteredStudios.length === 0) {
    return (
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          No Studios Found
        </h2>
        <p className="text-gray-600">
          No studios are currently available.
        </p>
      </section>
    );
  }

  // ================= UI =================
  return (
    <section className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStudios.map((studio) => {
          const imageUrl =
            studio.images?.[0]?.url?.replace("http://", "https://") ||
            "https://via.placeholder.com/400x300?text=No+Image";

          return (
            <article
              key={studio.id}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="relative h-64">
                <img
                  src={imageUrl}
                  alt={studio.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{studio.name}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin size={16} /> {studio.full_location}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold text-orange-600">
                    ₹{studio.hourly_rate}
                  </span>
                  <button
                    onClick={() => onBook?.(studio)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                  >
                    Book Now
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
