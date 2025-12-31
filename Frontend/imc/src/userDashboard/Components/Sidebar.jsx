import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="ud-sidebar">
      <h2 className="ud-logo">IMC</h2>

      <nav>
        <NavLink to="/user">Dashboard</NavLink>
        <NavLink to="/user/events">Events</NavLink>
        <NavLink to="/user/services">Services</NavLink>
        <NavLink to="/user/studio-booking">Studio Booking</NavLink>
        <NavLink to="/user/singing-classes">Singing Classes</NavLink>
        <NavLink to="/user/private-booking">Private Booking</NavLink>
        <NavLink to="/user/media-services">Media Services</NavLink>
        <NavLink to="/user/sound-services">Sound Services</NavLink>
        <NavLink to="/user/singer-registration">Singer Registration</NavLink>
      </nav>
    </aside>
  );
}
