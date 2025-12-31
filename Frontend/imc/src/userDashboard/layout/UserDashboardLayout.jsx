import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../UserDashboard.css";

export default function UserDashboardLayout() {
  return (
    <div className="ud-container">
      <Sidebar />

      <div className="ud-main">
        <Header />
        <div className="ud-content">
          {/* ONLY CONTENT CHANGES */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
