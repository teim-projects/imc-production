// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Alternative (sometimes more reliable):
    // document.documentElement.scrollTop = 0;
    // document.documentElement.scrollLeft = 0;
  }, [pathname]);

  return null;
}