import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Activity,
  DollarSign,
  Menu,
  X,
  Bell,
  Search,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Filter,
  Download,
  PlusCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctorsCount, setAllDoctorsCount] = useState(0);
  const [stats, setStats] = useState([
    { title: 'Total Patients', value: '0', change: '+0%', icon: Users, key: 'patients' },
    { title: 'Appointments', value: '0', change: '+0%', icon: Calendar, key: 'appointments' },
    { title: 'Revenue', value: '$0', change: '+0%', icon: DollarSign, key: 'revenue' },
    { title: 'Total Doctors', value: '0', change: '+0%', icon: Activity, key: 'doctors' },
  ]);

  // Filter states
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [cancelReason, setCancelReason] = useState('');

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  // Fetch appointments from your backend
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

  // Fetch patients from your backend
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data?.patients || []);
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
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
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  // Cancel appointment
  const cancelAppointment = async (id, reason) => {
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason }
      });
      await fetchAppointments();
      setCancelReason('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Fetch global dashboard counts on load
  const fetchDashboardStatsData = async () => {
    try {
      const token = getAuthToken();
      // Fetch patients and doctors counts unconditionally for the dashboard overall stats
      const [patientsRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/patients`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`http://localhost:3001/api/auth/admin/doctors`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { count: 0 } }))
      ]);
      const pData = Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.patients || []);
      setPatients(pData);
      setAllDoctorsCount(doctorsRes.data?.count || 0);
    } catch (err) {
      console.error('Failed to fetch dashboard stats data');
    }
  };

  // Automatically rebuild stats whenever appointments, patients, or doctors count changes
  useEffect(() => {
    const totalAppointments = appointments.length;
    const totalRevenue = appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    
    setStats([
      { title: 'Total Patients', value: patients.length || '0', change: '+12%', icon: Users, key: 'patients' },
      { title: 'Appointments', value: totalAppointments, change: '+8%', icon: Calendar, key: 'appointments' },
      { title: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign, key: 'revenue' },
      { title: 'Total Doctors', value: allDoctorsCount || '0', change: '+5%', icon: Users, key: 'doctors' },
    ]);
  }, [appointments, patients, allDoctorsCount]);

  // Get status color and icon
  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch pending doctors
  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`http://localhost:3001/api/auth/admin/doctors/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDoctors(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending doctors');
    } finally {
      setLoading(false);
    }
  };

  // Approve a doctor
  const approveDoctor = async (doctorId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:3001/api/auth/admin/doctors/${doctorId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve doctor');
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  // Load global data once on mount
  useEffect(() => {
    fetchDashboardStatsData();
  }, []);

  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients();
    }
    if (activeTab === 'doctors') {
      fetchPendingDoctors();
    }
  }, [activeTab]);

  // Filter appointments by search term
  const filteredAppointments = appointments.filter(apt => 
    searchTerm === '' || 
    apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">HealthCare Pro</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'doctors', label: 'Doctor Approvals', icon: CheckCircle },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-700' : 'text-gray-500'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@healthcare.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-700 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Appointments Tab Content */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">All Appointments</h2>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
                    >
                      <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg">
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <PlusCircle className="w-5 h-5" />
                      <span>New Appointment</span>
                    </button>
                  </div>
                </div>
                
                {/* Filters */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={filters.status || ''}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <input
                      type="date"
                      value={filters.date || ''}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Specialty"
                      value={filters.specialty || ''}
                      onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading appointments...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {appointment.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                                <p className="text-xs text-gray-500">{appointment.patientEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-900">{appointment.doctorName}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                            <p className="text-xs text-gray-500">{appointment.timeSlot}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{appointment.specialty}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status?.toLowerCase()}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                                <button 
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowStatusModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                      const reason = prompt('Please provide a cancellation reason:');
                                      if (reason) cancelAppointment(appointment._id, reason);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAppointments.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                      No appointments found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Patients Tab Content */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Patient List</h2>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusCircle className="w-5 h-5" />
                    <span>Add Patient</span>
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading patients...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {patients.map((patient) => (
                    <div key={patient._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {patient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-500">ID: {patient._id?.slice(-6)}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{patient.email}</span>
                        </div>
                        {patient.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                        {patient.dateOfBirth && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                          </div>
                        )}
                      </div>
                      <button className="mt-4 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Doctors Approval Tab Content */}
          {activeTab === 'doctors' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Pending Doctor Approvals</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading pending doctors...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingDoctors.map((doctor) => (
                        <tr key={doctor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  {doctor.name?.charAt(0) || 'D'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doctor.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doctor.specialty || 'Not specified'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(doctor.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => approveDoctor(doctor._id)}
                              className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pendingDoctors.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                      No pending doctor approvals
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Healthcare Analytics Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Appointment Status Distribution</h3>
                    <div className="space-y-3">
                      {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => {
                        const count = appointments.filter(a => a.status === status).length;
                        const percentage = appointments.length ? (count / appointments.length * 100).toFixed(1) : 0;
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{status.toLowerCase()}</span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Revenue Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="font-medium text-gray-900">
                          ${appointments.filter(a => a.status === 'COMPLETED').reduce((sum, a) => sum + (a.consultationFee || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Pending Payments</span>
                        <span className="font-medium text-gray-900">
                          ${appointments.filter(a => a.status === 'CONFIRMED').reduce((sum, a) => sum + (a.consultationFee || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm text-gray-600">Average Consultation Fee</span>
                        <span className="font-medium text-gray-900">
                          ${appointments.length ? (appointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0) / appointments.length).toFixed(2) : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab Content */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${appointments.filter(a => a.status === 'COMPLETED').reduce((sum, a) => sum + (a.consultationFee || 0), 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Pending Collections</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${appointments.filter(a => a.status === 'CONFIRMED').reduce((sum, a) => sum + (a.consultationFee || 0), 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-yellow-600 mt-2">Awaiting payment</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                  <h3 className="text-2xl font-bold text-gray-900">{appointments.length}</h3>
                  <p className="text-xs text-blue-600 mt-2">{appointments.filter(a => a.status === 'CONFIRMED').length} confirmed</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointments
                        .filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
                        .slice(0, 5)
                        .map((appointment) => (
                          <tr key={appointment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {appointment._id.slice(-8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {appointment.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${appointment.consultationFee}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(appointment.appointmentDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appointment.status === 'COMPLETED' ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Appointment Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Patient Name</label>
                  <p className="font-medium">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Patient Email</label>
                  <p className="font-medium">{selectedAppointment.patientEmail}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Doctor</label>
                  <p className="font-medium">{selectedAppointment.doctorName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Specialty</label>
                  <p className="font-medium">{selectedAppointment.specialty}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date</label>
                  <p className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Time Slot</label>
                  <p className="font-medium">{selectedAppointment.timeSlot}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p className="font-medium">{selectedAppointment.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Consultation Fee</label>
                  <p className="font-medium">${selectedAppointment.consultationFee}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Reason</label>
                  <p className="font-medium">{selectedAppointment.reason || 'Not specified'}</p>
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Notes</label>
                    <p className="font-medium">{selectedAppointment.notes}</p>
                  </div>
                )}
                {selectedAppointment.cancelReason && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Cancellation Reason</label>
                    <p className="font-medium text-red-600">{selectedAppointment.cancelReason}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusIcon(selectedAppointment.status)}
                    <span className="capitalize">{selectedAppointment.status?.toLowerCase()}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Update Appointment Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="CONFIRMED">Confirm</option>
                  <option value="COMPLETED">Complete</option>
                  <option value="CANCELLED">Cancel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this appointment..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdate({ status: '', notes: '' });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => updateAppointmentStatus(selectedAppointment._id, statusUpdate.status, statusUpdate.notes)}
                disabled={!statusUpdate.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;