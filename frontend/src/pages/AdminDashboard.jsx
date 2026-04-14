import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/common/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allDoctorsCount, setAllDoctorsCount] = useState(0);
  const [stats, setStats] = useState([
    { title: 'Total Patients', value: '0', change: '+12%', icon: Users, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
    { title: 'Appointments', value: '0', change: '+8%', icon: Calendar, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50' },
    { title: 'Revenue', value: '$0', change: '+23%', icon: DollarSign, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Total Doctors', value: '0', change: '+5%', icon: Activity, color: 'from-rose-500 to-rose-700', bg: 'bg-rose-50' },
  ]);

  // Filter states
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [cancelReason, setCancelReason] = useState('');

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Assuming role might be stored
    navigate('/login');
  };

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
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
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
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/patients`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { count: 0 } }))
      ]);
      const pData = Array.isArray(patientsRes.data?.data) ? patientsRes.data.data : [];
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
      { title: 'Total Patients', value: patients.length || '0', change: '+12%', icon: Users, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
      { title: 'Appointments', value: totalAppointments, change: '+8%', icon: Calendar, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50' },
      { title: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50' },
      { title: 'Total Doctors', value: allDoctorsCount || '0', change: '+5%', icon: Users, color: 'from-rose-500 to-rose-700', bg: 'bg-rose-50' },
    ]);
  }, [appointments, patients, allDoctorsCount]);

  // Get status color and icon
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
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors/pending`, {
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

  // Fetch all verified doctors
  const fetchAllDoctors = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docs = (response.data?.data || []).filter(d => d.isVerified);
      setAllDoctors(docs);
      setAllDoctorsCount(response.data?.count || docs.length);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  // Approve a doctor
  const approveDoctor = async (doctorId) => {
    try {
      const token = getAuthToken();
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors/${doctorId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve doctor');
    }
  };

  // Reject a doctor
  const rejectDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to reject this doctor application?')) return;
    try {
      const token = getAuthToken();
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors/${doctorId}/reject`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject doctor');
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
    if (activeTab === 'alldoctors') {
      fetchAllDoctors();
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
      <aside className={`fixed top-0 left-0 z-30 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CareNet</span>
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
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'alldoctors', label: 'All Doctors', icon: User },
            { id: 'doctors', label: 'Doctor Approvals', icon: CheckCircle },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
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
            <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
              <User className="w-5 h-5 text-white" />
            </button>
            <button className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500 hover:text-blue-600 transition-colors">carenet.admin.support@gmail.com</p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          userProfile={{
            name: 'Admin User',
            email: 'carenet.admin.support@gmail.com',
            role: 'Admin'
          }}
        >
          <div className="w-full max-w-2xl mx-4">
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
        </Navbar>

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
          {/* Stats Cards - Only show in Overview or List views */}
          {(activeTab === 'overview' || (activeTab === 'appointments' && viewMode === 'list')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text -webkit-background-clip-text`} style={{ color: 'transparent', fill: 'currentColor' }} />
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">{stat.change}</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{stat.title}</p>
                  </div>
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                </div>
              ))}
            </div>
          )}

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <button onClick={() => setActiveTab('appointments')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
                  </div>
                  <div className="space-y-6">
                    {appointments.slice(0, 5).map((apt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stats[1].color} flex items-center justify-center text-white font-bold`}>
                            {apt.patientName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{apt.patientName}</p>
                            <p className="text-xs text-gray-500">{apt.type} with Dr. {apt.doctorName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400">{formatDate(apt.appointmentDate)}</span>
                      </div>
                    ))}
                    {appointments.length === 0 && <p className="text-center text-gray-500 py-4">No recent activity</p>}
                  </div>
                </div>

                {/* Quick Stats/Alt Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Performance Snapshot</h2>
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-gray-600">Patient Satisfaction</span>
                        <span className="text-emerald-600">94%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-gray-600">Appointment Completion</span>
                        <span className="text-blue-600">88%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full w-[88%] shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-gray-600">Resources Utilization</span>
                        <span className="text-indigo-600">76%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full w-[76%] shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <p className="text-xs font-medium uppercase tracking-widest opacity-60 mb-1">Growth Forecast</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">+2.4%</p>
                        <p className="text-[10px] opacity-60">Estimated revenue increase this month</p>
                      </div>
                      <TrendingUp className="w-8 h-8 opacity-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab Content */}
          {activeTab === 'appointments' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {viewMode === 'list' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">All Appointments</h2>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-all"
                        >
                          <Filter className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-all">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all font-semibold">
                          <PlusCircle className="w-5 h-5" />
                          <span>New Appointment</span>
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
                                  {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowStatusModal(true);
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-100 transition-all"
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
                                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-100 transition-all"
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
                /* Appointment Detail View - "Only appointment should show" */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors font-bold"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Appointments</span>
                    </button>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 ${getStatusColor(selectedAppointment.status)} border-opacity-30`}>
                        {selectedAppointment.status}
                      </span>
                      {selectedAppointment.status !== 'COMPLETED' && selectedAppointment.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setShowStatusModal(true)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                        >
                          Change Status
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Info */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-gray-100">
                              <span className="text-3xl font-extrabold text-blue-600">
                                {selectedAppointment.patientName?.[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-16 pb-8 px-8">
                          <div className="flex justify-between items-start">
                            <div>
                              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{selectedAppointment.patientName}</h1>
                              <p className="text-gray-500 font-medium flex items-center mt-1">
                                <Mail className="w-4 h-4 mr-2 text-blue-400" /> {selectedAppointment.patientEmail}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Appointment ID</p>
                              <p className="text-sm font-mono font-bold text-gray-700">{selectedAppointment._id}</p>
                            </div>
                          </div>

                          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-indigo-500" /> Consultation Reason
                              </h3>
                              <p className="text-gray-900 font-semibold leading-relaxed">
                                {selectedAppointment.reason || 'No specific reason provided for this visit.'}
                              </p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Additional Notes
                              </h3>
                              <p className="text-gray-900 font-semibold leading-relaxed italic">
                                {selectedAppointment.notes || 'No administrative notes recorded yet.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedAppointment.cancelReason && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start space-x-4">
                          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-rose-900 mb-1">Cancellation Record</h4>
                            <p className="text-sm text-rose-700 font-medium leading-relaxed">{selectedAppointment.cancelReason}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-lg font-black text-gray-900 mb-6">Medical Personnel</h3>
                        <div className="flex items-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Primary Doctor</p>
                            <p className="text-lg font-black text-indigo-900">Dr. {selectedAppointment.doctorName}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm font-bold text-gray-500">Specialty</span>
                            <span className="text-sm font-black text-gray-900">{selectedAppointment.specialty}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm font-bold text-gray-500">Service Type</span>
                            <span className="text-sm font-black text-gray-900 font-mono">{selectedAppointment.type}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-bold text-gray-500">Consultation Fee</span>
                            <span className="text-lg font-black text-emerald-600">${selectedAppointment.consultationFee}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                          <h3 className="text-lg font-black mb-6">Schedule Details</h3>
                          <div className="space-y-6">
                            <div className="flex items-start">
                              <Calendar className="w-5 h-5 mr-4 text-indigo-400" />
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Date</p>
                                <p className="text-lg font-bold">{formatDate(selectedAppointment.appointmentDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Clock className="w-5 h-5 mr-4 text-indigo-400" />
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Time Slot</p>
                                <p className="text-lg font-bold">{selectedAppointment.timeSlot}</p>
                              </div>
                            </div>
                          </div>
                          <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-black transition-all border border-white/10 flex items-center justify-center">
                            Export to PDF <Download className="w-4 h-4 ml-2" />
                          </button>
                        </div>
                        <Activity className="absolute -right-8 -bottom-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
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

          {/* All Doctors Tab Content */}
          {activeTab === 'alldoctors' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">All Doctors <span className="ml-2 text-sm font-normal text-gray-500">({allDoctors.length} approved)</span></h2>
                </div>
              </div>
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading doctors...</p>
                </div>
              ) : allDoctors.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No approved doctors found.</p>
                  <p className="text-sm mt-1">Approve doctors from the <button onClick={() => setActiveTab('doctors')} className="text-blue-600 underline">Doctor Approvals</button> tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {allDoctors.map((doctor) => (
                    <div key={doctor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-indigo-600">
                              {doctor.name?.charAt(0) || 'D'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                            <p className="text-sm text-blue-600 font-medium">{doctor.specialty || 'General Medicine'}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{doctor.phone}</span>
                          </div>
                        )}
                        {doctor.consultationFee && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>${doctor.consultationFee} / visit</span>
                          </div>
                        )}
                        {doctor.experience && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span>{doctor.experience} experience</span>
                          </div>
                        )}
                        {doctor.qualifications && (
                          <p className="text-xs text-gray-400 mt-1">{doctor.qualifications}</p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Joined {formatDate(doctor.createdAt)}</span>
                        {doctor.rating && (
                          <span className="flex items-center gap-1 text-sm text-yellow-600">
                            ★ {doctor.rating}
                          </span>
                        )}
                      </div>
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => approveDoctor(doctor._id)}
                                className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectDoctor(doctor._id)}
                                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </div>
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
