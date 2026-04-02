import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {/* Error/Cancel Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Failed or Cancelled</h2>
        <p className="text-gray-600 mb-8">
          We could not process your payment at this time, or you canceled the transaction. 
          Your appointment has not been confirmed yet.
        </p>
        
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300"
          >
            Try Payment Again
          </button>
          <Link 
            to="/" 
            className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 font-semibold py-3 px-4 rounded-md transition duration-300"
          >
            Cancel Booking Process
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
