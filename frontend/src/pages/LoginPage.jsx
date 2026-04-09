import React, { useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Mail, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const response = await fetch("http://localhost:3001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userInfo.email, isGoogle: true }),
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
           localStorage.setItem("token", data.token);
           localStorage.setItem("user", JSON.stringify(data.user));
           alert("Successfully authenticated with Google!");
           
            if (data.user.role === 'admin') {
              navigate("/admin-dashboard");
            } else if (data.user.role === 'doctor') {
              navigate("/doctor-dashboard");
            } else {
              navigate("/patient-dashboard");
            }
        } else {
           alert(data.message || "Login failed. You might need to Register first.");
        }
      } catch (err) {
        console.error("Google Login Error:", err);
        alert("Google Login failed. Please try again.");
      }
    },
  });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    if (!email || !password) {
      setErrorMsg("Credentials missing.");
      return;
    }

    if (email && password) {
      setLoading(true);
      setErrorMsg("");

      try {
        const response = await fetch("http://localhost:3001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.requiresVerification) {
             setErrorMsg(data.message);
             setTimeout(() => navigate('/verify-otp', { state: { userId: data.userId, type: 'email' } }), 1500);
          } else {
             localStorage.setItem("token", data.token);
             localStorage.setItem("user", JSON.stringify(data.user));
             alert("Successfully authenticated!");
             console.log("Login Success, User Role:", data.user.role);
             alert(`Authenticated as ${data.user.role}! Redirecting...`);
             
             if (data.user.role === 'admin') {
               navigate("/admin-dashboard");
             } else if (data.user.role === 'doctor') {
               navigate("/doctor-dashboard");
             } else {
               navigate("/patient-dashboard");
             }
          }
        } else {
          setErrorMsg(data.message || "Login failed. Please check your credentials.");
        }
      } catch (err) {
        console.error("Login Error:", err);
        setErrorMsg("Unable to connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
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
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-8 group"
        >
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

          <div className="space-y-4 mb-8">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3 group"
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
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
          </div>

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-center">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Forgot Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl ${loading ? 'bg-teal-400' : 'bg-teal-500'} text-white font-bold shadow-lg shadow-teal-500/25 ${loading ? '' : 'hover:shadow-xl hover:-translate-y-0.5'} transition-all duration-300 flex items-center justify-center gap-2 group`}
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
    </div>
  );
};

export default LoginPage;
