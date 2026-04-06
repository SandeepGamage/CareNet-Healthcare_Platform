import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [smsTimer, setSmsTimer] = useState(20);
  const [canResend, setCanResend] = useState(false);
  const [canRequestSms, setCanRequestSms] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, type } = location.state || {}; // type: 'email' or 'phone'
  const [verifyType, setVerifyType] = useState(type || 'email');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
        if (smsTimer > 0) setSmsTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }

    if (smsTimer === 0) {
      setCanRequestSms(true);
    }

    return () => clearInterval(interval);
  }, [timer, smsTimer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const code = otp.join('');
      if (code.length !== 6) {
        throw new Error('Please enter a 6-digit code');
      }

      const endpoint = verifyType === 'email' ? '/api/auth/verify-email' : '/api/auth/verify-phone';
      const response = await axios.post(`http://localhost:3001${endpoint}`, {
        userId,
        code
      });

      if (response.data.success) {
        if (response.data.token) {
          setSuccess(`${verifyType.charAt(0).toUpperCase() + verifyType.slice(1)} verified! Logging you in...`);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          alert("Successfully authenticated!");
        } else {
          setSuccess(`${verifyType.charAt(0).toUpperCase() + verifyType.slice(1)} verified! Pending admin approval.`);
          alert("Account verified! Please wait for admin approval before logging in.");
        }

        setTimeout(() => {
          if (!response.data.token) {
            navigate('/login');
          } else if (response.data.user.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            // Default to patient dashboard
            navigate('/patient-dashboard');
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (sendType) => {
    if (sendType === 'email' && !canResend) return;
    if (sendType === 'phone' && !canRequestSms) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:3001/api/auth/resend-otp`, {
        userId,
        type: sendType // 'email' or 'phone'
      });
      setSuccess(`A new verification code has been sent via ${sendType === 'phone' ? 'SMS' : 'Email'}`);
      setVerifyType(sendType); // update current type
      
      if (sendType === 'email') {
        setTimer(60);
        setCanResend(false);
      } else {
        setSmsTimer(60); // Reset SMS timer after request
        setCanRequestSms(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Verify Your Account</h2>
          <p className="text-gray-500 mt-2">
            Verification code sent to your <strong>{verifyType === 'email' ? 'Email' : 'Phone'}</strong> by default.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 max-w-[320px] mx-auto">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-100 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl transition-all outline-none"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg animate-pulse">
              <p className="text-sm text-emerald-700 font-semibold">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.some((d) => !d)}
            className={`w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transform transition-all active:scale-95 flex items-center justify-center gap-2 ${
              (loading || otp.some((d) => !d)) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-4">
          <div className="space-y-1">
             <p className="text-gray-600 text-sm">Didn't receive the email code?</p>
             <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleResend('email')}
                  disabled={!canResend || loading}
                  className={`text-sm font-bold transition-all ${
                    canResend ? 'text-emerald-600 hover:underline' : 'text-gray-400'
                  }`}
                >
                  {canResend ? 'Resend Email' : `Resend Email in ${timer}s`}
                </button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <span className="relative px-2 bg-white text-xs text-gray-400">OR</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleResend('phone')}
                  disabled={!canRequestSms || loading}
                  className={`py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                    canRequestSms 
                      ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-50' 
                      : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {canRequestSms ? 'Get via SMS to Phone' : `SMS available in ${smsTimer}s`}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default OtpVerification;
