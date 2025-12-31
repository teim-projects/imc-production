import React from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="imc-footer">
      <div className="footer-container">
        {/* ================= CONTACT ================= */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <p>
            <FaMapMarkerAlt /> S-19, Ground floor, Greens Center,
            <br />
            Opposite Pudumjee Paper Mill,
            <br />
            Aditya Birla Hospital Road,
            <br />
            Thergaon, Chinchwad 411033.
          </p>
          <p>
            <FaPhoneAlt /> +91 8767055580 / 9834944461
          </p>
          <p>
            <FaEnvelope /> IMCPCMC@gmail.com
          </p>
        </div>

        {/* ================= QUICK LINKS ================= */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </div>

        {/* ================= SUPPORT ================= */}
        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/faqs">FAQs</a></li>
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* ================= SOCIAL ================= */}
        <div className="footer-col">
          <h4>Follow Us</h4>
          <div className="footer-social">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaYoutube /></a>
            <a href="#"><FaWhatsapp /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} IMC Music Hub. All Rights Reserved.
      </div>
    </footer>
  );
}
