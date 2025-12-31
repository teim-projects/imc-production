import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Users, ArrowRight, Ticket } from "lucide-react";
import { motion } from "framer-motion";

/* ---------------- DATE FORMAT HELPER ---------------- */
const formatDate = (dateString) => {
  const d = new Date(dateString);
  return {
    day: d.getDate(),
    month: d.toLocaleString("default", { month: "short" }),
  };
};

/* ---------------- TEMP API PLACEHOLDER ---------------- */
const fetchEvents = async () => {
  return [];
};

export default function UpcomingEvents() {
  const { data: events = [] } = useQuery({
    queryKey: ["events-preview"],
    queryFn: fetchEvents,
  });

  const displayEvents =
    events.length > 0
      ? events
      : [
          {
            id: 1,
            name: "Summer Music Festival",
            event_date: "2025-02-15",
            event_time: "7:00 PM",
            location: "Main Auditorium",
            event_type: "live_show",
            ticket_price: 50,
            available_seats: 150,
            image_url:
              "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
          },
          {
            id: 2,
            name: "Karaoke Night Special",
            event_date: "2025-02-20",
            event_time: "8:00 PM",
            location: "Lounge Area",
            event_type: "karaoke",
            ticket_price: 25,
            available_seats: 50,
            image_url:
              "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop",
          },
          {
            id: 3,
            name: "Acoustic Evening",
            event_date: "2025-02-25",
            event_time: "6:30 PM",
            location: "Rooftop Garden",
            event_type: "concert",
            ticket_price: 35,
            available_seats: 80,
            image_url:
              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop",
          },
        ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-block text-violet-600 font-semibold text-sm tracking-wider uppercase mb-4">
              Don&apos;t Miss Out
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Upcoming Events
            </h2>
          </div>

          <Link to="/events-booking">
            <button className="group flex items-center gap-2 border border-slate-300 rounded-xl px-5 py-2 font-semibold hover:bg-slate-100 transition">
              View All Events
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>

        {/* EVENTS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayEvents.map((event, index) => {
            const { day, month } = formatDate(event.event_date);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/events-booking?event=${event.id}`}>
                  <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition border border-slate-100">
                    
                    {/* IMAGE */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                      {/* DATE */}
                      <div className="absolute top-4 left-4 bg-white rounded-xl px-4 py-2 shadow">
                        <div className="text-2xl font-bold text-violet-600">
                          {day}
                        </div>
                        <div className="text-xs text-slate-600 uppercase">
                          {month}
                        </div>
                      </div>

                      {/* PRICE */}
                      <div className="absolute top-4 right-4 bg-violet-600 text-white rounded-xl px-4 py-2 font-semibold">
                        ${event.ticket_price}
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-6">
                      <div className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium mb-3">
                        {event.event_type.replace(/_/g, " ").toUpperCase()}
                      </div>

                      <h3 className="text-xl font-bold mb-3 group-hover:text-violet-700 transition">
                        {event.name}
                      </h3>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-violet-500" />
                          {event.event_time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-violet-500" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-violet-500" />
                          {event.available_seats} seats available
                        </div>
                      </div>

                      <button className="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold transition">
                        <Ticket className="w-4 h-4" />
                        Book Tickets
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
