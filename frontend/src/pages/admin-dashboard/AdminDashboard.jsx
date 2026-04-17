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
import Navbar from '../../components/common/Navbar';
import AppointmentsView from './Appointments/viewAppointments';

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
  const [transactions, setTransactions] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ totalRevenue: 0, succeededCount: 0, pendingAmount: 0 });

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

  // Notification Management states
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [recipientSource, setRecipientSource] = useState('manual'); // 'manual' or 'list'
  const [selectedRole, setSelectedRole] = useState('patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]); // Array of user objects
  const [notifForm, setNotifForm] = useState({
    recipient: '',
    email: '',
    phone: '',
    type: 'EMAIL',
    subject: '',
    message: '',
    isOtp: false,
    role: 'user'
  });
  const [selectedLog, setSelectedLog] = useState(null); // For modal viewer


  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(null);

  const [cancelReason, setCancelReason] = useState('');

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Assuming role might be stored
    navigate('/login');
  };



  // Fetch appointments (simplified for stats)
  const fetchAppointmentsSummary = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/appointments/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apts = Array.isArray(response.data) ? response.data : (response.data?.appointments || []);
      setAppointments(apts);
    } catch (err) {
      console.error('Failed to fetch appointments for stats');
    }
  };

  // Fetch all transactions from payment-service
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTransactions(response.data.data || []);
        
        // Update stats from the aggregation in the response
        const stats = response.data.stats || [];
        const succeeded = stats.find(s => s._id === 'succeeded');
        const pending = stats.find(s => s._id === 'pending');
        
        setPaymentStats({
          totalRevenue: succeeded ? succeeded.totalAmount : 0,
          succeededCount: succeeded ? succeeded.count : 0,
          pendingAmount: pending ? pending.totalAmount : 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch transactions');
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



  // Fetch global dashboard counts on load
  const fetchDashboardStatsData = async () => {
    try {
      const token = getAuthToken();
      // Fetch patients, doctors, and payment stats for the dashboard overall stats
      const [patientsRes, doctorsRes, paymentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/patients`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/admin/doctors`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { count: 0 } })),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/admin/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { stats: [] } }))
      ]);
      
      const pData = Array.isArray(patientsRes.data?.data) ? patientsRes.data.data : [];
      setPatients(pData);
      setAllDoctorsCount(doctorsRes.data?.count || 0);

      const pStats = paymentsRes.data?.stats || [];
      const succeeded = pStats.find(s => s._id === 'succeeded');
      const pending = pStats.find(s => s._id === 'pending');
      
      setPaymentStats({
        totalRevenue: succeeded ? succeeded.totalAmount : 0,
        succeededCount: succeeded ? succeeded.count : 0,
        pendingAmount: pending ? pending.totalAmount : 0
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats data');
    }
  };


  // Automatically rebuild stats whenever patients, doctors, or appointments change
  useEffect(() => {
    const activeAppointmentsCount = appointments.filter(a => a.status !== 'CANCELLED').length;

    setStats([
      { title: 'Total Patients', value: patients.length || '0', change: '+12%', icon: Users, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
      { title: 'Appointments', value: activeAppointmentsCount.toString(), change: '+8%', icon: Calendar, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50' },
      { title: 'Revenue', value: `LKR ${paymentStats.totalRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50' },
      { title: 'Total Doctors', value: allDoctorsCount || '0', change: '+5%', icon: Users, color: 'from-rose-500 to-rose-700', bg: 'bg-rose-50' },
    ]);
  }, [patients, allDoctorsCount, appointments, paymentStats]);




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

  // Notification Management logic
  const fetchNotificationLogs = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificationLogs(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notification logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    if (e) e.preventDefault();
    try {
      setNotifLoading(true);
      setNotifSuccess(null);
      const token = getAuthToken();

      const payload = {
        ...notifForm,
        recipients: recipientSource === 'list' ? selectedRecipients : [],
        role: recipientSource === 'list' ? selectedRole : notifForm.role
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/notifications/manual`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifSuccess(response.data.message || 'Notifications sent successfully!');

      // Reset form
      setNotifForm({
        recipient: '',
        email: '',
        phone: '',
        type: 'EMAIL',
        subject: '',
        message: '',
        isOtp: false,
        role: 'user'
      });
      setSelectedRecipients([]);
      setSearchQuery('');
      fetchNotificationLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log entry? This action cannot be undone.')) return;
    try {
      const token = getAuthToken();
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/notifications/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotificationLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete log entry');
    }
  };

  const selectRecipient = (person) => {
    // Check if already in list
    if (selectedRecipients.find(r => r._id === person._id)) return;

    setSelectedRecipients([...selectedRecipients, {
      ...person,
      role: selectedRole
    }]);
    setSearchQuery('');
  };

  const removeRecipient = (id) => {
    setSelectedRecipients(selectedRecipients.filter(r => r._id !== id));
  };

  const handleSelectAll = () => {
    const list = selectedRole === 'patient' ? patients : allDoctors;
    const filtered = list.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const newItems = filtered.filter(f => !selectedRecipients.find(r => r._id === f._id));
    setSelectedRecipients([...selectedRecipients, ...newItems.map(i => ({ ...i, role: selectedRole }))]);
    setSearchQuery('');
  };



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
    if (activeTab === 'notifications') {
      fetchNotificationLogs();
    }
    if (activeTab === 'revenue') {
      fetchTransactions();
    }
    if (activeTab === 'analytics' || activeTab === 'overview') {
      fetchAppointmentsSummary();
    }

  }, [activeTab]);



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
            { id: 'notifications', label: 'Notifications', icon: Bell },
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
          {/* Stats Cards - Only show in Overview tab */}
          {activeTab === 'overview' && (
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
                    <p className="text-center text-gray-500 py-10 italic">Activity log available in specific modules.</p>
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
            <AppointmentsView />
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
                        <span className="text-sm text-gray-600">Total Revenue (Paid)</span>
                        <span className="font-medium text-gray-900">
                          LKR {paymentStats.totalRevenue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Pending Payments</span>
                        <span className="font-medium text-gray-900">
                          LKR {paymentStats.pendingAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm text-gray-600">Average Transaction</span>
                        <span className="font-medium text-gray-900">
                          LKR {paymentStats.succeededCount ? (paymentStats.totalRevenue / paymentStats.succeededCount).toFixed(0) : '0'}
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
                    LKR {paymentStats.totalRevenue.toLocaleString()}
                  </h3>
                  <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Unpaid / Pending</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    LKR {paymentStats.pendingAmount.toLocaleString()}
                  </h3>
                  <p className="text-xs text-yellow-600 mt-2">Awaiting payment</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Successful Payments</p>
                  <h3 className="text-2xl font-bold text-gray-900">{paymentStats.succeededCount}</h3>
                  <p className="text-xs text-blue-600 mt-2">Completed transactions</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.payhereOrderId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.metadata?.patientName || tx.patientId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">LKR {tx.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "succeeded" ? "bg-green-100 text-green-800" : tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                            No transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Notification Management Content */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Notification Form */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Send Notification</h2>
                    <p className="text-sm text-gray-500 mt-1">Directly target users via Email, SMS, or Both.</p>
                  </div>

                  <form onSubmit={handleSendNotification} className="p-8 space-y-6">
                    {notifSuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold flex items-center mb-4">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {notifSuccess}
                      </div>
                    )}

                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setRecipientSource('manual')}
                        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${recipientSource === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                      >
                        MANUAL ENTRY
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientSource('list')}
                        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${recipientSource === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                      >
                        SELECT FROM SYSTEM
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Channel</label>
                        <select
                          value={notifForm.type}
                          onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                        >
                          <option value="EMAIL">📧 Email Only</option>
                          <option value="SMS">📱 SMS Only</option>
                          <option value="BOTH">🚀 Both (Email & SMS)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mode</label>
                        <select
                          value={notifForm.isOtp ? 'OTP' : 'MESSAGE'}
                          onChange={(e) => setNotifForm({ ...notifForm, isOtp: e.target.value === 'OTP' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                        >
                          <option value="MESSAGE">General Message</option>
                          <option value="OTP">Security OTP Code</option>
                        </select>
                      </div>
                    </div>

                    {recipientSource === 'list' ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRole('patient')}
                            className={`px-4 py-2 text-[10px] font-bold rounded-full border transition-all ${selectedRole === 'patient' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            PATIENTS
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRole('doctor')}
                            className={`px-4 py-2 text-[10px] font-bold rounded-full border transition-all ${selectedRole === 'doctor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            DOCTORS
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 rounded-lg">
                            <Search className="w-3.3 h-3.5 text-blue-600" />
                          </div>
                          <input
                            type="text"
                            placeholder={`Search ${selectedRole}s by name...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-28 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-xl hover:bg-blue-200 transition-colors"
                          >
                            SELECT ALL
                          </button>

                          {searchQuery && (
                            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2 space-y-1">
                              {(selectedRole === 'patient' ? patients : allDoctors)
                                .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((person) => (
                                  <button
                                    key={person._id}
                                    type="button"
                                    onClick={() => selectRecipient(person)}
                                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                  >
                                    <div>
                                      <p className="text-sm font-black text-gray-900">{person.name}</p>
                                      <p className="text-[10px] text-gray-400 font-bold">{person.email || person.phone}</p>
                                    </div>
                                    <PlusCircle className={`w-4 h-4 transition-colors ${selectedRecipients.find(r => r._id === person._id) ? 'text-emerald-500' : 'text-blue-300 group-hover:text-blue-600'}`} />
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>

                        {selectedRecipients.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Targets ({selectedRecipients.length})
                              </label>
                              <button
                                type="button"
                                onClick={() => setSelectedRecipients([])}
                                className="text-[10px] font-bold text-rose-500 hover:underline"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 min-h-[60px] max-h-40 overflow-y-auto">
                              {selectedRecipients.map((person) => (
                                <div
                                  key={person._id}
                                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200"
                                >
                                  <div className={`w-2 h-2 rounded-full ${person.role === 'doctor' ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
                                  <span className="text-xs font-bold text-gray-700">{person.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeRecipient(person._id)}
                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Detail</label>
                        <input
                          type="text"
                          placeholder={notifForm.type === 'EMAIL' ? "user@example.com" : notifForm.type === 'SMS' ? "+947xxxxxxx" : "Recipient contact info"}
                          value={notifForm.recipient}
                          onChange={(e) => setNotifForm({ ...notifForm, recipient: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                          required
                        />
                      </div>
                    )}

                    {!notifForm.isOtp && (notifForm.type === 'EMAIL' || notifForm.type === 'BOTH') && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
                        <input
                          type="text"
                          placeholder="Important Update Regarding..."
                          value={notifForm.subject}
                          onChange={(e) => setNotifForm({ ...notifForm, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
                      <textarea
                        rows="4"
                        placeholder={notifForm.isOtp ? "The verification code is 123456" : "Type your message here..."}
                        value={notifForm.message}
                        onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        required
                      />
                      {notifForm.isOtp && <p className="text-[10px] text-blue-500 font-bold ml-1">Tip: Include a 6-digit number to use the OTP template.</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={notifLoading}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {notifLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Bell className="w-5 h-5" />
                          <span>Dispatch {notifForm.isOtp ? 'OTP Code' : 'Notification'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Recent Logs Summary */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Dispatches</h2>
                      <button onClick={fetchNotificationLogs} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[600px] p-6 space-y-4">
                    {notificationLogs.map((log, idx) => (
                      <div key={idx} className="p-4 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mt-12 -mr-12 rounded-full opacity-[0.03] ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                              {log.channels?.email?.sent ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-black text-gray-900">{log.recipientName || log.recipientEmail || log.recipientPhone}</p>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${log.recipientRole === 'doctor' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                  {log.recipientRole}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.eventType.replace(/_/g, ' ')}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center space-x-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black flex items-center"
                              >
                                <Search className="w-3 h-3 mr-1" /> VIEW
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log._id)}
                                className="p-1 px-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> DELETE
                              </button>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${log.status === 'success' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                              }`}>
                              {log.status}
                            </span>
                            <div className="flex space-x-1">
                              {log.channels?.email?.sent && <div className="p-0.5 bg-emerald-100 rounded text-emerald-600" title="Email Sent"><Mail className="w-2.5 h-2.5" /></div>}
                              {log.channels?.sms?.sent && <div className="p-0.5 bg-emerald-100 rounded text-emerald-600" title="SMS Sent"><Phone className="w-2.5 h-2.5" /></div>}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 bg-white p-3 rounded-2xl border border-gray-100/50">
                          {log.subject && <p className="text-[11px] font-black text-gray-800 mb-1">{log.subject}</p>}
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                            {log.message || log.payload?.message || "No preview available for this log type."}
                          </p>
                        </div>

                        <div className="mt-2 text-[9px] text-gray-400 font-bold flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {new Date(log.createdAt).toLocaleString()}
                          </div>
                          {log.recipientId && <span className="text-blue-500/40 font-mono">ID: {log.recipientId.substring(0, 8)}...</span>}
                        </div>
                      </div>
                    ))}
                    {notificationLogs.length === 0 && !notifLoading && (
                      <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40">
                        <Bell className="w-12 h-12 mb-4" />
                        <p className="font-bold">No recent notifications dispatched.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>





      {/* Notification Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Notification Details</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  ID: {selectedLog._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-3 bg-white shadow-sm rounded-2xl text-gray-400 hover:text-rose-600 transition-all hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</label>
                  <p className="text-sm font-black text-gray-900">{selectedLog.recipientName || 'Unknown Name'}</p>
                  <p className="text-[11px] font-bold text-gray-500">{selectedLog.recipientEmail || selectedLog.recipientPhone}</p>
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Type</label>
                  <p className="text-sm font-black text-indigo-600">{selectedLog.eventType.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] font-bold text-gray-400">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Subject Line</label>
                  <p className="text-sm font-black text-gray-900 leading-tight">
                    {selectedLog.subject || '(No Subject)'}
                  </p>
                </div>
                <div className="h-px bg-gray-200/50 w-full"></div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Message Content</label>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed font-mono bg-white p-4 rounded-xl border border-gray-100">
                    {selectedLog.message || selectedLog.payload?.message || "No content available."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Email Channel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700">Status</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedLog.channels?.email?.sent ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                      {selectedLog.channels?.email?.sent ? 'SENT' : 'NOT ATTEMPTED'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">SMS Channel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700">Status</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedLog.channels?.sms?.sent ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'}`}>
                      {selectedLog.channels?.sms?.sent ? 'SENT' : 'NOT ATTEMPTED'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedLog.payload && Object.keys(selectedLog.payload).length > 2 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Payload</label>
                  <pre className="p-4 bg-gray-900 text-emerald-400 text-[10px] rounded-2xl overflow-x-auto font-mono scrollbar-hide">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end px-8">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
