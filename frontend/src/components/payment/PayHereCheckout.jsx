import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const PayHereCheckout = ({ appointmentId, doctorId, amount, patientDetails, doctorName }) => {
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const hasInitialized = useRef(false);

  const returnUrl = `${window.location.origin}/patient-dashboard`;

  useEffect(() => {
    if (!appointmentId || hasInitialized.current) return;
    hasInitialized.current = true;

    const initPayment = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const res = await fetch('http://localhost:3005/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentId,
            doctorId: doctorId || appointmentId,
            amount: parseFloat(amount),
            currency: 'LKR',
            metadata: { doctorName },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to initialize payment');
        }

        if (data.success) {
          setCheckoutData(data);
        }
      } catch (err) {
        console.error('Payment initialization failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [appointmentId, doctorId, amount, doctorName]);

  const handleStartPayHerePayment = () => {
    if (!window.payhere) {
      setError("PayHere SDK is not loaded. Please try again.");
      return;
    }

    const payment = {
      sandbox: true,
      merchant_id: checkoutData.merchantId,
      return_url: returnUrl,
      cancel_url: returnUrl,
      notify_url: 'http://localhost:3005/api/payments/payhere/notify',
      order_id: checkoutData.orderId,
      items: `Consultation - ${doctorName}`,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      hash: checkoutData.hash,
      first_name: patientDetails?.firstName || 'Patient',
      last_name: patientDetails?.lastName || 'User',
      email: patientDetails?.email || 'patient@carenet.com',
      phone: patientDetails?.phone || '0771234567',
      address: patientDetails?.address || 'No. 1, Colombo Road',
      city: patientDetails?.city || 'Colombo',
      country: 'Sri Lanka'
    };

    window.payhere.onCompleted = async function onCompleted(orderId) {
      console.log("Payment completed. OrderID:" + orderId);
      try {
        setProcessing(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3005/api/payments/complete-sandbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ appointmentId: orderId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Payment processing failed');
        }
        setSuccess(true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 1500);
      } catch (err) {
        console.error('Payment completion error:', err);
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    window.payhere.onDismissed = function onDismissed() {
      console.log("Payment dismissed");
      setError("Payment window was closed by the user.");
    };

    window.payhere.onError = function onError(errStr) {
      console.log("Error:" + errStr);
      setError("PayHere error: " + errStr);
    };

    window.payhere.startPayment(payment);
  };

  if (loading) {
    return (
      <div className="payment-container p-6 border rounded-xl shadow-sm bg-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Initializing PayHere secure portal...</p>
      </div>
    );
  }

  if (error && !checkoutData) {
    return (
      <div className="payment-container p-6 border rounded-xl shadow-sm bg-red-50 text-center">
        <p className="text-red-600 font-semibold">⚠️ Payment Initialization Notice</p>
        <p className="text-sm text-red-500 mt-1 mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-container p-6 border border-gray-200 rounded-2xl shadow-sm bg-white text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
        <p className="text-sm text-gray-600 mt-1">
          Your payment of LKR {checkoutData.amount} was approved. Redirecting...
        </p>
      </div>
    );
  }

  if (!checkoutData) return null;

  return (
    <div className="payment-container p-6 border border-gray-200 rounded-2xl shadow-sm bg-white text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Complete Consultation Payment</h3>
          <p className="text-sm text-gray-500 mt-0.5">PayHere Secure Checkout Gateway</p>
        </div>
        <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>PayHere Verified</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
        <div className="flex justify-between items-center text-sm mb-1.5">
          <span className="text-gray-600">Doctor / Specialist:</span>
          <span className="font-semibold text-gray-900">{doctorName}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Consultation Fee:</span>
          <span className="text-lg font-extrabold text-blue-600">LKR {checkoutData.amount}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStartPayHerePayment}
        disabled={processing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base disabled:opacity-50"
      >
        {processing ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay LKR {checkoutData.amount} with PayHere
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        Secured by PayHere Payment Gateway · Central Bank Approved
      </p>
    </div>
  );
};

export default PayHereCheckout;
