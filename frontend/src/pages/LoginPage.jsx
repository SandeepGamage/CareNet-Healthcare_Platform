import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Mail, Lock, ArrowLeft, ArrowRight,
  Eye, EyeOff, AlertCircle, KeyRound, X, CheckCircle2,
  RefreshCw, ShieldCheck, Stethoscope, Phone, User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

// Phone validation (Sri Lanka)
const isValidPhone = (v) => /^(\+94|0094|0)?[\s\-]?7[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/.test(v.trim());

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
};

// ── Small helper components ───────────────────────────────────────────────────
const FieldError = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="flex items-center gap-1 text-xs text-red-500 mt-1 ml-1"
      >
        <AlertCircle className="w-3 h-3 shrink-0" />
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

const inputClass = (hasError) =>
  `w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 border transition-all focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300/30 focus:border-red-400"
      : "border-slate-200 focus:ring-teal-500/20 focus:border-teal-500"
  }`;

const modalInputClass = (hasError) =>
  `w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border transition-all focus:outline-none focus:ring-2 text-sm ${
    hasError
      ? "border-red-400 focus:ring-red-300/30 focus:border-red-400"
      : "border-slate-200 focus:ring-teal-500/20 focus:border-teal-500"
  }`;

// ── Step indicator pill ───────────────────────────────────────────────────────
const StepPill = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-400 ${
          i < current ? "bg-teal-500 w-8" : i === current ? "bg-teal-400 w-8" : "bg-slate-200 w-4"
        }`}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Field values
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Per-field errors (shown on blur or submit)
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const liveErrors = validateLoginForm({ email, password });
  const getErr = (field) => (touched[field] ? liveErrors[field] : undefined);

  // ── Google Registration Modal State ──────────────────────────────────────────
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [googleRole, setGoogleRole] = useState("patient");
  const [googlePhone, setGooglePhone] = useState("");
  const [googlePhoneErr, setGooglePhoneErr] = useState("");
  const [googleSpecialty, setGoogleSpecialty] = useState("");
  const [googleSpecErr, setGoogleSpecErr] = useState("");
  const [googleQualifications, setGoogleQualifications] = useState("");
  const [googleQualErr, setGoogleQualErr] = useState("");
  const [googleConsultationFee, setGoogleConsultationFee] = useState("");
  const [googleDateOfBirth, setGoogleDateOfBirth] = useState("");
  const [googleBloodGroup, setGoogleBloodGroup] = useState("");
  const [googleGender, setGoogleGender] = useState("other");
  const [googleModalLoading, setGoogleModalLoading] = useState(false);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState("");

  // ── Forgot Password State ────────────────────────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep]         = useState(1);   // 1 = email, 2 = otp + new pass

  const [fpEmail, setFpEmail]           = useState("");
  const [fpEmailError, setFpEmailError] = useState("");

  const [fpOtp, setFpOtp]               = useState("");
  const [fpNewPass, setFpNewPass]       = useState("");
  const [fpConfirmPass, setFpConfirmPass] = useState("");
  const [fpShowPass, setFpShowPass]     = useState(false);
  const [fpResetToken, setFpResetToken] = useState("");

  const [fpLoading, setFpLoading]   = useState(false);
  const [fpError, setFpError]       = useState("");
  const [fpSuccess, setFpSuccess]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const closeForgot = () => {
    setShowForgot(false);
    setTimeout(() => {
      setFpStep(1);
      setFpEmail(""); setFpEmailError(""); setFpOtp("");
      setFpNewPass(""); setFpConfirmPass(""); setFpResetToken("");
      setFpError(""); setFpSuccess(false); setFpLoading(false);
      setResendCooldown(0);
    }, 300);
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Step 1 – request reset code
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setFpError("");
    if (!fpEmail.trim()) { setFpEmailError("Email is required."); return; }
    if (!isValidEmail(fpEmail)) { setFpEmailError("Enter a valid email address."); return; }
    setFpEmailError("");
    setFpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFpResetToken(data.resetToken || "");
        setFpStep(2);
        startResendCooldown();
      } else {
        setFpError(data.message || "Failed to send reset code.");
      }
    } catch {
      setFpError("Unable to connect. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // Resend from step 2
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setFpError(""); setFpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFpResetToken(data.resetToken || "");
        setFpOtp("");
        startResendCooldown();
      } else {
        setFpError(data.message || "Failed to resend code.");
      }
    } catch {
      setFpError("Unable to connect. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // Step 2 – submit OTP + new password
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setFpError("");
    if (fpOtp.length !== 6)           { setFpError("Enter the 6-digit reset code."); return; }
    if (fpNewPass.length < 8)         { setFpError("Password must be at least 8 characters."); return; }
    if (fpNewPass !== fpConfirmPass)  { setFpError("Passwords do not match."); return; }
    setFpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: fpResetToken, code: fpOtp, newPassword: fpNewPass }),
      });
      const data = await res.json();
      if (data.success) {
        setFpSuccess(true);
      } else {
        setFpError(data.message || "Reset failed. Please try again.");
      }
    } catch {
      setFpError("Unable to connect. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Google Login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userInfo.email, isGoogle: true }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          redirectByRole(data.user.role);
        } else {
          // User not found → show registration modal with Google profile info
          setGoogleData({ name: userInfo.name, email: userInfo.email });
          setGooglePhone("");
          setGooglePhoneErr("");
          setGoogleSpecialty("");
          setGoogleSpecErr("");
          setGoogleQualifications("");
          setGoogleQualErr("");
          setGoogleConsultationFee("");
          setGoogleDateOfBirth("");
          setGoogleBloodGroup("");
          setGoogleGender("other");
          setGoogleRole("patient");
          setGoogleSuccessMsg("");
          setShowGoogleModal(true);
        }
      } catch {
        setServerError("Google Login failed. Please try again.");
      }
    },
    onError: () => setServerError("Google Login failed. Please try again."),
  });

  // ── Google Modal Submit (register new user) ────────────────────────────────
  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    let hasErr = false;

    if (!isValidPhone(googlePhone)) { setGooglePhoneErr("Enter a valid phone number (e.g. +94 77 123 4567)."); hasErr = true; }
    else setGooglePhoneErr("");

    if (googleRole === "doctor") {
      if (!googleSpecialty.trim()) { setGoogleSpecErr("Specialty is required."); hasErr = true; }
      else setGoogleSpecErr("");
      if (!googleQualifications.trim()) { setGoogleQualErr("Qualifications is required."); hasErr = true; }
      else setGoogleQualErr("");
    }

    if (hasErr) return;

    setGoogleModalLoading(true);
    try {
      const randomPassword = Math.random().toString(36).slice(-12) + "A1!x";
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleData.name,
          email: googleData.email,
          password: randomPassword,
          role: googleRole,
          phone: googlePhone,
          specialty: googleRole === "doctor" ? googleSpecialty : null,
          qualifications: googleRole === "doctor" ? googleQualifications : null,
          consultationFee: googleRole === "doctor" ? googleConsultationFee : null,
          dateOfBirth: googleRole === "patient" ? googleDateOfBirth : null,
          bloodGroup: googleRole === "patient" ? googleBloodGroup : null,
          gender: googleRole === "patient" ? googleGender : null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowGoogleModal(false);
        setGoogleSuccessMsg(data.message || "Registration successful! Verification code sent.");
        setTimeout(() =>
          navigate("/verify-otp", {
            state: { userId: data.userId, type: data.type || "email", hasPhone: data.hasPhone || false, role: googleRole },
          }), 2000
        );
      } else {
        setServerError(data.message || "Registration failed. Please try again.");
        setShowGoogleModal(false);
      }
    } catch {
      setServerError("Unable to connect to the server.");
      setShowGoogleModal(false);
    } finally {
      setGoogleModalLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === "admin") navigate("/admin-dashboard");
    else if (role === "doctor") navigate("/doctor-dashboard");
    else navigate("/patient-dashboard");
  };

  // ── Email Login ─────────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setServerError("");

    setTouched({ email: true, password: true });
    const validationErrors = validateLoginForm({ email, password });
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (data.requiresOtp) {
        setServerError("Your account isn't verified yet. Redirecting to OTP verification...");
        setTimeout(() =>
          navigate("/verify-otp", {
            state: { userId: data.userId, type: "email", hasPhone: data.hasPhone || false },
          }), 1800
        );
        return;
      }

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        redirectByRole(data.user.role);
      } else {
        setServerError(data.message || "Login failed. Please check your credentials.");
      }
    } catch {
      setServerError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-teal-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-teal-500/10 border border-white/50">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg mb-4">
              <HeartPulse className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Log in to your CareNet account</p>
          </div>

          {/* Google Button */}
          <div className="mb-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
          </div>

          {/* Server Error Banner */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-5" onSubmit={handleEmailLogin} noValidate>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("email") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setServerError(""); }}
                  onBlur={() => touch("email")}
                  className={inputClass(!!getErr("email"))}
                />
              </div>
              <FieldError msg={getErr("email")} />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors focus:outline-none focus:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("password") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setServerError(""); }}
                  onBlur={() => touch("password")}
                  className={inputClass(!!getErr("password"))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={getErr("password")} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl ${loading ? "bg-teal-400" : "bg-teal-500"} text-white font-bold shadow-lg shadow-teal-500/25 ${loading ? "" : "hover:shadow-xl hover:-translate-y-0.5"} transition-all duration-300 flex items-center justify-center gap-2 group`}
            >
              {loading ? "Signing In..." : "Sign In"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-teal-600 font-bold hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Forgot Password Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForgot && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeForgot}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              key="fp-modal"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 pointer-events-auto overflow-hidden">

                {/* Modal Header */}
                <div className="relative bg-gradient-to-r from-teal-500 to-blue-500 px-6 pt-7 pb-8">
                  <button
                    id="close-forgot-modal-btn"
                    onClick={closeForgot}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {fpSuccess ? "All Done!" : "Reset Password"}
                  </h2>
                  <p className="text-teal-100 text-sm mt-1">
                    {fpSuccess
                      ? "Your password has been reset successfully."
                      : fpStep === 1
                        ? "Enter your email and we'll send a 6-digit reset code."
                        : `Check your inbox at ${fpEmail} for the reset code.`}
                  </p>
                </div>

                {/* Step Pills (only when not success) */}
                {!fpSuccess && (
                  <div className="px-6 pt-5">
                    <StepPill current={fpStep - 1} total={2} />
                  </div>
                )}

                {/* Modal Body */}
                <div className="px-6 pb-7">
                  <AnimatePresence mode="wait">

                    {/* ── SUCCESS STATE ─────────────────────────────── */}
                    {fpSuccess && (
                      <motion.div
                        key="fp-success"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center py-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-9 h-9 text-teal-500" />
                        </div>
                        <p className="text-slate-700 font-semibold text-base mb-1">Password Updated</p>
                        <p className="text-slate-500 text-sm mb-6">
                          You can now log in with your new password.
                        </p>
                        <button
                          id="fp-go-signin-btn"
                          onClick={closeForgot}
                          className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5"
                        >
                          Back to Sign In
                        </button>
                      </motion.div>
                    )}

                    {/* ── STEP 1: Email ─────────────────────────────── */}
                    {!fpSuccess && fpStep === 1 && (
                      <motion.form
                        key="fp-step1"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.22 }}
                        onSubmit={handleForgotRequest}
                        noValidate
                        className="space-y-4"
                      >
                        {/* Error */}
                        <AnimatePresence>
                          {fpError && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl border border-red-100"
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {fpError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${fpEmailError ? "text-red-400" : "text-slate-400"}`} />
                            <input
                              id="fp-email-input"
                              type="email"
                              placeholder="name@example.com"
                              value={fpEmail}
                              onChange={(e) => { setFpEmail(e.target.value); setFpEmailError(""); setFpError(""); }}
                              className={modalInputClass(!!fpEmailError)}
                              autoFocus
                            />
                          </div>
                          <FieldError msg={fpEmailError} />
                        </div>

                        <button
                          id="fp-send-code-btn"
                          type="submit"
                          disabled={fpLoading}
                          className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          {fpLoading ? (
                            <>
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                                className="inline-block"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </motion.span>
                              Sending…
                            </>
                          ) : (
                            <>Send Reset Code <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* ── STEP 2: OTP + New Password ────────────────── */}
                    {!fpSuccess && fpStep === 2 && (
                      <motion.form
                        key="fp-step2"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.22 }}
                        onSubmit={handleForgotReset}
                        noValidate
                        className="space-y-4"
                      >
                        {/* Error */}
                        <AnimatePresence>
                          {fpError && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 bg-red-50 text-red-600 text-xs font-medium p-3 rounded-xl border border-red-100"
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {fpError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 6-digit OTP */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">
                            6-Digit Reset Code
                          </label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              id="fp-otp-input"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="123456"
                              value={fpOtp}
                              onChange={(e) => { setFpOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setFpError(""); }}
                              className={`${modalInputClass(false)} tracking-[0.3em] font-mono text-center`}
                              autoFocus
                            />
                          </div>
                          {/* Resend */}
                          <div className="flex justify-end mt-1.5">
                            <button
                              id="fp-resend-btn"
                              type="button"
                              onClick={handleResend}
                              disabled={resendCooldown > 0 || fpLoading}
                              className={`text-xs font-semibold transition-colors ${
                                resendCooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-teal-600 hover:text-teal-700"
                              }`}
                            >
                              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              id="fp-new-password-input"
                              type={fpShowPass ? "text" : "password"}
                              placeholder="Min. 8 characters"
                              value={fpNewPass}
                              onChange={(e) => { setFpNewPass(e.target.value); setFpError(""); }}
                              className={`${modalInputClass(false)} pr-10`}
                            />
                            <button
                              type="button"
                              onClick={() => setFpShowPass((v) => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                              tabIndex={-1}
                            >
                              {fpShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-0.5">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              id="fp-confirm-password-input"
                              type={fpShowPass ? "text" : "password"}
                              placeholder="Re-enter password"
                              value={fpConfirmPass}
                              onChange={(e) => { setFpConfirmPass(e.target.value); setFpError(""); }}
                              className={`${modalInputClass(
                                !!(fpConfirmPass && fpNewPass !== fpConfirmPass)
                              )} pr-10`}
                            />
                            {fpConfirmPass && fpNewPass === fpConfirmPass && (
                              <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                            )}
                          </div>
                          {fpConfirmPass && fpNewPass !== fpConfirmPass && (
                            <p className="text-xs text-red-500 mt-1 ml-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Passwords do not match
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            id="fp-back-btn"
                            type="button"
                            onClick={() => { setFpStep(1); setFpError(""); setFpOtp(""); setFpNewPass(""); setFpConfirmPass(""); }}
                            className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            id="fp-reset-btn"
                            type="submit"
                            disabled={fpLoading}
                            className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            {fpLoading ? (
                              <>
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                                  className="inline-block"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </motion.span>
                                Resetting…
                              </>
                            ) : (
                              "Reset Password"
                            )}
                          </button>
                        </div>
                      </motion.form>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Google Profile Completion Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Complete Your Profile</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Welcome, <span className="font-semibold text-slate-700">{googleData?.name}</span>! No account found for <span className="font-semibold text-teal-600">{googleData?.email}</span>. Fill in the details below to create your account.
              </p>

              {googleSuccessMsg && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 bg-teal-50 text-teal-600 p-3 rounded-xl text-sm font-medium border border-teal-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{googleSuccessMsg}
                </motion.div>
              )}

              <form onSubmit={handleGoogleModalSubmit} className="space-y-4" noValidate>
                {/* Role */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Role</label>
                  <select
                    value={googleRole}
                    onChange={(e) => setGoogleRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor / Professional</option>
                  </select>
                </div>

                {/* Doctor-specific fields */}
                <AnimatePresence>
                  {googleRole === "doctor" && (
                    <motion.div
                      key="google-doctor-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Specialty</label>
                          <div className="relative group">
                            <Stethoscope className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${googleSpecErr ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                            <input
                              type="text" placeholder="e.g. Cardiologist"
                              value={googleSpecialty}
                              onChange={(e) => { setGoogleSpecialty(e.target.value); setGoogleSpecErr(""); }}
                              className={modalInputClass(!!googleSpecErr)}
                            />
                          </div>
                          <FieldError msg={googleSpecErr} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Fee (LKR)</label>
                          <input
                            type="number" placeholder="e.g. 1500"
                            value={googleConsultationFee}
                            onChange={(e) => setGoogleConsultationFee(e.target.value)}
                            className={modalInputClass(false)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Qualifications</label>
                        <input
                          type="text" placeholder="e.g. MBBS, MD"
                          value={googleQualifications}
                          onChange={(e) => { setGoogleQualifications(e.target.value); setGoogleQualErr(""); }}
                          className={modalInputClass(!!googleQualErr)}
                        />
                        <FieldError msg={googleQualErr} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Patient-specific fields */}
                <AnimatePresence>
                  {googleRole === "patient" && (
                    <motion.div
                      key="google-patient-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Date of Birth</label>
                          <input
                            type="date"
                            value={googleDateOfBirth}
                            onChange={(e) => setGoogleDateOfBirth(e.target.value)}
                            className={modalInputClass(false)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Blood Group</label>
                          <select
                            value={googleBloodGroup}
                            onChange={(e) => setGoogleBloodGroup(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
                          >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
                        <select
                          value={googleGender}
                          onChange={(e) => setGoogleGender(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${googlePhoneErr ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                    <input
                      type="tel" placeholder="+94 77 123 4567"
                      value={googlePhone}
                      onChange={(e) => { setGooglePhone(e.target.value); setGooglePhoneErr(""); }}
                      className={modalInputClass(!!googlePhoneErr)}
                    />
                  </div>
                  <FieldError msg={googlePhoneErr} />
                </div>

                {/* Notice */}
                {googleRole === "doctor" ? (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                    <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p><strong>Doctor accounts require verification.</strong> Administrators will review your credentials before full access is granted.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/50 border border-teal-100 text-teal-800 text-xs leading-relaxed">
                    <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="w-1/3 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={googleModalLoading}
                    className={`w-2/3 py-3 rounded-2xl ${googleModalLoading ? "bg-teal-400" : "bg-teal-500"} text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-teal-500/25`}
                  >
                    {googleModalLoading ? "Creating Account..." : "Create Account & Verify"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
