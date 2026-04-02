import React, { useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Mail, Lock, User, ArrowLeft, ArrowRight, ShieldCheck, Stethoscope, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [role, setRole] = useState("patient");

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [googleRole, setGoogleRole] = useState("patient");
  const [googleSpecialty, setGoogleSpecialty] = useState("");

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());
        
        setGoogleData({
          name: userInfo.name,
          email: userInfo.email
        });
        setShowGoogleModal(true);
      } catch (err) {
        console.error("Google Info Fetch Failed:", err);
        alert("Failed to fetch Google profile. Please try again.");
      }
    },
    onError: (error) => {
      console.log("Google Register Failed:", error);
      alert("Google Registration failed. Please try again.");
    },
  });

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Generate a random secure password for Google users to satisfy backend requirements
      const randomPassword = Math.random().toString(36).slice(-12) + "A1!x"; 
      
      const response = await fetch("http://localhost:3006/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: googleData.name, 
          email: googleData.email, 
          password: randomPassword, 
          role: googleRole, 
          specialty: googleRole === 'doctor' ? googleSpecialty : null,
          phone: "0000000000" 
        }),
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setShowGoogleModal(false);
        setSuccessMsg(data.message || `Registration as ${googleRole} successful! Let's verify your email...`);
        // Wait to see the success message before redirecting
        setTimeout(() => navigate("/verify-otp", { state: { userId: data.userId, type: 'email', role: googleRole } }), 2000);
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
        console.error("Register Error:", err);
        alert("Unable to connect to the server.");
    } finally {
        setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const roleVal = formData.get("role");
    const email = formData.get("email");
    const password = formData.get("password");
    const specialty = formData.get("specialty") || null;
    const phone = formData.get("phone");
    
    if (name && email && password && roleVal && phone) {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const response = await fetch("http://localhost:3006/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role: roleVal, specialty, phone }),
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
          setSuccessMsg(data.message || `Registration as ${roleVal} successful! Let's verify your email...`);
          // Wait to see the success message before redirecting
          setTimeout(() => navigate("/verify-otp", { state: { userId: data.userId, type: 'email' } }), 2000);
        } else {
          setErrorMsg(data.message || "Registration failed. Please try again.");
        }
      } catch (err) {
        console.error("Register Error:", err);
        setErrorMsg("Unable to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
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
        className="w-full max-w-lg relative z-10"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-8 group"
        >
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

          <div className="space-y-4 mb-8">
            <button 
              type="button"
              onClick={handleGoogleRegister}
              className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or register with email</span>
          </div>

          <form className="space-y-5" onSubmit={handleEmailRegister}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-center text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-teal-50 text-teal-600 p-3 rounded-xl text-sm font-medium border border-teal-100 flex items-center justify-center text-center">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Role</label>
                <select 
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor / Professional</option>
                </select>
              </div>
            </div>

            {/* Conditional Specialty Field for Doctors */}
            <motion.div 
              initial={false}
              animate={{ height: role === "doctor" ? "auto" : 0, opacity: role === "doctor" ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pb-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Specialty</label>
                <div className="relative group">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    name="specialty"
                    placeholder="e.g. Cardiologist, General Physician"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    required={role === "doctor"}
                  />
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 8 characters"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            {role === "doctor" ? (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                <p><strong>Doctor accounts require verification.</strong> Once requested, administrators will review your credentials before full platform access is granted.</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/50 border border-teal-100 text-teal-800 text-xs leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0" />
                <p>By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is protected by end-to-end encryption.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl ${loading ? 'bg-teal-400' : 'bg-teal-500'} text-white font-bold shadow-lg shadow-teal-500/25 ${loading ? '' : 'hover:shadow-xl hover:-translate-y-0.5'} transition-all duration-300 flex items-center justify-center gap-2 group`}
            >
              {loading 
                ? "Processing..." 
                : (role === "doctor" ? "Request Professional Access" : "Create Account")
              }
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 font-bold hover:underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Google "Two-Step" Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Welcome, <span className="font-semibold text-slate-700">{googleData?.name}</span>! We just need a few more details to set up your CareNet account.
            </p>

            <form onSubmit={handleGoogleModalSubmit} className="space-y-4">
              <div className="space-y-2">
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

              {googleRole === "doctor" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Specialty</label>
                  <div className="relative group">
                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="e.g. Cardiologist"
                      value={googleSpecialty}
                      onChange={(e) => setGoogleSpecialty(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>
              )}


              <div className="pt-4 flex gap-3">
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
                  className={`w-2/3 py-3 rounded-2xl ${loading ? 'bg-teal-400' : 'bg-teal-500'} text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-teal-500/25`}
                >
                  {loading ? "Saving..." : "Complete Setup"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
