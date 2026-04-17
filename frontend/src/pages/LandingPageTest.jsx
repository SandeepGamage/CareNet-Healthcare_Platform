/**
 * CareNet — AI-Enabled Smart Healthcare Platform
 * Landing Page — Single File (JSX)
 *
 * Dependencies to install:
 *   npm install framer-motion lucide-react
 *
 * Styling: Tailwind CSS v4 required.
 * Add to your index.css (or equivalent):
 *
 *   @import "tailwindcss";
 *
 *   :root {
 *     --primary: 174 72% 40%;
 *     --primary-foreground: 0 0% 100%;
 *     --background: 0 0% 100%;
 *     --foreground: 222 47% 11%;
 *     --card: 210 20% 98%;
 *     --card-foreground: 222 47% 11%;
 *     --border: 214 32% 91%;
 *     --muted: 210 40% 96%;
 *     --muted-foreground: 215 16% 47%;
 *     --accent: 210 40% 96%;
 *     --accent-foreground: 222 47% 11%;
 *     --radius: 0.5rem;
 *   }
 *
 *   .text-gradient {
 *     background: linear-gradient(90deg, #14b8a6, #3b82f6);
 *     -webkit-background-clip: text;
 *     -webkit-text-fill-color: transparent;
 *     background-clip: text;
 *   }
 *   .glass-panel {
 *     background: rgba(255,255,255,0.8);
 *     backdrop-filter: blur(12px);
 *     border-bottom: 1px solid rgba(0,0,0,0.08);
 *   }
 *   .glass-panel-dark {
 *     background: rgba(15, 23, 42, 0.75);
 *     backdrop-filter: blur(10px);
 *     border: 1px solid rgba(255,255,255,0.1);
 *   }
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Activity, ShieldCheck, Zap, Video, CreditCard,
  MessageSquare, Cpu, CheckCircle2, Menu, X, ArrowRight
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import bg1 from "../assets/bg1.jpg";

// Utility: merge class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────
// Universal Navbar imported at the top

/* ========================================================================
  Section: HERO
  Purpose: Top landing hero with headline, subcopy and primary CTAs (Book Appointment, Watch Demo)
  ======================================================================== */
const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.warn("Hero: Invalid user data in localStorage", error);
      }
    }
  }, []);

  const handleBookingClick = () => {
    if (user) {
      navigate("/book-appointment");
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/30">
      <img src={bg1} alt="Hero background" className="absolute inset-0 w-full h-full object-cover z-0" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 z-10"
      />
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3 z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-1 gap-12 lg:gap-8 items-center">
          {/* Left: Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* removed version badge per request */}

            <motion.h1 variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 text-slate-900">
              The Future of Healthcare, <br />
              <span className="text-gradient">Powered by AI.</span>
            </motion.h1>

            <motion.p variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="text-lg lg:text-xl text-slate-500 mb-8 leading-relaxed">
              CareNet integrates GPT-4 diagnostics, real-time telemedicine, and
              enterprise-grade security into one seamless, smart healthcare platform.
            </motion.p>

            <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookingClick}
                className="px-8 py-4 rounded-xl bg-teal-500 text-white text-base font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Book Appointment <ArrowRight className="w-5 h-5" />
              </motion.button>
              {/* Watch Demo button removed per request */}
            </motion.div>

            {/* social proof removed per request */}
          </motion.div>

          {/* Right image removed per request - hero now single-column */}
        </div>
      </div>
    </section>
  );
};

/* ========================================================================
  Section: FEATURES
  Purpose: Feature grid showing platform capabilities
  ======================================================================== */
