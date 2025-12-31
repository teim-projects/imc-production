import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-[3rem] p-12 md:p-16 overflow-hidden"
        >
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl" />
          </div>

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT CONTENT */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your
                <br />
                <span className="text-violet-200">Musical Journey?</span>
              </h2>

              <p className="text-xl text-violet-100 mb-8 leading-relaxed">
                Whether you want to book our studio, attend a live event, or learn
                to sing, we're here to make it happen. Get in touch with us today!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact">
                  <button className="group flex items-center justify-center bg-white text-violet-700 hover:bg-violet-50 rounded-2xl px-8 py-4 text-lg font-semibold shadow-xl shadow-violet-800/30 w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                <Link to="/services">
                  <button className="border-2 border-white text-white hover:bg-white/10 rounded-2xl px-8 py-4 text-lg font-semibold w-full sm:w-auto">
                    Browse Services
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="grid gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-violet-200 text-sm">Call Us</div>
                    <div className="text-xl font-semibold text-white">
                      +1 (555) 123-4567
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-violet-200 text-sm">Email Us</div>
                    <div className="text-xl font-semibold text-white">
                      hello@imcmusic.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* END RIGHT */}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
