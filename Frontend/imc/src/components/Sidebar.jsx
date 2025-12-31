// ---------- Sidebar.jsx (NO VISIBLE SUBMENUS, FORMS OPEN ON CLICK) ----------
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import "./Sidebar.css";
import {
  FaMusic,
  FaCalendarAlt,
  FaEnvelope,
  FaUser,
  FaChartLine,
  FaTools,
  FaLock,
  FaCamera,
  FaVideo,
  FaVolumeUp,
  FaMoneyBill,
  FaBars,
  FaTimes,
  FaBuilding,
} from "react-icons/fa";

function Sidebar({ openModal, openSubModal, currentKey = null }) {
  const [activeName, setActiveName] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const _openModal = openModal || (() => {});
  const _openSubModal = openSubModal || (() => {});

  // All sidebar items: either use `modal` or `subActionKey`
  const menuItems = useMemo(
    () => [
      {
        name: "Overview",
        key: "overview",
        icon: <FaChartLine />,
        modal: "overview",    // if you don't have overview modal, you can set this to null
        subActionKey: null,
      },

      {
        name: "Studio Master",
        key: "studioMaster",
        icon: <FaBuilding />,
        modal: null,
        // reuse your old logic: openSubModal("addStudioMaster")
        subActionKey: "addStudioMaster",
      },

      {
        name: "Studio Booking",
        key: "studio",
        icon: <FaMusic />,
        modal: null,
        subActionKey: "addStudio",          // used to be submenu -> addStudio
      },

      {
        name: "Singing Classes",
        key: "equipment",
        icon: <FaTools />,
        modal: null,
        subActionKey: "addEquipment",       // or "addClass" if your parent uses that
      },

      {
        name: "Auditorium Music Shows",
        key: "eventsShows",
        icon: <FaCalendarAlt />,
        modal: null,
        subActionKey: "addEvent",           // 🔴 this opens your Event form
      },

      {
        name: "Private Music Events",
        key: "private",
        icon: <FaLock />,
        modal: null,
        subActionKey: "addPrivate",
      },

      {
        name: "Photography Service",
        key: "photography",
        icon: <FaCamera />,
        modal: null,
        subActionKey: "addPhotography",
      },

      {
        name: "Videography Service",
        key: "videography",
        icon: <FaVideo />,
        modal: null,
        subActionKey: "addVideography",
      },

      {
        name: "Sound System Service",
        key: "sound",
        icon: <FaVolumeUp />,
        modal: null,
        subActionKey: "addSound",           // use this in parent to show Sound form
      },

      {
        name: "Singer Management",
        key: "singer",
        icon: <FaUser />,
        modal: null,
        subActionKey: "addSinger",
      },

      {
        name: "Triner",
        key: "Triner",
        icon: <FaMoneyBill />,
        modal: null,
        subActionKey: "addTrainer",
      },

      {
        name: "Contact",
        key: "contact",
        icon: <FaEnvelope />,
        modal: "contact",                   // normal modal
        subActionKey: null,
      },
    ],
    []
  );

  const goHome = useCallback(() => {
    setActiveName("Overview");
    // if you want clicking IMC to open overview:
    if (menuItems[0]?.modal) {
      _openModal(menuItems[0].modal);
    } else {
      _openModal(null);
    }
    setMobileOpen(false);
  }, [_openModal, menuItems]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
  }, [mobileOpen]);

  // If parent passes currentKey, highlight corresponding item
  useEffect(() => {
    if (!currentKey) return;
    const found = menuItems.find(
      (item) =>
        item.key === currentKey ||
        item.modal === currentKey ||
        item.subActionKey === currentKey
    );
    if (found) setActiveName(found.name);
  }, [currentKey, menuItems]);

  const handleItemClick = (item) => {
    setActiveName(item.name);

    if (item.subActionKey) {
      // forms that used to be opened with submenus (addStudio, addEvent, etc.)
      _openSubModal(item.subActionKey);
    } else if (item.modal) {
      _openModal(item.modal);
    } else {
      _openModal(null);
    }

    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 className="mobile-title" onClick={goHome}>
          IMC
        </h2>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`sidebar ${mobileOpen ? "open" : ""} ${
          isHovered ? "expanded" : "collapsed"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar-header" onClick={goHome}>
          <h2 className="sidebar-title">IMC</h2>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={activeName === item.name ? "active" : ""}
            >
              <button
                className="sidebar-btn"
                onClick={() => handleItemClick(item)}
              >
                <div className="icon">{item.icon}</div>
                <span className="text">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;
