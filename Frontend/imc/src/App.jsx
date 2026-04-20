import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
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

/* ================= ADD THIS ================= */
import Policies from "./userDashboard/pages/Policies";

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

/* ================= FEES ================= */
import AnnualFeePage from "./userDashboard/pages/AnnualFeePage";

/* ================= PAYMENT ================= */
import PaymentPage from "./userDashboard/payment/PaymentPage";
import PaymentButton from "./userDashboard/pages/PaymentButton";
import PaymentSuccess from "./userDashboard/pages/PaymentSuccess";

/* ================= STYLES ================= */
import "./App.css";

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

/* ================= WRAPPERS ================= */
function AnnualFeeWrapper() {
  const { id } = useParams();
  return <AnnualFeePage singerId={id} />;
}

/* ================= SCROLL FIX (Enhanced Version) ================= */
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const forceScrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const selectors = ["#root", ".app-main", "main", "body", "html"];
      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollTop = 0;
        }
      });
    };

    forceScrollToTop();

    const t1 = setTimeout(forceScrollToTop, 50);
    const t2 = setTimeout(forceScrollToTop, 150);
    const t3 = setTimeout(forceScrollToTop, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return null;
}

function Layout() {
  const location = useLocation();

  const hideNavbarRoutes = ["/login", "/register", "/forgot-password"];

  const isResetPassword =
    location.pathname.startsWith("/password-reset-confirm");

  const hideNavbar =
    hideNavbarRoutes.includes(location.pathname) || isResetPassword;

  return (
    <>
      <ScrollToTop />

      {!hideNavbar && <Navbar />}

      <main className="app-main">
        <Routes>
          {/* HOME */}
          <Route path="/" element={<UserDashboard />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/password-reset-confirm/:uid/:token"
            element={<ResetPasswordConfirm />}
          />

          {/* ADMIN */}
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

          <Route
            path="/admin/singers/:id/fees"
            element={
              <AdminRoute>
                <AnnualFeeWrapper />
              </AdminRoute>
            }
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfileSection />
              </PrivateRoute>
            }
          />

          {/* PUBLIC */}
          <Route path="/services" element={<Services />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/classes" element={<SingingClass />} />
          <Route path="/singer" element={<SingerRegistration />} />
          <Route path="/privacy-policy" element={<Policies />} />

          {/* BOOKINGS */}
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

          {/* PAYMENT */}
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <PaymentPage />
              </PrivateRoute>
            }
          />

          <Route path="/pay" element={<PaymentButton />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <style jsx="true">{`
        html,
        body,
        #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        .app-main {
          min-height: 100vh;
        }
      `}</style>
    </>
  );
}

/* ================= ROOT ================= */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
