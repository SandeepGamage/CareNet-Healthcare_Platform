import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Mail,
  Activity,
  User,
  DollarSign,
  Download,
  Filter,
  Search,
  TrendingUp,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AppointmentsView = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Status Update state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      if (filters.specialty) params.append('specialty', filters.specialty);

      const response = await axios.get(`${API_BASE_URL}/appointments/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apts = Array.isArray(response.data) ? response.data : (response.data?.appointments || []);
      setAppointments(apts);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (id, status, notes) => {
    try {
      const token = getAuthToken();
      await axios.patch(
        `${API_BASE_URL}/appointments/${id}/status`,
        { status, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAppointments();
      setShowStatusModal(false);
      setStatusUpdate({ status: '', notes: '' });
      
      // If we are in detail view, update the selected appointment state
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment({ ...selectedAppointment, status, notes });
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  // Cancel appointment (soft delete/status update)
  const cancelAppointment = async (id, reason) => {
    try {
      const token = getAuthToken();
      // Using PATCH status for consistency or the DELETE endpoint if it maps to cancel
      await axios.patch(`${API_BASE_URL}/appointments/${id}/status`, 
        { status: 'CANCELLED', cancelReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAppointments();
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: 'CANCELLED', cancelReason: reason });
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Permanent Delete (New Functionality)
  const deleteAppointmentPermanently = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this appointment from records? This action cannot be undone.')) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/appointments/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAppointments();
      setViewMode('list');
      setSelectedAppointment(null);
      setError(null);
      alert('Appointment permanently deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment permanently');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Style helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredAppointments = appointments.filter(apt =>
    searchTerm === '' ||
    apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">All Appointments</h2>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm w-64"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-gray-200'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                  <input
                    type="date"
                    value={filters.date || ''}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Specialty Search</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology"
                    value={filters.specialty || ''}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent shadow-sm"></div>
              <p className="mt-4 text-gray-500 font-medium">Fetching secure records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Patient Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Specialist</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Specialty</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="group hover:bg-blue-50/30 transition-all duration-300">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                              <span className="text-sm font-bold text-blue-600">
                                {appointment.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-gray-100">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-bold text-gray-900">{appointment.patientName}</p>
                            <p className="text-xs text-gray-500/80 font-medium">{appointment.patientEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-800">Dr. {appointment.doctorName}</p>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{formatDate(appointment.appointmentDate)}</span>
                          <span className="text-xs font-medium text-gray-400 inline-flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" /> {appointment.timeSlot}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold tracking-tight">
                          {appointment.specialty}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${appointment.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          appointment.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            appointment.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status?.toLowerCase()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setViewMode('detail');
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-100 transition-all flex items-center space-x-2"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-bold pr-1">Full View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="p-20 text-center">
                  <div className="p-4 bg-gray-50 inline-block rounded-full mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold">No appointments match your search criteria</p>
                  <button onClick={() => { setSearchTerm(''); setFilters({}); }} className="mt-4 text-blue-600 font-bold hover:underline">Clear all filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Appointment Detail View */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-2 px-6 py-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all font-black uppercase text-[10px] tracking-widest border border-transparent hover:border-blue-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Appointments</span>
            </button>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusColor(selectedAppointment?.status)} border-opacity-30 shadow-sm`}>
                {selectedAppointment?.status}
              </span>
              
              {/* Dynamic Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedAppointment?.status !== 'COMPLETED' && selectedAppointment?.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    Change Status
                  </button>
                )}
                
                {selectedAppointment?.status === 'CANCELLED' && (
                  <button
                    onClick={() => deleteAppointmentPermanently(selectedAppointment._id)}
                    className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-100/50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Appointment
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-50/50">
                <div className="h-40 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
                    <Activity size={180} className="text-white" />
                  </div>
                  <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-[32px] shadow-2xl transition-transform duration-500 hover:scale-105">
                    <div className="w-28 h-28 rounded-[24px] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-gray-100 transition-colors">
                      <span className="text-4xl font-black text-blue-600 drop-shadow-sm">
                        {selectedAppointment?.patientName?.[0]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-20 pb-10 px-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-black text-gray-900 tracking-tight">{selectedAppointment?.patientName}</h1>
                      <div className="flex items-center mt-2 space-x-4">
                        <p className="text-gray-500 font-bold text-sm flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-blue-500" /> {selectedAppointment?.patientEmail}
                        </p>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg">Verified Account</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-2 text-right">Reference ID</p>
                      <p className="text-sm font-mono font-black text-gray-800 bg-gray-50 px-3 py-1 rounded-xl border border-gray-100">{selectedAppointment?._id}</p>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-100 group">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center group-hover:text-indigo-600 transition-colors">
                        <Activity className="w-4 h-4 mr-3 text-indigo-500 group-hover:scale-125 transition-transform" /> Consultation Reason
                      </h3>
                      <p className="text-gray-900 font-bold text-lg leading-relaxed">
                        {selectedAppointment?.reason || 'No specific reason provided for this visit.'}
                      </p>
                    </div>
                    <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-100 group">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center group-hover:text-blue-600 transition-colors">
                        <Clock className="w-4 h-4 mr-3 text-blue-500 group-hover:scale-125 transition-transform" /> Additional Notes
                      </h3>
                      <p className="text-gray-900 font-bold text-lg leading-relaxed italic opacity-80">
                        {selectedAppointment?.notes || 'No administrative notes recorded yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAppointment?.cancelReason && (
                <div className="bg-rose-50/50 backdrop-blur-sm border-2 border-rose-100 rounded-[32px] p-8 flex items-start space-x-6 animate-in slide-in-from-left-4 duration-500">
                  <div className="p-4 bg-rose-100 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-2 opacity-60">Cancellation Record</h4>
                    <p className="text-xl text-rose-700 font-black leading-tight italic">"{selectedAppointment.cancelReason}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 transition-all hover:shadow-xl">
                <h3 className="text-xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Medical Specialist</h3>
                <div className="flex items-center p-6 bg-indigo-50/30 rounded-[32px] border border-indigo-100 mb-8 transition-transform hover:scale-105 duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="ml-5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Primary Care Physician</p>
                    <p className="text-2xl font-black text-indigo-900">Dr. {selectedAppointment?.doctorName}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Specialty</span>
                    <span className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{selectedAppointment?.specialty}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Service Type</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${selectedAppointment?.type === 'TELEMEDICINE' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selectedAppointment?.type}
                    </span>
                  </div>
                  <div className="h-px bg-gray-50"></div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-black text-gray-900">Consultation Fee</span>
                    <span className="text-3xl font-black text-emerald-600 tabular-nums">${selectedAppointment?.consultationFee}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 rounded-[40px] shadow-2xl p-10 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-10 opacity-90 tracking-tight">Schedule Details</h3>
                  <div className="space-y-10">
                    <div className="flex items-start">
                      <div className="p-3 bg-white/10 rounded-2xl mr-5">
                        <Calendar className="w-6 h-6 text-indigo-300" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 italic">Date of session</p>
                        <p className="text-2xl font-black">{formatDate(selectedAppointment?.appointmentDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="p-3 bg-white/10 rounded-2xl mr-5">
                        <Clock className="w-6 h-6 text-indigo-300" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 italic">Reserved slot</p>
                        <p className="text-2xl font-black tabular-nums">{selectedAppointment?.timeSlot}</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-10 py-5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/20 flex items-center justify-center active:scale-95">
                    Export to PDF <Download className="w-4 h-4 ml-3" />
                  </button>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                  <Activity size={192} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Update Status</h3>
              <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest opacity-60">ADMINISTRATIVE ACTION REQUIRED</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Lifecycle Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                  <option value="">-- SELECT NEW STATUS --</option>
                  <option value="CONFIRMED">CONFIRM APPOINTMENT</option>
                  <option value="COMPLETED">MARK AS COMPLETED</option>
                  <option value="CANCELLED">CANCEL APPOINTMENT</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Clinical Notes</label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows="4"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm"
                  placeholder="Record any administrative or clinical updates here..."
                />
              </div>
            </div>
            <div className="p-10 border-t border-gray-100 flex justify-end space-x-4 bg-gray-50/50">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdate({ status: '', notes: '' });
                }}
                className="px-8 py-3 bg-white text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200"
              >
                DISCARD
              </button>
              <button
                onClick={() => updateAppointmentStatus(selectedAppointment._id, statusUpdate.status, statusUpdate.notes)}
                disabled={!statusUpdate.status}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                PUSH UPDATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;
