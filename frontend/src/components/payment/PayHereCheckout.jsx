import React from 'react';

const PayHereCheckout = ({ appointmentId, amount, patientDetails, doctorName }) => {
  // PayHere Sandbox details
  const merchantId = "1234825"; // Your exact Merchant ID
  const returnUrl = "http://localhost:3000/payment/success";
  const cancelUrl = "http://localhost:3000/payment/cancel";
  const notifyUrl = "https://your-ngrok-url.app/api/payments/payhere/notify"; // TODO: Update with ngrok URL

  return (
    <div className="payment-container p-6 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-bold mb-4">Complete Your Payment</h3>
      <p className="mb-2"><strong>Doctor:</strong> {doctorName}</p>
      <p className="mb-4"><strong>Consultation Fee:</strong> LKR {amount}.00</p>

      <form method="post" action="https://sandbox.payhere.lk/pay/checkout">
        {/* Merchant Details */}
        <input type="hidden" name="merchant_id" value={merchantId} />
        <input type="hidden" name="return_url" value={returnUrl} />
        <input type="hidden" name="cancel_url" value={cancelUrl} />
        <input type="hidden" name="notify_url" value={notifyUrl} />

        {/* Item Details */}
        <input type="hidden" name="order_id" value={appointmentId} />
        <input type="hidden" name="items" value={`Consultation - ${doctorName}`} />
        <input type="hidden" name="currency" value="LKR" />
        <input type="hidden" name="amount" value={amount} />

        {/* Customer Details */}
        <input type="hidden" name="first_name" value={patientDetails.firstName} />
        <input type="hidden" name="last_name" value={patientDetails.lastName} />
        <input type="hidden" name="email" value={patientDetails.email} />
        <input type="hidden" name="phone" value={patientDetails.phone} />
        <input type="hidden" name="address" value={patientDetails.address} />
        <input type="hidden" name="city" value={patientDetails.city} />
        <input type="hidden" name="country" value="Sri Lanka" />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full transition duration-300"
        >
          Pay with PayHere
        </button>
      </form>
    </div>
  );
};

export default PayHereCheckout;
