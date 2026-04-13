import React from 'react';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-8">
          The payment process was cancelled. No charges were made to your account.
          {orderId && <span className="block mt-2 text-xs font-mono text-slate-400">Order Ref: {orderId}</span>}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/book-appointment')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Booking Again
          </button>
          
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Need help? Contact our support at <span className="text-blue-600">support@carenet.com</span>
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