const Features = () => {
  const features = [
    {
      title: "AI-Powered Diagnostics",
      description: "Leverage OpenAI GPT integration to analyze symptoms and suggest preliminary diagnostic paths.",
      icon: <Cpu className="w-6 h-6 text-teal-600" />,
    },
    {
      title: "Secure Telemedicine",
      description: "High-definition, low-latency video consultations powered by Jitsi Meet integration.",
      icon: <Video className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Encrypted Records",
      description: "HIPAA-compliant patient data storage with end-to-end encryption.",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "Real-time Messaging",
      description: "Asynchronous, instant notifications and chat built on robust message brokers.",
      icon: <MessageSquare className="w-6 h-6 text-purple-600" />,
    },
    {
      title: "Frictionless Payments",
      description: "Secure, automated billing and invoicing for seamless transactions.",
      icon: <CreditCard className="w-6 h-6 text-amber-600" />,
    },
    {
      title: "Multi-channel Alerts",
      description: "Never miss an update with integrated SMS and email notifications.",
      icon: <Zap className="w-6 h-6 text-rose-600" />,
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-teal-500 font-semibold tracking-wide uppercase text-sm mb-3">Capabilities</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to deliver care.</h3>
          <p className="text-lg text-slate-500">A complete, end-to-end ecosystem designed for modern medical practices.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -6 }}
              className="relative bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-slate-100 hover:border-teal-200 shadow-lg hover:shadow-2xl transition-transform duration-300 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-blue-50/20 opacity-30 blur-xl pointer-events-none" />

              <div className="relative z-10 flex items-start gap-6">
                <div className="flex items-center justify-center rounded-xl w-16 h-16 flex-shrink-0 bg-gradient-to-br from-white to-slate-100 border border-white/30 shadow-inner">
                  {feature.icon}
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h4>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-between text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Enterprise-ready</span>
                </span>
                <span className="text-teal-500 font-medium">Learn more →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ========================================================================
  Section: HOW IT WORKS
  Purpose: Step-by-step explanation of workflow
  ======================================================================== */
const HowItWorks = () => {
  const steps = [
    {
      num: "01",
      title: "Register & Authenticate",
      desc: "Create a secured account in seconds. Patients and doctors get dedicated portals with role-based access control.",
      icon: <ShieldCheck className="w-8 h-8" />,
    },
    {
      num: "02",
      title: "Connect & Consult",
      desc: "Schedule appointments, engage in HD video calls, and exchange secure async messages.",
      icon: <Video className="w-8 h-8" />,
    },
    {
      num: "03",
      title: "AI-Powered Insights",
      desc: "Post-consultation, GPT analyzes notes to suggest prescriptions, generate summaries, and schedule follow-ups.",
      icon: <Cpu className="w-8 h-8" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Seamless workflow from start to finish.</h2>
          <p className="text-lg text-slate-500">We've removed the friction from digital healthcare delivery.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-teal-100 via-teal-300 to-teal-100 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-50 shadow-xl flex items-center justify-center text-teal-500 mb-6 relative">
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center border-2 border-slate-50">
                  {step.num}
                </div>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
              <p className="text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* Stats removed per request */

/* Testimonials removed per request */

/* FAQ removed per request */

/* ========================================================================
  Section: CTA
  Purpose: Bottom call-to-action for signups / trials
  ======================================================================== */
const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-teal-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to modernize your practice?
        </h2>
        <p className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto">
          Join thousands of healthcare professionals who are providing better care with less
          administrative overhead using CareNet.
        </p>

        <form className="max-w-lg mx-auto text-center" onSubmit={(e) => e.preventDefault()}>
          <Link
            to="/register"
            className="inline-block px-8 py-4 rounded-xl bg-white text-teal-600 font-bold shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Early Access
          </Link>
        </form>
        <p className="text-sm text-teal-200 mt-4">14-day free trial. No credit card required.</p>
      </div>
    </section>
  );
};

/* ========================================================================
  Section: FOOTER
  Purpose: Site footer and navigation links
  ======================================================================== */
const Footer = () => {
  return (
    <footer className="bg-white text-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <HeartPulse className="text-teal-400 w-6 h-6" />
            <span className="font-bold text-xl text-white">CareNet</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
            AI-Enabled Smart Healthcare Platform designed for the modern era of telemedicine.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How it Works</a></li>
            <li><a href="/book-appointment" className="hover:text-teal-400 transition-colors">Appointments</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">HIPAA Compliance</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <p>© {new Date().getFullYear()} CareNet Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-teal-600 transition-colors">Twitter</a>
          <a href="#" className="hover:text-teal-600 transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-teal-600 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

/* ========================================================================
  Page Export: LandingPage
  Purpose: Compose the page by rendering all sections and the Navbar
  ======================================================================== */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        {/* Stats removed per request */}
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
