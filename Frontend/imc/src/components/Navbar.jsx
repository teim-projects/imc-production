import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faHome,
  faMusic,
  faCalendar,
  faMicrophone,
  faUsers,
  faPhone,
  faUser,
  faGear,
  faRightFromBracket,
  faTicketAlt, // ← New icon for My Bookings
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState({
    full_name: "",
    email: "",
    profile_photo: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/+$/, "");

  /* ---------------- HELPERS ---------------- */
  const toAbsolute = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${BASE}${url}`;
    return `${BASE}/${url}`;
  };

  const initials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "IM";

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = useCallback(() => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setSidebarOpen(false);
    setMenuOpen(false);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser({ full_name: "", email: "", profile_photo: "" });
    window.dispatchEvent(new Event("authChange"));
    navigate("/login", { replace: true });
  }, [navigate]);

  /* ---------------- FETCH USER ---------------- */
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}/auth/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        handleLogout();
        return;
      }

      const data = await res.json();

      setIsAuthenticated(true);

      const admin =
        data?.role === "admin" ||
        data?.is_superuser === true ||
        data?.is_staff === true;

      setIsAdmin(admin);

      setUser({
        full_name:
          data.full_name ||
          `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        email: data.email || "",
        profile_photo: data.profile_photo || data.photo || "",
      });
    } catch {
      handleLogout();
    }
  }, [BASE, handleLogout]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const avatarSrc = user.profile_photo ? toAbsolute(user.profile_photo) : "";

  /* ---------------- CLOSE MENU ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav style={styles.navbar}>
        {/* LOGO */}
        <div style={styles.logo}>
          <Link to="/user-dashboard" style={styles.logoLink}>
            <img src={logo} alt="IMC Logo" style={styles.logoImg} />
            <span style={styles.logoText}>IMC</span>
          </Link>
        </div>

        {/* DESKTOP CENTER NAV (ONLY FOR NON-ADMIN USERS) */}
        {!isAdmin && isAuthenticated && window.innerWidth >= 900 && (
          <div style={styles.centerLinks}>
            {[
              ["Home", "/user-dashboard"],
              ["Services", "/services"],
              ["Events", "/events-booking"],
              ["Studio", "/studio-booking"],
              ["Classes", "/singing-classes"],
              ["Singer", "/singer"],
              ["Contact", "/contact"],
            ].map(([label, path]) => (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navItem,
                  ...(isActive(path) ? styles.activeNav : {}),
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          {isAuthenticated ? (
            <>
              {/* MOBILE HAMBURGER */}
              {window.innerWidth < 900 && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={styles.mobileMenuBtn}
                >
                  <FontAwesomeIcon icon={faBars} size="lg" />
                </button>
              )}

              {/* DESKTOP AVATAR DROPDOWN */}
              {window.innerWidth >= 900 && (
                <div style={{ position: "relative" }}>
                  <button
                    ref={btnRef}
                    onClick={() => setMenuOpen((s) => !s)}
                    style={styles.avatarButton}
                  >
                    <span style={styles.halo} />
                    <span style={styles.avatarCircle}>
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="Profile" style={styles.avatarImg} />
                      ) : (
                        <span style={styles.avatarInitials}>
                          {initials(user.full_name)}
                        </span>
                      )}
                    </span>
                    <span style={styles.statusDot} />
                  </button>

                  {menuOpen && (
                    <div ref={menuRef} style={styles.menu}>
                      <div style={styles.menuHeader}>
                        <strong>{user.full_name}</strong>
                        <span style={{ fontSize: 12 }}>{user.email}</span>
                      </div>

                      <div style={styles.menuDivider} />

                      <Link
                        to="/profile"
                        style={styles.menuItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faUser} /> Profile
                      </Link>

                      {/* NEW: My Bookings in Desktop Dropdown */}
                      <Link
                        to="/my-bookings"
                        style={styles.menuItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faTicketAlt} /> My Bookings
                      </Link>

                      {!isAdmin && (
                        <Link
                          to="/settings"
                          style={styles.menuItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <FontAwesomeIcon icon={faGear} /> Settings
                        </Link>
                      )}

                      <div style={styles.menuDivider} />

                      <button
                        onClick={handleLogout}
                        style={{ ...styles.menuItem, ...styles.menuDanger }}
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" style={styles.registerLink}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ================= MOBILE SIDEBAR ================= */}
      {sidebarOpen && (
        <>
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />

          <aside style={styles.sidebar}>
            {/* SIDEBAR HEADER - PROFILE */}
            <div style={styles.sidebarHeader}>
              <button
                onClick={() => setSidebarOpen(false)}
                style={styles.sidebarClose}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>

              <div style={styles.sidebarProfile}>
                <div style={styles.sidebarAvatar}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" style={styles.avatarImg} />
                  ) : (
                    <span style={styles.avatarInitials}>
                      {initials(user.full_name)}
                    </span>
                  )}
                </div>
                <div>
                  <p style={styles.sidebarName}>{user.full_name || "Guest"}</p>
                  <p style={styles.sidebarEmail}>{user.email || "Not logged in"}</p>
                </div>
              </div>
            </div>

            {/* SCROLLABLE NAV LINKS */}
            <div style={styles.sidebarLinksContainer}>
              <div style={styles.sidebarLinks}>
                {[
                  [faHome, "Home", "/user-dashboard"],
                  [faMusic, "Services", "/services"],
                  [faCalendar, "Events", "/events-booking"],
                  [faMicrophone, "Studio", "/studio-booking"],
                  [faUsers, "Classes", "/singing-classes"],
                  [faUsers, "Singer", "/singer"],
                  [faPhone, "Contact", "/contact"],
                ].map(([icon, label, path]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      ...styles.sidebarLink,
                      ...(isActive(path) ? styles.sidebarActive : {}),
                    }}
                  >
                    <FontAwesomeIcon icon={icon} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* SIDEBAR FOOTER - Now includes My Bookings */}
            <div style={styles.sidebarFooter}>
              <Link
                to="/profile"
                style={styles.sidebarFooterLink}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faUser} /> Profile
              </Link>

              {/* NEW: My Bookings in Mobile Sidebar */}
              <Link
                to="/my-bookings"
                style={styles.sidebarFooterLink}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faTicketAlt} /> My Bookings
              </Link>

              {!isAdmin && (
                <Link
                  to="/settings"
                  style={styles.sidebarFooterLink}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={faGear} /> Settings
                </Link>
              )}

              <button onClick={handleLogout} style={styles.sidebarLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

/* ================= STYLES (unchanged except minor tweaks) ================= */
const styles = {
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "linear-gradient(90deg, #0A2C56 0%, #FF6F3C 70%, #FFD23F 100%)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },

  logo: { display: "flex", alignItems: "center" },
  logoLink: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#fff",
  },
  logoImg: { height: 40, marginRight: 12 },
  logoText: { fontSize: "1.6em", fontWeight: 800, letterSpacing: "1px" },

  centerLinks: {
    display: "flex",
    gap: 8,
    background: "rgba(255,255,255,0.15)",
    padding: "8px",
    borderRadius: "999px",
    backdropFilter: "blur(10px)",
  },
  navItem: {
    padding: "8px 18px",
    borderRadius: "999px",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "15px",
    transition: "all 0.3s",
  },
  activeNav: {
    background: "#fff",
    color: "#5B21B6",
    fontWeight: 700,
  },

  right: { display: "flex", gap: 16, alignItems: "center" },

  mobileMenuBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
  },

  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    padding: "8px 18px",
    borderRadius: "30px",
    background: "linear-gradient(135deg,#0077b6,#00b4d8)",
    transition: "all 0.3s",
  },
  registerLink: {
    color: "#0A2C56",
    padding: "8px 18px",
    borderRadius: "30px",
    background: "linear-gradient(135deg,#FFD23F,#FFB703)",
    textDecoration: "none",
    fontWeight: 700,
    transition: "all 0.3s",
  },

  avatarButton: {
    position: "relative",
    height: 48,
    width: 48,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  halo: {
    position: "absolute",
    inset: -6,
    borderRadius: "50%",
    background: "conic-gradient(#ffd23f,#ff8a3c,#0a2c56,#ffd23f)",
    animation: "rotate 8s linear infinite",
  },
  avatarCircle: {
    height: "100%",
    width: "100%",
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#5b21b6",
    fontSize: "18px",
    fontWeight: "800",
    color: "#fff",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { color: "#fff", fontWeight: 800 },
  statusDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    height: 12,
    width: 12,
    borderRadius: "50%",
    background: "#2ecc71",
    border: "2px solid #fff",
  },

  menu: {
    position: "absolute",
    right: 0,
    top: 60,
    background: "#fff",
    borderRadius: 16,
    padding: 12,
    minWidth: 260,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    zIndex: 100,
  },
  menuHeader: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: "1px solid #eee",
  },
  menuItem: {
    display: "flex",
    gap: 12,
    padding: "10px 12px",
    textDecoration: "none",
    fontWeight: 600,
    color: "#0A2C56",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
    width: "100%",
    textAlign: "left",
  },
  menuDivider: { height: 1, background: "#eee", margin: "8px 0" },
  menuDanger: { color: "#b42318" },

  /* ================= MOBILE SIDEBAR ================= */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1100,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "320px",
    height: "100%",
    background: "#fff",
    zIndex: 1200,
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 30px rgba(0,0,0,0.2)",
  },
  sidebarClose: {
    position: "absolute",
    top: 20,
    right: 20,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
  },
  sidebarHeader: {
    background: "linear-gradient(135deg, #5b21b6, #9333ea)",
    padding: "30px 24px",
    color: "#fff",
    position: "relative",
    minHeight: "140px",
  },
  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  sidebarAvatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    overflow: "hidden",
    border: "4px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "#5b21b6",
    fontSize: "28px",
    fontWeight: "800",
  },
  sidebarName: { fontSize: "20px", fontWeight: "700" },
  sidebarEmail: { fontSize: "14px", opacity: 0.9 },

  sidebarLinksContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "0 24px",
  },
  sidebarLinks: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "20px 0",
  },
  sidebarLink: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "14px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#333",
    fontWeight: "600",
    fontSize: "16px",
    transition: "all 0.3s",
  },
  sidebarActive: {
    background: "linear-gradient(135deg, #FFD23F, #FF8A3C)",
    color: "#0A2C56",
    fontWeight: "700",
  },

  sidebarFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sidebarFooterLink: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#0A2C56",
    fontWeight: "600",
  },
  sidebarLogout: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 16px",
    borderRadius: "12px",
    background: "none",
    border: "none",
    color: "#b42318",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
};

export default Navbar;