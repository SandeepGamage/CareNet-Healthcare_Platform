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
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Activity, ShieldCheck, Zap, Video, CreditCard,
  MessageSquare, Cpu, CheckCircle2, ChevronRight,
  Star, Quote, Menu, X, ArrowRight, Play
} from "lucide-react";

// Utility: merge class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Navbar: User found in localStorage:", parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.warn("Navbar: Invalid user data in localStorage, clearing it", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      console.log("Navbar: No user found in localStorage");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled ? "glass-panel py-3" : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            Care<span className="text-teal-500">Net</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-500 hover:text-teal-500 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                  {(user?.name || "U").charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{user?.name || "User"}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{user?.role || ""}</span>
                </div>
              </div>
              <Link
                to={user.role === 'admin' ? '/admin-dashboard' : (user.role === 'patient' ? '/patient-dashboard' : '/')}
                className="text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-800 hover:text-teal-500 transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 md:hidden flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-800 p-2 rounded-lg hover:bg-slate-50"
              >
                {link.name}
              </a>
            ))}
            <div className="h-px bg-slate-100 my-2" />
            <div className="h-px bg-slate-100 my-2" />
            {user ? (
              <>
                <div className="p-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user?.name || "U").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role || ""}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-xl bg-slate-100 text-slate-600 text-center font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-base font-medium text-slate-800 p-2 text-center" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link to="/register" className="p-3 rounded-xl bg-teal-500 text-white text-center font-semibold" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/30">
      <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-sm font-semibold mb-6 border border-teal-500/20">
              <Zap className="w-4 h-4" />
              <span>Platform v2.0 is Live</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 text-slate-900">
              The Future of Healthcare, <br />
              <span className="text-gradient">Powered by AI.</span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-500 mb-8 leading-relaxed">
              CareNet integrates GPT-4 diagnostics, real-time telemedicine, and
              enterprise-grade security into one seamless, smart healthcare platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register" 
                className="px-8 py-4 rounded-xl bg-teal-500 text-white text-base font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 rounded-xl bg-white text-slate-800 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-300 flex items-center justify-center gap-2 font-semibold group">
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Play className="w-3 h-3 text-teal-600 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <p>Joined by <span className="font-semibold text-slate-900">10,000+</span> healthcare professionals</p>
            </div>
          </motion.div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative lg:ml-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-teal-500/20 border border-white/50 aspect-[4/3] w-full max-w-lg mx-auto bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&h=700&fit=crop&crop=top"
                alt="Doctor consulting with patient"
                className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity duration-500"
              />

              {/* Floating badge: Vitals */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-6 -left-6 glass-panel-dark p-4 rounded-xl flex items-center gap-3"
              >
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Vitals Status</p>
                  <p className="text-sm font-bold text-white">Stable & Normal</p>
                </div>
              </motion.div>

              {/* Floating badge: AI */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 -right-8 glass-panel-dark p-4 rounded-xl flex items-center gap-3"
              >
                <div className="bg-teal-500/20 p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">AI Analysis</p>
                  <p className="text-sm font-bold text-white">Complete</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────
const Features = () => {
  const features = [
    {
      title: "AI-Powered Diagnostics",
      description: "Leverage OpenAI GPT integration to analyze symptoms and suggest preliminary diagnostic paths.",
      icon: <Cpu className="w-6 h-6 text-teal-500" />,
      color: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "Secure Telemedicine",
      description: "High-definition, low-latency video consultations powered by Jitsi Meet integration.",
      icon: <Video className="w-6 h-6 text-blue-500" />,
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Encrypted Records",
      description: "HIPAA-compliant patient data storage with end-to-end encryption.",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      color: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Real-time Messaging",
      description: "Asynchronous, instant notifications and chat built on robust message brokers.",
      icon: <MessageSquare className="w-6 h-6 text-purple-500" />,
      color: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Frictionless Payments",
      description: "Secure, automated billing and invoicing for seamless transactions.",
      icon: <CreditCard className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Multi-channel Alerts",
      description: "Never miss an update with integrated SMS and email notifications.",
      icon: <Zap className="w-6 h-6 text-rose-500" />,
      color: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-teal-500 font-semibold tracking-wide uppercase text-sm mb-3">Capabilities</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to deliver care.</h3>
          <p className="text-lg text-slate-500">A complete, end-to-end ecosystem designed for modern medical practices.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-teal-200 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group"
            >
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110", feature.color)}>
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
const Stats = () => {
  const stats = [
    { label: "Active Patients", value: "10,000+" },
    { label: "Verified Doctors", value: "500+" },
    { label: "Platform Uptime", value: "99.9%" },
    { label: "Specializations", value: "50+" },
  ];

  return (
    <section className="py-20 bg-teal-500/5 border-y border-teal-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-teal-200 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="px-4">
              <div className="text-3xl md:text-5xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm md:text-base font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────
const Testimonials = () => {
  const reviews = [
    {
      quote: "The AI diagnostic assistant saves me hours of charting every week. It accurately summarizes patient history and highlights potential red flags before I even start the video call.",
      name: "Dr. Sarah Jenkins",
      role: "Chief Cardiologist",
      img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop",
    },
    {
      quote: "As a patient, the experience is incredibly smooth. The video quality is flawless, and getting my prescriptions via SMS immediately after the call is a game-changer.",
      name: "Michael Chen",
      role: "Patient",
      img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
    },
    {
      quote: "We deployed CareNet across our 5 clinics. The data is secure, and the payment integration completely automated our billing department.",
      name: "Amanda Rivera",
      role: "Clinic Administrator",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trusted by the best.</h2>
          <p className="text-lg text-slate-500">See how CareNet is transforming practices around the globe.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm relative">
              <Quote className="absolute top-6 right-6 w-10 h-10 text-teal-500/10" />
              <div className="flex items-center gap-1 mb-6 text-amber-400">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed mb-8 relative z-10 text-base">"{review.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{review.name}</h5>
                  <p className="text-xs text-slate-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
const FAQ = () => {
  const faqs = [
    {
      q: "Is the patient data HIPAA compliant?",
      a: "Yes. All data is encrypted at rest and in transit. We sign Business Associate Agreements (BAAs) with all Professional and Enterprise tier customers.",
    },
    {
      q: "How does the AI diagnostic feature work?",
      a: "Our platform integrates securely with the OpenAI API. It analyzes symptom descriptions and historical data to provide practitioners with suggested diagnoses. It does not replace the doctor's judgment.",
    },
    {
      q: "What happens if the video connection drops?",
      a: "Our video implementation automatically adjusts quality based on bandwidth. If a drop occurs, the session is preserved, and our messaging fallback allows instant text communication until video is restored.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-slate-900 pr-8">{faq.q}</span>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0",
                    openIndex === i ? "rotate-90" : ""
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 pt-1 text-slate-500 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────
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

        <form
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Enter your work email"
            className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-teal-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            required
          />
          <Link
            to="/register"
            className="px-8 py-4 rounded-xl bg-white text-teal-600 font-bold shadow-xl hover:-translate-y-0.5 transition-all duration-200 shrink-0 flex items-center justify-center"
          >
            Get Early Access
          </Link>
        </form>
        <p className="text-sm text-teal-200 mt-4">14-day free trial. No credit card required.</p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────
const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <HeartPulse className="text-teal-400 w-6 h-6" />
            <span className="font-bold text-xl text-white">CareNet</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            AI-Enabled Smart Healthcare Platform designed for the modern era of telemedicine.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How it Works</a></li>
            <li><a href="#faq" className="hover:text-teal-400 transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">HIPAA Compliance</a></li>
            <li><a href="#" className="hover:text-teal-400 transition-colors">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} CareNet Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

// ─────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
