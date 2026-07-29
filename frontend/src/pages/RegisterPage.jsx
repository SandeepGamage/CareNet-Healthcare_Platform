import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Mail, Lock, User, ArrowLeft, ArrowRight,
  ShieldCheck, Stethoscope, Phone, Eye, EyeOff, AlertCircle, CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail  = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
// Sri Lanka: +94 followed by 9 digits (mobile starts with 7)
const isValidPhone  = (v) => /^(\+94|0094|0)?[\s\-]?7[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/.test(v.trim());
const isStrongPass  = (v) => v.length >= 8;

const validateRegisterForm = ({ name, email, phone, password, role, specialization, qualifications, experienceYears, consultationFee }) => {
  const errors = {};
  if (!name.trim())             errors.name = "Full name is required.";
  else if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!email.trim())            errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!phone.trim())            errors.phone = "Phone number is required.";
  else if (!isValidPhone(phone)) errors.phone = "Enter a valid Sri Lanka number (e.g. +94 77 123 4567).";

  if (!password)                errors.password = "Password is required.";
  else if (!isStrongPass(password)) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(password)) errors.password = "Include at least one uppercase letter.";
  else if (!/[0-9]/.test(password)) errors.password = "Include at least one number.";

  if (role === "doctor") {
    if (!specialization?.trim()) errors.specialization = "Specialization is required.";
    if (!qualifications?.trim()) errors.qualifications = "Qualifications is required.";
    if (!experienceYears) errors.experienceYears = "Experience is required.";
  }


  return errors;
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────
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

const inputCls = (hasError) =>
  `w-full pl-12 pr-10 py-3 rounded-2xl bg-slate-50 border transition-all focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300/30 focus:border-red-400"
      : "border-slate-200 focus:ring-teal-500/20 focus:border-teal-500"
  }`;

