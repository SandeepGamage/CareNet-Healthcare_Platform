import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [smsTimer, setSmsTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [canRequestSms, setCanRequestSms] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: initialUserId, type, hasPhone } = location.state || {};
  const [currentUserId, setCurrentUserId] = useState(initialUserId);
  // verifyType tracks where the most recent OTP was sent
  const [verifyType, setVerifyType] = useState(type || 'email');

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login');
    }
  }, [currentUserId, navigate]);

  // Email resend countdown
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // SMS request countdown (independent)
  useEffect(() => {
    if (smsTimer <= 0) {
      setCanRequestSms(true);
      return;
    }
    const id = setInterval(() => setSmsTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [smsTimer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
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
      if (code.length !== 6) throw new Error('Please enter a 6-digit code');

      // Both email and phone OTPs use the same verify endpoint
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`, {
        userId: currentUserId,
        code,
      });

      if (response.data.success) {
        if (response.data.token) {
          setSuccess('Account verified! Logging you in...');
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          setSuccess('Account verified! Pending admin approval.');
          alert('Account verified! Please wait for admin approval before logging in.');
        }

        setTimeout(() => {
          if (!response.data.token) {
            navigate('/login');
          } else if (response.data.user.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, {
        userId: currentUserId,
        type: sendType, // 'email' or 'phone'
      });

      // IMPORTANT: Update the userId as the backend creates a new verification record
      if (res.data.userId) {
        setCurrentUserId(res.data.userId);
      }

      const actualSentVia = res.data.sentVia || sendType;
      setVerifyType(actualSentVia);

      if (sendType === 'phone' && actualSentVia === 'email') {
        setSuccess('SMS delivery failed — a new code has been sent to your email instead.');
      } else {
        setSuccess(res.data.message || `New code sent via ${actualSentVia === 'phone' ? 'SMS' : 'email'}.`);
      }

      // Reset timers based on what was actually sent
      if (actualSentVia === 'email') {
        setTimer(60);
        setCanResend(false);
      } else {
        setSmsTimer(60);
        setCanRequestSms(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const channelLabel = verifyType === 'phone' ? 'Phone (SMS)' : 'Email';
  const channelIcon = verifyType === 'phone'
    ? 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
    : 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-teal-500/10 p-10 border border-white/50">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={channelIcon} />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Verify Your Account</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            A 6-digit verification code was sent to your{' '}
            <strong className="text-teal-600">{channelLabel}</strong>.
            {verifyType === 'email' && (
              <span className="block mt-1 text-xs text-gray-400">Check your inbox (and spam folder).</span>
            )}
          </p>
        </div>

        {/* OTP Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 max-w-[320px] mx-auto">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl transition-all outline-none"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg">
              <p className="text-sm text-teal-700 font-semibold">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.some((d) => !d)}
            className={`w-full py-4 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transform transition-all active:scale-95 flex items-center justify-center gap-2 ${
              loading || otp.some((d) => !d) ? 'opacity-70 cursor-not-allowed' : ''
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

        {/* Resend / Alternate Options */}
        <div className="mt-8 space-y-3">
          <p className="text-center text-gray-500 text-sm">Didn't receive the code?</p>

          {/* Resend Email */}
          <button
            type="button"
            onClick={() => handleResend('email')}
            disabled={!canResend || loading}
            className={`w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              canResend
                ? 'border-teal-600 text-teal-600 hover:bg-teal-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {canResend ? 'Resend to Email' : `Resend Email in ${timer}s`}
          </button>

          {/* SMS option — only shown if user registered with a phone */}
          {hasPhone && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400">Or get it another way</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleResend('phone')}
                disabled={!canRequestSms || loading}
                className={`w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  canRequestSms
                    ? 'border-blue-500 text-blue-600 hover:bg-blue-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {canRequestSms ? 'Send OTP via SMS instead' : `SMS available in ${smsTimer}s`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
