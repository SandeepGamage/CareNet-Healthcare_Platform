import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Search,
  Filter,
  Eye,
  Loader,
  MessageSquare,
  AlertCircle,
  FileText,
  Video,
  PhoneCall,
  MapPin
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

const API_BASE_URL = 'http://localhost:3004/api';

const ShowAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'CONFIRM', 'COMPLETE', 'CANCEL'
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    let filtered = [...appointments];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/appointments/doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAppointment || !actionType) return;
    
    let targetStatus = '';
    if (actionType === 'CONFIRM') targetStatus = 'CONFIRMED';
    else if (actionType === 'COMPLETE') targetStatus = 'COMPLETED';
    else if (actionType === 'CANCEL') targetStatus = 'CANCELLED';

    const payload = { status: targetStatus, notes: notes };
    if (actionType === 'CANCEL') payload.cancelReason = notes || 'Cancelled by doctor';

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/appointments/${selectedAppointment._id}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Appointment ${targetStatus.toLowerCase()} successfully`);
      setShowModal(false);
      setNotes('');
      fetchAppointments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
    }
  };

  const openActionModal = (appointment, type) => {
    setSelectedAppointment(appointment);
    setActionType(type);
    setNotes('');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Confirmed</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><ClockIcon className="w-3.5 h-3.5" /> Pending</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'VIDEO': return <Video className="w-4 h-4 text-blue-500" />;
      case 'PHONE': return <PhoneCall className="w-4 h-4 text-blue-500" />;
      default: return <MapPin className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return `Today, ${format(date, 'MMM d')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`;
    return format(date, 'EEE, MMM d, yyyy');
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center flex-col items-center h-64 gap-4">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointments Schedule</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your consultations and patient bookings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients or reasons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full sm:w-64 outline-none transition-all"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-blue-500 transition-colors" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white w-full sm:w-auto outline-none cursor-pointer transition-all hover:border-blue-300"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Appointments Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white border text-center border-slate-200 rounded-2xl flex flex-col items-center justify-center p-16 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-slate-400">
            <Calendar className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Appointments Found</h3>
          <p className="text-slate-500 max-w-sm">
            {searchTerm || statusFilter !== 'ALL' 
              ? "We couldn't find any appointments matching your current filters. Try adjusting them."
              : "Your schedule is clear. You don't have any upcoming appointments at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAppointments.map((apt) => (
            <div key={apt._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col relative group">
              {/* Top border accent line based on status */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                apt.status === 'CONFIRMED' ? 'bg-emerald-500' : 
                apt.status === 'PENDING' ? 'bg-amber-400' : 
                apt.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-rose-500'
              }`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3 group-hover:-translate-y-0.5 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                      {apt.patientName?.substring(0, 2).toUpperCase() || <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 tracking-tight leading-tight">{apt.patientName}</h3>
                      <p className="text-xs text-slate-400 font-medium">#{apt.appointmentId || apt._id.substring(0,8)}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-6 flex items-center justify-center mr-2"><Calendar className="w-4 h-4 text-blue-500" /></div>
                    <span className="font-semibold text-slate-700">{formatDate(apt.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-6 flex items-center justify-center mr-2"><Clock className="w-4 h-4 text-blue-500" /></div>
                    <span className="font-semibold text-slate-700">{apt.timeSlot}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 capitalize">
                    <div className="w-6 flex items-center justify-center mr-2">{getTypeIcon(apt.type)}</div>
                    <span className="font-medium">{apt.type?.replace('_', ' ')}</span>
                  </div>
                  {apt.reason && (
                    <div className="flex items-start text-sm text-slate-600 pt-2 mt-2 border-t border-slate-200">
                      <div className="w-6 flex items-center justify-center mr-2 pt-0.5"><MessageSquare className="w-4 h-4 text-blue-500" /></div>
                      <span className="line-clamp-2 text-xs text-slate-500 leading-snug">{apt.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Container */}
              <div className="px-6 pb-6 pt-2 bg-white">
                <div className="flex gap-2 w-full">
                  {apt.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => openActionModal(apt, 'CONFIRM')}
                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold rounded-xl text-sm transition-all border border-emerald-200 hover:border-emerald-600 shadow-sm active:scale-[0.98]"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => openActionModal(apt, 'CANCEL')}
                        className="flex-1 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold rounded-xl text-sm transition-all border border-rose-200 hover:border-rose-600 shadow-sm active:scale-[0.98]"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {apt.status === 'CONFIRMED' && (
                    <>
                      <button 
                        onClick={() => openActionModal(apt, 'COMPLETE')}
                        className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
                      >
                        Mark Completed
                      </button>
                      <button 
                        onClick={() => openActionModal(apt, 'CANCEL')}
                        className="flex-[0.5] py-2.5 bg-white text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-sm transition-all border border-rose-200 active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {(apt.status === 'COMPLETED' || apt.status === 'CANCELLED') && (
                    <div className="flex-1 py-2.5 bg-slate-50 text-slate-500 font-semibold rounded-xl text-sm border border-slate-200 text-center flex items-center justify-center gap-2 cursor-not-allowed">
                      <FileText className="w-4 h-4" />
                      View Only
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 scale-100 animate-in zoom-in duration-200">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-inner ${
              actionType === 'CONFIRM' ? 'bg-emerald-100 text-emerald-600' :
              actionType === 'COMPLETE' ? 'bg-blue-100 text-blue-600' :
              'bg-rose-100 text-rose-600'
            }`}>
              {actionType === 'CONFIRM' && <CheckCircle className="w-7 h-7" />}
              {actionType === 'COMPLETE' && <CheckCircle className="w-7 h-7" />}
              {actionType === 'CANCEL' && <AlertCircle className="w-7 h-7" />}
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
              {actionType === 'CONFIRM' && 'Confirm Appointment'}
              {actionType === 'COMPLETE' && 'Complete Consultation'}
              {actionType === 'CANCEL' && 'Cancel Appointment'}
            </h3>
            
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              You are about to {actionType.toLowerCase()} the appointment for <span className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{selectedAppointment.patientName}</span> scheduled on <span className="font-bold text-slate-700">{formatDate(selectedAppointment.appointmentDate)}</span> at <span className="font-bold text-slate-700">{selectedAppointment.timeSlot}</span>.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {actionType === 'CANCEL' ? 'Cancellation Reason' : 'Medical Notes / Feedback'}
              </label>
              <textarea
                className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm resize-none h-28 bg-slate-50 hover:bg-white transition-colors"
                placeholder={actionType === 'CANCEL' ? 'Please provide a reason to the patient...' : 'Any notes to attach? (Optional)'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 bg-white text-slate-600 hover:text-slate-800 border border-slate-200 font-bold rounded-2xl text-sm transition-all hover:bg-slate-50 active:scale-95"
                disabled={loading}
              >
                Go Back
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className={`flex-[1.5] py-3.5 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                  actionType === 'CONFIRM' ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30' :
                  actionType === 'COMPLETE' ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30' :
                  'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/30'
                }`}
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : `${actionType.charAt(0) + actionType.slice(1).toLowerCase()} Now`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAppointments;