// ── Password strength bar ─────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)       score++;
  if (/[A-Z]/.test(password))     score++;
  if (/[0-9]/.test(password))     score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-teal-500"];
  return (
    <div className="mt-2 ml-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? "text-red-400" : score === 2 ? "text-amber-500" : score === 3 ? "text-yellow-500" : "text-teal-600"}`}>
        {labels[score]}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg]   = useState("");
  const [role, setRole]           = useState("patient");
  const [showPassword, setShowPassword] = useState(false);

  // Controlled field values
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("other");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null); // Now stores a File object

  // touch tracking
  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const liveErrors = validateRegisterForm({
    name, email, phone, password, role, specialization, qualifications, experienceYears, consultationFee
  });

  const getErr = (f) => (touched[f] ? liveErrors[f] : undefined);

  // ── Google Modal State ──────────────────────────────────────────────────────
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleData, setGoogleData]           = useState(null);
  const [googleRole, setGoogleRole]           = useState("patient");
  const [googleSpecialization, setGoogleSpecialization] = useState("");
  const [googleExperienceYears, setGoogleExperienceYears] = useState("");
  const [googlePhone, setGooglePhone]         = useState("");
  const [googlePhoneErr, setGooglePhoneErr]   = useState("");
  const [googleSpecErr, setGoogleSpecErr]     = useState("");
  const [googleQualifications, setGoogleQualifications] = useState("");
  const [googleQualErr, setGoogleQualErr]     = useState("");
  const [googleConsultationFee, setGoogleConsultationFee] = useState("");
  const [googleDateOfBirth, setGoogleDateOfBirth] = useState("");
  const [googleBloodGroup, setGoogleBloodGroup] = useState("");
  const [googleGender, setGoogleGender]       = useState("other");
  const [googleAddress, setGoogleAddress] = useState("");
  const [googleAllergies, setGoogleAllergies] = useState("");
  const [googleChronicConditions, setGoogleChronicConditions] = useState("");
  const [googleEmergencyContactName, setGoogleEmergencyContactName] = useState("");
  const [googleEmergencyContactPhone, setGoogleEmergencyContactPhone] = useState("");
  const [googleProfileImage, setGoogleProfileImage] = useState(null); // Now stores a File object

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());
        setGoogleData({ name: userInfo.name, email: userInfo.email });
        setGooglePhone("");
        setGooglePhoneErr("");
        setGoogleSpecialization("");
        setGoogleSpecErr("");
        setGoogleExperienceYears("");
        setGoogleQualifications("");
        setGoogleQualErr("");
        setGoogleConsultationFee("");
        setGoogleDateOfBirth("");
        setGoogleBloodGroup("");
        setGoogleGender("other");
        setGoogleAddress("");
        setGoogleAllergies("");
        setGoogleChronicConditions("");
        setGoogleEmergencyContactName("");
        setGoogleEmergencyContactPhone("");
        setGoogleProfileImage(null);
        setGoogleRole("patient");
        setShowGoogleModal(true);
      } catch {
        setServerError("Failed to fetch Google profile. Please try again.");
      }
    },
    onError: () => setServerError("Google Registration failed. Please try again."),
  });

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    let hasErr = false;

    if (!isValidPhone(googlePhone)) { setGooglePhoneErr("Enter a valid phone number (e.g. +94 77 123 4567)."); hasErr = true; }
    else setGooglePhoneErr("");

    if (googleRole === "doctor") {
      if (!googleSpecialization.trim()) { setGoogleSpecErr("Specialization is required."); hasErr = true; }
      else setGoogleSpecErr("");
      if (!googleQualifications.trim()) { setGoogleQualErr("Qualifications is required."); hasErr = true; }
      else setGoogleQualErr("");
    }

    if (hasErr) return;

    setLoading(true);
    try {
      const randomPassword = Math.random().toString(36).slice(-12) + "A1!x";
      const formData = new FormData();
      formData.append("name", googleData.name);
      formData.append("email", googleData.email);
      formData.append("password", randomPassword);
      formData.append("role", googleRole);
      formData.append("phone", googlePhone);
      
      if (googleRole === "doctor") {
        formData.append("specialization", googleSpecialization);
        formData.append("qualifications", googleQualifications);
        formData.append("experienceYears", googleExperienceYears || 0);
        formData.append("consultationFee", googleConsultationFee || 0);
      } else {
        formData.append("dateOfBirth", googleDateOfBirth);
        formData.append("bloodGroup", googleBloodGroup);
        formData.append("gender", googleGender || "other");
        formData.append("address", googleAddress);
        formData.append("allergies", googleAllergies);
        formData.append("chronicConditions", googleChronicConditions);
        formData.append("emergencyContactName", googleEmergencyContactName);
        formData.append("emergencyContactPhone", googleEmergencyContactPhone);
      }

      if (googleProfileImage) {
        formData.append("profileImage", googleProfileImage);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowGoogleModal(false);
        setSuccessMsg(data.message || "Registration successful! Verification code sent.");
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
      setLoading(false);
    }
  };

  // ── Email Register ──────────────────────────────────────────────────────────
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    setTouched({ name: true, email: true, phone: true, password: true, specialization: true, qualifications: true, experienceYears: true });
    const errs = validateRegisterForm({ name, email, phone, password, role, specialization, qualifications, experienceYears, consultationFee });
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("role", role);
      formData.append("phone", phone.trim());

      if (role === "doctor") {
        formData.append("specialization", specialization);
        formData.append("qualifications", qualifications);
        formData.append("experienceYears", experienceYears || 0);
        formData.append("consultationFee", consultationFee || 0);
      } else {
        formData.append("dateOfBirth", dateOfBirth);
        formData.append("bloodGroup", bloodGroup);
        formData.append("gender", gender || "other");
        formData.append("address", address);
        formData.append("allergies", allergies);
        formData.append("chronicConditions", chronicConditions);
        formData.append("emergencyContactName", emergencyContactName);
        formData.append("emergencyContactPhone", emergencyContactPhone);
      }

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(data.message || "Registration successful! Verification code sent.");
        setTimeout(() =>
          navigate("/verify-otp", { state: { userId: data.userId, type: data.type || "email", hasPhone: data.hasPhone || false } }), 2000
        );
      } else {
        setServerError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setServerError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/30 flex items-center justify-center p-4 relative overflow-hidden mt-8 mb-8">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl sm:max-w-2xl relative z-10"
      >
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-teal-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Register Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-teal-500/10 border border-white/50">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg mb-4">
              <HeartPulse className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 text-center">Join CareNet</h1>
            <p className="text-slate-500 mt-2 text-center">Start your advanced healthcare journey today</p>
          </div>

          {/* Google Button */}
          <div className="mb-8">
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or register with email</span>
          </div>

          {/* Server Banners */}
          <AnimatePresence>
            {serverError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{serverError}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 bg-teal-50 text-teal-600 p-3 rounded-xl text-sm font-medium border border-teal-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleEmailRegister} noValidate>

            {/* Name + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("name") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => touch("name")}
                    className={inputCls(!!getErr("name"))}
                  />
                </div>
                <FieldError msg={getErr("name")} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor / Professional</option>
                </select>
              </div>
            </div>

            {/* Doctor specific fields */}
            <AnimatePresence>
              {role === "doctor" && (
                <motion.div
                  key="doctor-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Specialization</label>
                      <div className="relative group">
                        <Stethoscope className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("specialization") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                        <input
                          type="text"
                          placeholder="e.g. Cardiologist"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          onBlur={() => touch("specialization")}
                          className={inputCls(!!getErr("specialization"))}
                        />
                      </div>
                      <FieldError msg={getErr("specialization")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Consultation Fee (LKR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className={inputCls(false)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Qualifications</label>
                      <input
                        type="text"
                        placeholder="e.g. MBBS, MD"
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        onBlur={() => touch("qualifications")}
                        className={inputCls(!!getErr("qualifications"))}
                      />
                      <FieldError msg={getErr("qualifications")} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Experience (Years)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        onBlur={() => touch("experienceYears")}
                        className={inputCls(!!getErr("experienceYears"))}
                      />
                      <FieldError msg={getErr("experienceYears")} />
                    </div>
                  </div>

                  <div className="space-y-1 pb-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Profile Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files[0])}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Patient specific fields */}
            <AnimatePresence>
              {role === "patient" && (
                <motion.div
                  key="patient-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden pt-1"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
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
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Home Address</label>
                    <input
                      type="text"
                      placeholder="Street, City, Province"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputCls(false)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Emergency Contact Name</label>
                      <input
                        type="text"
                        placeholder="Guardian / Spouse Name"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className={inputCls(false)}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className={inputCls(false)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Allergies (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Peanuts, Penicillin"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className={inputCls(false)}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Chronic Conditions</label>
                      <input
                        type="text"
                        placeholder="e.g. Diabetes, Asthma"
                        value={chronicConditions}
                        onChange={(e) => setChronicConditions(e.target.value)}
                        className={inputCls(false)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Profile Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files[0])}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("phone") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => touch("phone")}
                  className={inputCls(!!getErr("phone"))}
                />
              </div>
              <FieldError msg={getErr("phone")} />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("email") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch("email")}
                  className={inputCls(!!getErr("email"))}
                />
              </div>
              <FieldError msg={getErr("email")} />
            </div>

            {/* Password + strength */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${getErr("password") ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  className={inputCls(!!getErr("password"))}
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
              <PasswordStrength password={password} />
            </div>

            {/* Notice */}
            {role === "doctor" ? (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p><strong>Doctor accounts require verification.</strong> Administrators will review your credentials before full access is granted.</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/50 border border-teal-100 text-teal-800 text-xs leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p>By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is protected by end-to-end encryption.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl ${loading ? "bg-teal-400" : "bg-teal-500"} text-white font-bold shadow-lg shadow-teal-500/25 ${loading ? "" : "hover:shadow-xl hover:-translate-y-0.5"} transition-all duration-300 flex items-center justify-center gap-2 group`}
            >
              {loading ? "Processing..." : role === "doctor" ? "Request Professional Access" : "Create Account"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 font-bold hover:underline underline-offset-4">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Google Profile Completion Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg sm:max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto my-auto"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Complete Your Profile</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Welcome, <span className="font-semibold text-slate-700">{googleData?.name}</span>! We need a few more details to set up your account.
              </p>

              <form onSubmit={handleGoogleModalSubmit} className="space-y-4" noValidate>
                {/* Role */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Role</label>
                  <select
                    value={googleRole}
                    onChange={(e) => setGoogleRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm font-medium"
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
                          <label className="text-sm font-semibold text-slate-700 ml-1">Specialization</label>
                          <div className="relative group">
                            <Stethoscope className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${googleSpecErr ? "text-red-400" : "text-slate-400 group-focus-within:text-teal-500"}`} />
                            <input
                              type="text" placeholder="e.g. Cardiologist"
                              value={googleSpecialization}
                              onChange={(e) => { setGoogleSpecialization(e.target.value); setGoogleSpecErr(""); }}
                              className={inputCls(!!googleSpecErr)}
                            />
                          </div>
                          <FieldError msg={googleSpecErr} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Consultation Fee (LKR)</label>
                          <input
                            type="number" placeholder="e.g. 1500"
                            value={googleConsultationFee}
                            onChange={(e) => setGoogleConsultationFee(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Qualifications</label>
                          <input
                            type="text" placeholder="e.g. MBBS, MD"
                            value={googleQualifications}
                            onChange={(e) => { setGoogleQualifications(e.target.value); setGoogleQualErr(""); }}
                            className={inputCls(!!googleQualErr)}
                          />
                          <FieldError msg={googleQualErr} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Experience (Years)</label>
                          <input
                            type="number" placeholder="e.g. 5"
                            value={googleExperienceYears}
                            onChange={(e) => { setGoogleExperienceYears(e.target.value); }}
                            className={inputCls(false)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pb-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Profile Image (Optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setGoogleProfileImage(e.target.files[0])}
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
                        />
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
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Date of Birth</label>
                          <input
                            type="date"
                            value={googleDateOfBirth}
                            onChange={(e) => setGoogleDateOfBirth(e.target.value)}
                            className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Blood Group</label>
                          <select
                            value={googleBloodGroup}
                            onChange={(e) => setGoogleBloodGroup(e.target.value)}
                            className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
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
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Home Address</label>
                        <input
                          type="text"
                          placeholder="Street, City, Province"
                          value={googleAddress}
                          onChange={(e) => setGoogleAddress(e.target.value)}
                          className={inputCls(false)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Emergency Contact Name</label>
                          <input
                            type="text"
                            placeholder="Guardian / Spouse Name"
                            value={googleEmergencyContactName}
                            onChange={(e) => setGoogleEmergencyContactName(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Emergency Contact Phone</label>
                          <input
                            type="tel"
                            placeholder="+94 77 123 4567"
                            value={googleEmergencyContactPhone}
                            onChange={(e) => setGoogleEmergencyContactPhone(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Allergies (comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Peanuts, Penicillin"
                            value={googleAllergies}
                            onChange={(e) => setGoogleAllergies(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <label className="text-sm font-semibold text-slate-700 ml-1 block truncate">Chronic Conditions</label>
                          <input
                            type="text"
                            placeholder="e.g. Diabetes, Asthma"
                            value={googleChronicConditions}
                            onChange={(e) => setGoogleChronicConditions(e.target.value)}
                            className={inputCls(false)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Profile Image (Optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setGoogleProfileImage(e.target.files[0])}
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all"
                        />
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
                      type="tel"
                      placeholder="+94 77 123 4567"
                      value={googlePhone}
                      onChange={(e) => { setGooglePhone(e.target.value); setGooglePhoneErr(""); }}
                      className={inputCls(!!googlePhoneErr)}
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
                    disabled={loading}
                    className={`w-2/3 py-3 rounded-2xl ${loading ? "bg-teal-400" : "bg-teal-500"} text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-teal-500/25`}
                  >
                    {loading ? "Creating Account..." : "Create Account & Verify"}
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

export default RegisterPage;
