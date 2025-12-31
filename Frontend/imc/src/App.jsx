import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* ================= COMMON ================= */
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProfileSection from "./components/ProfileSection";
import ForgotPassword from "./components/ForgotPassword";
import ResetPasswordConfirm from "./components/ResetPasswordConfirm";

/* ================= USER DASHBOARD ================= */
import UserDashboard from "./userDashboard/UserDashboard";

/* ================= MAIN PAGES ================= */
import Services from "./userDashboard/pages/Services";
import Events from "./userDashboard/pages/Events";
import Contact from "./userDashboard/pages/Contact";
import SingingClass from "./userDashboard/pages/SingingClass";
import SingerRegistration from "./userDashboard/pages/SingerRegistration";

/* ================= BOOKING PAGES ================= */
import PrivateBooking from "./userDashboard/pages/PrivateBooking";
import PhotographyBooking from "./userDashboard/pages/PhotographyBooking";
import VideographyPage from "./userDashboard/pages/Videographypage";
import SoundBooking from "./userDashboard/pages/SoundBooking";

/* ================= HOME PAGES ================= */
import StudioHomePage from "./userDashboard/studio/HomePage";
import EventHomePage from "./userDashboard/Events/HomePage";
import SingerHomePage from "./userDashboard/singer/HomePage";

/* ================= FORMS ================= */
import SingerForm from "./components/Forms/SingerForm";
import UserStudioRentalForm from "./userDashboard/Forms/UserStudioRentalForm";
import UserPhotographyBookingForm from "./userDashboard/Forms/UserPhotographyBookingForm";
import UserEventBookingForm from "./userDashboard/Forms/UserEvents";

/* ================= PAYMENT ================= */
import PaymentPage from "./userDashboard/payment/PaymentPage";

/* ================= ASSETS ================= */
import "./App.css";
import Img1 from "./assets/banner.jpg";
import Img2 from "./assets/banner1.JPG";

/* ================= AUTH HELPERS ================= */
const getUserInfo = () => {
  const token = localStorage.getItem("access");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}
  return { token, user };
};

/* ================= ROUTE GUARDS ================= */
function PrivateRoute({ children }) {
  const { token } = getUserInfo();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = getUserInfo();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === "admin" || user?.is_superuser) return children;
  return <Navigate to="/" replace />;
}

/* ================= MAIN APP LAYOUT ================= */
function Layout() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          {/* HOME → UserDashboard (Guest ला पण दिसेल) */}
          <Route path="/" element={<UserDashboard />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/password-reset-confirm/:uid/:token"
            element={<ResetPasswordConfirm />}
          />

          {/* ADMIN PANEL */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/singers"
            element={
              <AdminRoute>
                <SingerForm initialMode="list" />
              </AdminRoute>
            }
          />

          {/* PROFILE - LOGIN REQUIRED */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfileSection />
              </PrivateRoute>
            }
          />

          {/* PUBLIC PAGES - कोणालाही दिसतील */}
          <Route path="/services" element={<Services />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/classes" element={<SingingClass />} />
          <Route path="/singer" element={<SingerRegistration />} />

          {/* BOOKING PAGES - LOGIN COMPULSORY */}
          <Route
            path="/studio-booking"
            element={
              <PrivateRoute>
                <StudioHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/studio-booking/form"
            element={
              <PrivateRoute>
                <UserStudioRentalForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/events-booking"
            element={
              <PrivateRoute>
                <EventHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/events-booking/form"
            element={
              <PrivateRoute>
                <UserEventBookingForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/photography-booking"
            element={
              <PrivateRoute>
                <PhotographyBooking />
              </PrivateRoute>
            }
          />

          <Route
            path="/videography"
            element={
              <PrivateRoute>
                <VideographyPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/private-booking"
            element={
              <PrivateRoute>
                <PrivateBooking />
              </PrivateRoute>
            }
          />

          <Route
            path="/singer-booking"
            element={
              <PrivateRoute>
                <SingerHomePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/sound-booking"
            element={
              <PrivateRoute>
                <SoundBooking />
              </PrivateRoute>
            }
          />

          {/* PAYMENT - LOGIN REQUIRED */}
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <PaymentPage />
              </PrivateRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        html,
        body,
        #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .app-main {
          min-height: calc(100vh - 70px);
        }
      `}</style>
    </>
  );
}

/* ================= ROOT APP ================= */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}