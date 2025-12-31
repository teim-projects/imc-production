import React from "react";

// ✅ Correct paths (CASE-SENSITIVE)
import HeroSection from "./Components/home/HeroSection";
import ServicesPreview from "./Components/home/ServicesPreview";
import UpcomingEvents from "./Components/home/UpcomingEvents";
import Testimonials from "./Components/home/Testimonials";
import CTASection from "./Components/home/CTASection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <ServicesPreview />
      <UpcomingEvents />
      <Testimonials />
      <CTASection />
    </div>
  );
}
