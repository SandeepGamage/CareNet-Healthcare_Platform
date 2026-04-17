import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, FileText, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transactionData, setTransactionData] = useState(null);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');

        // Note: For local development, simulate webhook to verify the payment
        try {
          await axios.post(`http://localhost:3005/api/payments/verify-local`, 
            { appointmentId: orderId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (localVerifyErr) {
          console.log("Local verification step skipped/failed:", localVerifyErr.message);
        }

        const response = await axios.get(`http://localhost:3005/api/payments/appointment/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactionData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch transaction status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!transactionData?._id) {
       alert("Transaction data not yet synced. Please wait a moment.");
       return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3005/api/payments/invoices/${transactionData._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Could not download receipt right now. Check your email!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 mb-8">
          Your booking is now confirmed. We've sent a detailed receipt to your email.
          <span className="block mt-2 text-xs font-mono text-slate-400">Ref: {orderId || 'APT-0000'}</span>
        </p>

        {transactionData && (
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
             <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">Amount Paid:</span>
                <span className="text-sm font-bold text-slate-900">LKR {transactionData.amount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-500">Status:</span>
                <span className="text-sm font-bold text-green-600 uppercase">Confirmed</span>
             </div>
             <div className="flex justify-between border-t border-slate-200 pt-3 mt-3">
                <span className="text-sm font-medium text-slate-500">Method:</span>
                <span className="text-sm font-bold text-slate-900">Card (PayHere)</span>
             </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="w-full py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            View Appointments
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
          
          <button
            onClick={handleDownloadInvoice}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-400">
           Thank you for choosing CareNet Healthcare Solutions.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
