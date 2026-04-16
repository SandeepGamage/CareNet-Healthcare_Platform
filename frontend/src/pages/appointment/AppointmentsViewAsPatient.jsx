import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Video,
  PhoneCall,
  Building,
  Star,
  Shield,
  Activity,
  Heart,
  Brain,
  MoreVertical,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  MessageSquare,
  FileText,
  DollarSign,
  AlertTriangle,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

const API_BASE_URL = 'http://localhost:3004/api';

const PatientAppointments = () => {
  // State management
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // UI states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    type: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // Edit form data
  const [editFormData, setEditFormData] = useState({
    appointmentDate: '',
    timeSlot: '',
    type: '',
    reason: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  
  // Refund state
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundedAppointments, setRefundedAppointments] = useState(new Set());
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0
  });
  
  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...appointments];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status.toUpperCase());
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(apt => apt.type === filters.type);
    }
    
    // Apply date range filter
    const today = new Date();
    if (filters.dateRange === 'upcoming') {
      filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= today);
    } else if (filters.dateRange === 'past') {
      filtered = filtered.filter(apt => new Date(apt.appointmentDate) < today);
    } else if (filters.dateRange === 'today') {
      filtered = filtered.filter(apt => isToday(new Date(apt.appointmentDate)));
    } else if (filters.dateRange === 'week') {
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= today && aptDate <= weekLater;
      });
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.appointmentDate) - new Date(b.appointmentDate);
      } else if (sortBy === 'doctor') {
        comparison = a.doctorName.localeCompare(b.doctorName);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [appointments, filters, searchTerm, sortBy, sortOrder]);
  
  // Update statistics
  useEffect(() => {
    const total = appointments.length;
    const upcoming = appointments.filter(apt => 
      apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && 
      new Date(apt.appointmentDate) >= new Date()
    ).length;
    const completed = appointments.filter(apt => apt.status === 'COMPLETED').length;
    const cancelled = appointments.filter(apt => apt.status === 'CANCELLED').length;
    const totalSpent = appointments
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);
    
    setStats({ total, upcoming, completed, cancelled, totalSpent });
  }, [appointments]);
  
  // Fetch appointments from API - NO MOCK DATA
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view your appointments');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/appointments/my`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      // Set appointments from real API response
      setAppointments(response.data);
      setError(null);
      
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      
      // Show proper error message
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('You don\'t have permission to view these appointments');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load appointments. Please try again.');
      }
      
      // Set empty array - NO MOCK DATA
      setAppointments([]);
      
    } finally {
      setLoading(false);
    }
  };
  
  // Request Refund for a cancelled appointment
  const requestRefund = async (appointment) => {
    setRefundLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Find the transaction for the appointment
      const txRes = await axios.get(
        `http://localhost:3005/api/payments/appointment/${appointment._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const transaction = txRes.data.data;

      if (!transaction || transaction.status !== 'succeeded') {
        setError('No completed payment found for this appointment to refund.');
        setTimeout(() => setError(null), 4000);
        return;
      }

      // Step 2: Submit refund request
      await axios.post(
        'http://localhost:3005/api/refunds',
        {
          transactionId: transaction._id,
          reason: 'appointment_cancelled',
          notes: 'Patient requested refund after appointment cancellation.',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRefundedAppointments(prev => new Set([...prev, appointment._id]));
      setSuccess('Refund request submitted! You will receive an email confirmation shortly.');
      setTimeout(() => setSuccess(null), 5000);
      setShowDetailsModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit refund request.';
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setRefundLoading(false);
    }
  };

  // Cancel appointment (with automatic refund if payment exists)
  const cancelAppointment = async (id, reason) => {
    try {
      const token = localStorage.getItem('token');

      // Step 1: Cancel the appointment
      await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: reason || 'Cancelled by patient' }
      });

      // Step 2: Silently try to auto-refund if payment exists
      let refundTriggered = false;
      try {
        const txRes = await axios.get(
          `http://localhost:3005/api/payments/appointment/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const transaction = txRes.data?.data;
        if (transaction && transaction.status === 'succeeded') {
          await axios.post(
            'http://localhost:3005/api/refunds',
            {
              transactionId: transaction._id,
              reason: 'appointment_cancelled',
              notes: 'Automatically requested — patient cancelled appointment.',
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          refundTriggered = true;
          setRefundedAppointments(prev => new Set([...prev, id]));
        }
      } catch (_) {
        // Refund not available or already requested — silently ignore
      }

      await fetchAppointments();
      setSuccess(
        refundTriggered
          ? '✅ Appointment cancelled. A refund request has been submitted — check your email for confirmation!'
          : '✅ Appointment cancelled successfully.'
      );
      setTimeout(() => setSuccess(null), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Update appointment
  const updateAppointment = async () => {
    // Validate edit form
    const errors = {};
    if (!editFormData.appointmentDate) errors.appointmentDate = 'Date is required';
    if (!editFormData.timeSlot) errors.timeSlot = 'Time slot is required';
    if (!editFormData.reason.trim()) errors.reason = 'Reason is required';
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    
    try {
      setEditLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `${API_BASE_URL}/appointments/${selectedAppointment._id}/status`,
        {
          status: selectedAppointment.status,
          notes: editFormData.reason,
          appointmentDate: editFormData.appointmentDate,
          timeSlot: editFormData.timeSlot,
          type: editFormData.type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchAppointments();
      setShowEditModal(false);
      setSuccess('Appointment updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
      setTimeout(() => setError(null), 3000);
    } finally {
      setEditLoading(false);
    }
  };
  
  // Open edit modal
  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData({
      appointmentDate: appointment.appointmentDate?.split('T')[0] || '',
      timeSlot: appointment.timeSlot || '',
      type: appointment.type || 'IN_PERSON',
      reason: appointment.reason || ''
    });
    setEditErrors({});
    setShowEditModal(true);
  };
  
  // Open delete confirmation
  const openDeleteConfirm = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete
  const handleDelete = async () => {
    await cancelAppointment(selectedAppointment._id, 'Cancelled by patient');
    setShowDeleteConfirm(false);
  };
  
  // Get status color and icon
  const getStatusDetails = (status) => {
    switch(status) {
      case 'CONFIRMED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmed' };
      case 'PENDING':
        return { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Pending' };
      case 'COMPLETED':
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Completed' };
      case 'CANCELLED':
        return { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: status };
    }
  };
  
  // Get appointment type icon
  const getTypeIcon = (type) => {
    switch(type) {
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'PHONE': return <PhoneCall className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };
  
  // Format date
  const formatAppointmentDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, 'MMM d')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`;
    return format(date, 'EEE, MMM d, yyyy');
  };
  
  // Get relative date text
  const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = differenceInDays(date, today);
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return format(date, 'MMM d');
  };
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 mt-1">Manage and track your healthcare appointments</p>
            </div>
            <button
              onClick={() => window.location.href = '/book-appointment'}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Book New Appointment</span>
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <ClockIcon className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.upcoming}</span>
              </div>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.cancelled}</span>
              </div>
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">${stats.totalSpent}</span>
              </div>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by doctor, specialty, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 transition-colors ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
              </div>
              
              <button
                onClick={fetchAppointments}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="week">Next 7 Days</option>
                  <option value="past">Past</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="IN_PERSON">In Person</option>
                  <option value="VIDEO">Video Call</option>
                  <option value="PHONE">Phone Call</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Sort Options */}
          <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="doctor">Doctor</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Appointments Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.status !== 'all' 
                ? "Try adjusting your filters to see more results"
                : "You haven't booked any appointments yet"}
            </p>
            <button
              onClick={() => window.location.href = '/book-appointment'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Book Your First Appointment
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((appointment) => {
              const statusDetails = getStatusDetails(appointment.status);
              const StatusIcon = statusDetails.icon;
              const isUpcoming = !isPast(new Date(appointment.appointmentDate)) && 
                                appointment.status !== 'CANCELLED' && 
                                appointment.status !== 'COMPLETED';
              
              return (
                <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
                  {/* Status Bar */}
                  <div className={`h-1 ${appointment.status === 'CONFIRMED' ? 'bg-green-500' : 
                    appointment.status === 'PENDING' ? 'bg-yellow-500' :
                    appointment.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                          <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDetails.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusDetails.label}
                      </span>
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>{formatAppointmentDate(appointment.appointmentDate)}</span>
                        <span className="text-gray-300">•</span>
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{appointment.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getTypeIcon(appointment.type)}
                        <span>{appointment.type?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{appointment.reason || 'No reason provided'}</span>
                      </div>
                    </div>
                    
                    {/* Fee */}
                    {appointment.consultationFee && (
                      <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Consultation Fee</p>
                        <p className="font-bold text-gray-900">${appointment.consultationFee}</p>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                      
                      {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => openEditModal(appointment)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(appointment)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((appointment) => {
                    const statusDetails = getStatusDetails(appointment.status);
                    const StatusIcon = statusDetails.icon;
                    
                    return (
                      <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{appointment.doctorName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{appointment.specialty}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatAppointmentDate(appointment.appointmentDate)}</p>
                            <p className="text-xs text-gray-500">{appointment.timeSlot}</p>
                            <p className="text-xs text-blue-600 mt-1">{getRelativeDate(appointment.appointmentDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(appointment.type)}
                            <span className="text-sm text-gray-600">{appointment.type?.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDetails.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusDetails.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">${appointment.consultationFee || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetailsModal(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                              <>
                                <button
                                  onClick={() => openEditModal(appointment)}
                                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(appointment)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Cancel"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Appointment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedAppointment.status === 'CONFIRMED' ? 'bg-green-50 border border-green-200' :
                selectedAppointment.status === 'PENDING' ? 'bg-yellow-50 border border-yellow-200' :
                selectedAppointment.status === 'COMPLETED' ? 'bg-blue-50 border border-blue-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {getStatusDetails(selectedAppointment.status).icon && (
                    <div className={getStatusDetails(selectedAppointment.status).color.split(' ')[0] + ' p-2 rounded-full'}>
                      {React.createElement(getStatusDetails(selectedAppointment.status).icon, { className: "w-5 h-5" })}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {getStatusDetails(selectedAppointment.status).label}
                    </p>
                    {selectedAppointment.status === 'CONFIRMED' && (
                      <p className="text-sm text-gray-600">Your appointment has been confirmed. Please arrive on time.</p>
                    )}
                    {selectedAppointment.status === 'CANCELLED' && selectedAppointment.cancelReason && (
                      <p className="text-sm text-gray-600">Reason: {selectedAppointment.cancelReason}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Doctor Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Doctor Information</h4>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Stethoscope className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">{selectedAppointment.doctorName}</p>
                    <p className="text-gray-600">{selectedAppointment.specialty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8 (120 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Appointment Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">{formatAppointmentDate(selectedAppointment.appointmentDate)}</p>
                  <p className="text-gray-600">{selectedAppointment.timeSlot}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  {getTypeIcon(selectedAppointment.type)}
                  <p className="text-sm text-gray-500 mt-1">Appointment Type</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.type?.replace('_', ' ')}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-sm text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-gray-900">${selectedAppointment.consultationFee || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-500">Appointment ID</p>
                  <p className="font-mono text-sm text-gray-900">{selectedAppointment._id?.slice(-8)}</p>
                </div>
              </div>
              
              {/* Reason */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Reason for Visit</h4>
                <p className="text-gray-700">{selectedAppointment.reason || 'Not specified'}</p>
              </div>
              
              {/* Additional Info */}
              {selectedAppointment.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Doctor's Notes</h4>
                  <p className="text-gray-700">{selectedAppointment.notes}</p>
                </div>
              )}
              
              {/* Location Info */}
              {selectedAppointment.type === 'IN_PERSON' && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Location</h4>
                  <p className="text-gray-600">Healthcare Medical Center</p>
                  <p className="text-gray-600 text-sm">123 Medical Drive, Suite 100, City, State 12345</p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {/* Request Refund button for CANCELLED appointments */}
              {selectedAppointment.status === 'CANCELLED' && !refundedAppointments.has(selectedAppointment._id) && (
                <button
                  onClick={() => requestRefund(selectedAppointment)}
                  disabled={refundLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {refundLoading ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><DollarSign className="w-4 h-4" /> Request Refund</>
                  )}
                </button>
              )}
              {selectedAppointment.status === 'CANCELLED' && refundedAppointments.has(selectedAppointment._id) && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Refund Requested
                </span>
              )}
              {selectedAppointment.status !== 'COMPLETED' && selectedAppointment.status !== 'CANCELLED' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEditModal(selectedAppointment);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Edit Appointment
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openDeleteConfirm(selectedAppointment);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Appointment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Edit Appointment</h3>
              <p className="text-sm text-gray-600 mt-1">Update your appointment details</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={editFormData.appointmentDate}
                  onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.appointmentDate && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.appointmentDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot *</label>
                <select
                  value={editFormData.timeSlot}
                  onChange={(e) => setEditFormData({ ...editFormData, timeSlot: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.timeSlot ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select time slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
                {editErrors.timeSlot && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.timeSlot}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'IN_PERSON', label: 'In Person', icon: Building },
                    { value: 'VIDEO', label: 'Video', icon: Video },
                    { value: 'PHONE', label: 'Phone', icon: PhoneCall }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setEditFormData({ ...editFormData, type: type.value })}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        editFormData.type === type.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:border-blue-500'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit *</label>
                <textarea
                  value={editFormData.reason}
                  onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.reason ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Briefly describe your symptoms or reason for consultation"
                />
                {editErrors.reason && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.reason}</p>
                )}
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Note: Changes are subject to doctor's availability. You'll receive a confirmation email after update.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateAppointment}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Updating...' : 'Update Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Cancel Appointment</h3>
                  <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to cancel your appointment with <strong>{selectedAppointment.doctorName}</strong> on{' '}
                <strong>{formatAppointmentDate(selectedAppointment.appointmentDate)}</strong> at{' '}
                <strong>{selectedAppointment.timeSlot}</strong>?
              </p>

              {/* Refund notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Automatic Refund</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    If you've made a payment for this appointment, a refund request will be
                    automatically submitted and you'll receive an email confirmation.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This time slot will be made available to other patients once cancelled.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Yes, Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
