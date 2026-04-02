import React, { useState, useEffect } from 'react';

const PayHereCheckout = ({ appointmentId, amount, patientDetails, doctorName }) => {
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const returnUrl  = "http://localhost:5173/payment/success";
  const cancelUrl  = "http://localhost:5173/payment/cancel";
  const notifyUrl  = "http://localhost:3005/api/payments/payhere/notify";

  useEffect(() => {
    if (!appointmentId) return;

    const initPayment = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Call payment-service to create a transaction record and get the secure hash
        const res = await fetch('http://localhost:3005/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentId,
            doctorId: appointmentId, // Fallback — use appointmentId if no separate doctorId
            amount: parseFloat(amount),
            currency: 'LKR',
            metadata: { doctorName },
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setCheckoutData(data);
        } else {
          setError(data.message || 'Failed to initialize payment.');
        }
      } catch (err) {
        setError('Payment service is unreachable. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [appointmentId, amount]);

  if (loading) {
    return (
      <div className="payment-container p-6 border rounded-lg shadow-sm bg-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Initializing secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-container p-6 border rounded-lg shadow-sm bg-red-50 text-center">
        <p className="text-red-600 font-semibold">⚠️ Payment Error</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!checkoutData) return null;

  const nameParts = (patientDetails?.firstName || 'Patient').split(' ');

  return (
    <div className="payment-container p-6 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-bold mb-2">Complete Your Payment</h3>
      <p className="text-gray-600 mb-1"><strong>Doctor:</strong> {doctorName}</p>
      <p className="text-gray-600 mb-4"><strong>Consultation Fee:</strong> LKR {checkoutData.amount}</p>

      <form method="post" action={checkoutData.checkoutUrl}>
        {/* Merchant Details */}
        <input type="hidden" name="merchant_id" value={checkoutData.merchantId} />
        <input type="hidden" name="return_url"  value={returnUrl} />
        <input type="hidden" name="cancel_url"  value={cancelUrl} />
        <input type="hidden" name="notify_url"  value={notifyUrl} />

        {/* Item Details */}
        <input type="hidden" name="order_id"  value={checkoutData.orderId} />
        <input type="hidden" name="items"     value={`Consultation - ${doctorName}`} />
        <input type="hidden" name="currency"  value={checkoutData.currency} />
        <input type="hidden" name="amount"    value={checkoutData.amount} />
        <input type="hidden" name="hash"      value={checkoutData.hash} />

        {/* Customer Details */}
        <input type="hidden" name="first_name" value={patientDetails?.firstName || 'Patient'} />
        <input type="hidden" name="last_name"  value={patientDetails?.lastName  || 'User'} />
        <input type="hidden" name="email"      value={patientDetails?.email     || ''} />
        <input type="hidden" name="phone"      value={patientDetails?.phone     || ''} />
        <input type="hidden" name="address"    value={patientDetails?.address   || 'Colombo'} />
        <input type="hidden" name="city"       value={patientDetails?.city      || 'Colombo'} />
        <input type="hidden" name="country"    value="Sri Lanka" />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 flex items-center justify-center gap-2"
        >
          🔒 Pay LKR {checkoutData.amount} with PayHere
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-3">
        Secured by PayHere · Central Bank of Sri Lanka Approved
      </p>
    </div>
  );
};

export default PayHereCheckout;
