// src/userDashboard/Forms/Singer.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
} from "react-icons/fa";

const BASE = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${BASE}/user/singer/`;

const COLORS = {
  cream: "#FFF7DF",
  navy: "#0B2545",
  yellow: "#FFD447",
  orange: "#FF7A3C",
};

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default function SingerPage() {
  const [singers, setSingers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSingers();
  }, []);

  const loadSingers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(API_URL);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setSingers(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load singers."
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = singers.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.display_name?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="min-h-screen px-4 pb-16 pt-6"
      style={{ backgroundColor: COLORS.cream }}
    >
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-sm border mb-3"
              style={{
                backgroundColor: "rgba(11,37,69,0.06)",
                borderColor: "rgba(11,37,69,0.12)",
                color: COLORS.navy,
              }}
            >
              <span className="text-xl">🎤</span>
              <span className="text-xs font-semibold tracking-wide">
                Singer directory
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
              style={{ color: COLORS.navy }}
            >
              Available
              <span className="ml-2" style={{ color: COLORS.orange }}>
                Singers
              </span>
            </h1>
            <p className="text-sm md:text-base mt-2 max-w-xl text-[#4B5563]">
              Browse singers, view their genre and base fees. This page is
              view-only – booking is handled separately by the IMC team.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold shadow-sm self-start"
            style={{
              borderColor: COLORS.navy,
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: "rgba(11,37,69,0.06)",
              color: COLORS.navy,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            Read-only — managed by Admin
          </div>
        </header>

        {/* SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">
              <FaSearch />
            </span>
            <input
              className="w-full rounded-full border px-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: "#E5E7EB",
                backgroundColor: "rgba(255,255,255,0.9)",
              }}
              placeholder="Search by name, genre, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#4B5563]">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border"
              style={{
                borderColor: "#E5E7EB",
                backgroundColor: "rgba(255,255,255,0.9)",
              }}
            >
              <FaUser style={{ color: COLORS.navy }} />
              <span>All active singers</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border px-4 py-3 text-sm text-red-700 bg-red-50 border-red-200">
            {error}
          </div>
        )}

        {/* TITLE ROW */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg md:text-xl font-semibold flex items-center gap-2"
            style={{ color: COLORS.navy }}
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs"
              style={{
                backgroundColor: "rgba(11,37,69,0.08)",
                color: COLORS.navy,
              }}
            >
              <FaUser />
            </span>
            Singer list
          </h2>
          <span className="text-[11px] text-[#6B7280]">
            {filtered.length} singer{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-[32px] border animate-pulse"
                style={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  borderColor: "#111827",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[#6B7280] bg-white/80 border border-[#E5E7EB] rounded-2xl p-6 flex items-center gap-3">
            <span className="text-xl">🤔</span>
            <div>
              <p className="font-medium" style={{ color: COLORS.navy }}>
                No singers found.
              </p>
              <p className="text-[11px]">
                Try changing the search text or check back later.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((singer) => {
              const name = singer.display_name || singer.name || "Unknown";
              const role =
                singer.profession || singer.genre || "Music Artist";
              const cityLine =
                singer.city || singer.state
                  ? `${singer.city || ""}${
                      singer.state ? `, ${singer.state}` : ""
                    }`
                  : "";

              return (
                <div
                  key={singer.id}
                  className="max-w-xs w-full mx-auto rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-[#111827] bg-[#050816] text-slate-100 flex flex-col"
                  style={{ minHeight: "420px" }}
                >
                  {/* IMAGE */}
                  <div className="relative w-full h-64 overflow-hidden">
                    {singer.photo_url ? (
                      <img
                        src={singer.photo_url}
                        alt={name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#111827] to-black text-5xl font-semibold tracking-[0.2em]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* slight dark overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </div>

                  {/* TEXT CONTENT */}
                  <div className="flex-1 px-5 py-4 flex flex-col">
                    {/* Name + role */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold tracking-[0.18em] uppercase text-slate-50">
                        {name}
                      </h3>
                      <p
                        className="mt-1 text-[13px]"
                        style={{ color: COLORS.yellow, fontFamily: "cursive" }}
                      >
                        {role}
                      </p>
                    </div>

                    {/* Contact + city */}
                    <div className="space-y-1 text-[12px] text-slate-300 mb-4">
                      {cityLine && (
                        <p className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-slate-400" />
                          <span>{cityLine}</span>
                        </p>
                      )}
                      {singer.mobile && (
                        <p className="flex items-center gap-2">
                          <FaPhoneAlt className="text-slate-400" />
                          <span>{singer.mobile}</span>
                        </p>
                      )}
                      {/* optional email if you add it later */}
                      {singer.email && (
                        <p className="flex items-center gap-2">
                          <FaEnvelope className="text-slate-400" />
                          <span className="truncate">{singer.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Bottom line + social icons */}
                    <div className="mt-auto pt-3 border-t border-slate-700 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>ID: {singer.id}</span>
                        {singer.experience && (
                          <span>{singer.experience} yrs experience</span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3 text-[13px]">
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center hover:border-slate-100 hover:text-slate-100 transition"
                        >
                          <FaFacebookF />
                        </button>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center hover:border-slate-100 hover:text-slate-100 transition"
                        >
                          <FaInstagram />
                        </button>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center hover:border-slate-100 hover:text-slate-100 transition"
                        >
                          <FaTwitter />
                        </button>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center hover:border-slate-100 hover:text-slate-100 transition"
                        >
                          <FaPinterestP />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
