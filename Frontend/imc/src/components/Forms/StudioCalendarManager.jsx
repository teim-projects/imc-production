import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE =
  import.meta.env.VITE_BASE_API_URL ||
  "https://www.imcpune.in/api";

const STUDIO_URL = `${BASE}/auth/studio-master/`;
const BOOKING_URL = `${BASE}/auth/studios/`;

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

const slots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const format12 = (time24) => {
  const [hour, minute] = time24.split(":");

  const h = parseInt(hour);

  const ampm = h >= 12 ? "PM" : "AM";

  const hr = h % 12 || 12;

  return `${hr}:${minute} ${ampm}`;
};

const StudioCalendarManager = () => {
  const navigate = useNavigate();

  const [studios, setStudios] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [studio, setStudio] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    loadStudios();
  }, []);

  useEffect(() => {
    if (studio && date) {
      loadBookings();
    }
  }, [studio, date]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (studio && date) {
        loadBookings();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [studio, date]);

  const loadStudios = async () => {
    try {
      const res = await api.get(STUDIO_URL);

      setStudios(res.data.results || res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ========== UPDATED loadBookings ==========
  const loadBookings = async () => {
    if (!studio || !date) return;

    try {
      const res = await api.get(
        `${BOOKING_URL}by_date/?date=${date}&studio=${encodeURIComponent(studio)}`
      );

      const data = res.data.results || res.data;

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };
  // =========================================

  const getBooking = (slot) => {
    return bookings.find(
      (b) =>
        b.studio_name === studio &&
        b.date === date &&
        b.time_slot?.substring(0, 5) === slot &&
        // Only treat as occupied if booked or blocked (pending_payment is NOT blocking)
        (b.status === "booked" || b.status === "blocked")
    );
  };

  // ========== UPDATED blockSlot ==========
  const blockSlot = async (slot) => {
    const booking = getBooking(slot);

    try {
      if (booking) {
        // If a record exists, just update its status to "blocked"
        await api.patch(`${BOOKING_URL}${booking.id}/`, {
          status: "blocked",
        });
      } else {
        // Otherwise create a new blocked record
        await api.post(BOOKING_URL, {
          customer: "ADMIN BLOCK",
          contact_number: "",
          email: "",
          address: "",
          studio_name: studio,
          date: date,
          time_slot: `${slot}:00`,
          duration: 1,
          payment_methods: [],
          payment_status: "pending",
          price_per_hour: 0,
          total_amount: 0,
          status: "blocked",
        });
      }

      await loadBookings();
    } catch (err) {
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);
    }
  };
  // ======================================

  const openSlot = async (bookingId) => {
    try {
      // Delete the block record entirely — an absent record means available
      await api.delete(`${BOOKING_URL}${bookingId}/`);
      loadBookings();
    } catch (err) {
      console.log("openSlot error:", err.response?.status, err.response?.data);
    }
  };

  const bookNow = (slot) => {
    navigate("/studio-booking", {
      state: {
        studio_name: studio,
        date: date,
        time_slot: slot,
      },
    });
  };

  return (
    <div className="container-fluid p-4">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-white py-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Studio Calendar Management</h2>
              <small className="text-muted">Manage Studio Slots</small>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              Close Window
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="row mb-5">
            <div className="col-md-8">
              <select
                className="form-select form-select-lg"
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
              >
                <option value="">Select Studio</option>
                {studios.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <input
                type="date"
                className="form-control form-control-lg"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            {slots.map((slot) => {
              const booking = getBooking(slot);
              const status = booking ? booking.status : "available";

              return (
                <div
                  className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4"
                  key={slot}
                >
                  <div
                    className="card shadow-sm text-center h-100"
                    style={{ borderRadius: "15px" }}
                  >
                    <div className="card-body">
                      <h3>{format12(slot)}</h3>
                      <h5
                        className={
                          status === "available"
                            ? "text-success"
                            : status === "blocked"
                            ? "text-danger"
                            : "text-primary"
                        }
                      >
                        {status.toUpperCase()}
                      </h5>

                      {status === "available" && (
                        <>
                          <button
                            className="btn btn-success btn-sm w-100 mb-2"
                            onClick={() => bookNow(slot)}
                          >
                            Book
                          </button>
                          <button
                            className="btn btn-danger btn-sm w-100"
                            onClick={() => blockSlot(slot)}
                          >
                            Block
                          </button>
                        </>
                      )}

                      {status === "blocked" && (
                        <button
                          className="btn btn-warning btn-sm w-100"
                          onClick={() => openSlot(booking.id)}
                        >
                          Open Slot
                        </button>
                      )}

                      {status === "booked" && (
                        <button className="btn btn-primary btn-sm w-100">
                          Booked
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioCalendarManager;