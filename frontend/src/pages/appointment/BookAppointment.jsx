import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Search,
  ChevronDown,
  Video,
  PhoneCall,
  Building,
  Star,
  Shield,
  CreditCard,
  AlertCircle,
  Heart,
  Activity,
  Baby,
  Brain,
  Bone,
  Eye,
  Smile,
  Droplet,
  ChevronRight,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

const BookAppointment = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Patient Information
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAge: '',
    patientGender: '',
    patientAddress: '',
    
    // Appointment Details
    doctorId: '',
    doctorName: '',
    specialty: '',
    appointmentDate: '',
    timeSlot: '',
    type: 'IN_PERSON',
    reason: '',
    
    // Additional Info
    symptoms: '',
    previousHistory: '',
    allergies: ''
  });
  
  // Data states
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  
  // UI states
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Set date limits
  useEffect(() => {
    const today = new Date();
    const maxDateLimit = new Date();
    maxDateLimit.setMonth(maxDateLimit.getMonth() + 3);
    
    setMinDate(today.toISOString().split('T')[0]);
    setMaxDate(maxDateLimit.toISOString().split('T')[0]);
  }, []);
  
  // Fetch doctors
  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);
  
  // Filter doctors
  useEffect(() => {
    let filtered = doctors;
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedSpecialty) {
      filtered = filtered.filter(doc => doc.specialty === selectedSpecialty);
    }
    setFilteredDoctors(filtered);
  }, [searchTerm, selectedSpecialty, doctors]);
  
  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, formData.appointmentDate]);
  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
      setFilteredDoctors(response.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      // Mock data for demonstration
      setDoctors(mockDoctors);
      setFilteredDoctors(mockDoctors);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSpecialties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/specialties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecialties(response.data);
    } catch (err) {
      // Mock specialties
      setSpecialties([
        'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 
        'Orthopedics', 'Ophthalmology', 'Psychiatry', 'Dentistry',
        'Gynecology', 'ENT', 'General Medicine'
      ]);
    }
  };
  
  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/appointments/slots?doctorId=${selectedDoctor.id}&date=${formData.appointmentDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      // Mock slots
      setAvailableSlots([
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
        '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      consultationFee: doctor.fee
    }));
    setShowDoctorList(false);
    // Clear doctor error
    if (validationErrors.doctor) {
      setValidationErrors(prev => ({ ...prev, doctor: '' }));
    }
  };
  
  const validateStep1 = () => {
    const errors = {};
    if (!formData.patientName.trim()) errors.patientName = 'Full name is required';
    if (!formData.patientEmail.trim()) errors.patientEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.patientEmail)) errors.patientEmail = 'Email is invalid';
    if (!formData.patientPhone.trim()) errors.patientPhone = 'Phone number is required';
    else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.patientPhone)) 
      errors.patientPhone = 'Phone number is invalid';
    if (!formData.patientAge) errors.patientAge = 'Age is required';
    else if (formData.patientAge < 0 || formData.patientAge > 120) errors.patientAge = 'Age must be between 0 and 120';
    if (!formData.patientGender) errors.patientGender = 'Gender is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateStep2 = () => {
    const errors = {};
    if (!selectedDoctor) errors.doctor = 'Please select a doctor';
    if (!formData.appointmentDate) errors.appointmentDate = 'Please select a date';
    if (!formData.timeSlot) errors.timeSlot = 'Please select a time slot';
    if (!formData.reason.trim()) errors.reason = 'Please describe your reason for visit';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };
  
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const appointmentData = {
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        specialty: formData.specialty,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        type: formData.type,
        reason: formData.reason,
        consultationFee: selectedDoctor?.fee || 0,
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        patientAge: formData.patientAge,
        patientGender: formData.patientGender,
        patientAddress: formData.patientAddress,
        symptoms: formData.symptoms,
        previousHistory: formData.previousHistory,
        allergies: formData.allergies
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(true);
      setCurrentStep(4);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      patientName: '', patientEmail: '', patientPhone: '', patientAge: '',
      patientGender: '', patientAddress: '', doctorId: '', doctorName: '',
      specialty: '', appointmentDate: '', timeSlot: '', type: 'IN_PERSON',
      reason: '', symptoms: '', previousHistory: '', allergies: ''
    });
    setSelectedDoctor(null);
    setAvailableSlots([]);
    setTermsAccepted(false);
    setSuccess(false);
  };
  
  // Get icon for specialty
  const getSpecialtyIcon = (specialty) => {
    const icons = {
      Cardiology: <Heart className="w-5 h-5" />,
      Neurology: <Brain className="w-5 h-5" />,
      Pediatrics: <Baby className="w-5 h-5" />,
      Orthopedics: <Bone className="w-5 h-5" />,
      Ophthalmology: <Eye className="w-5 h-5" />,
      Dermatology: <Smile className="w-5 h-5" />,
      Dentistry: <Activity className="w-5 h-5" />
    };
    return icons[specialty] || <Stethoscope className="w-5 h-5" />;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Your Appointment
          </h1>
          <p className="text-gray-600">
            Schedule a consultation with our expert doctors
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            {[
              { step: 1, title: 'Patient Info', icon: User },
              { step: 2, title: 'Select Doctor', icon: Stethoscope },
              { step: 3, title: 'Confirm & Pay', icon: CreditCard },
              { step: 4, title: 'Confirmation', icon: CheckCircle }
            ].map((item) => (
              <div key={item.step} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2
                    transition-all duration-300 z-10 relative
                    ${currentStep >= item.step 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'}
                    ${currentStep === item.step ? 'ring-4 ring-blue-200' : ''}
                  `}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.title}</span>
                </div>
                {item.step < 4 && (
                  <div className={`
                    absolute top-6 left-1/2 w-full h-0.5
                    transition-all duration-300
                    ${currentStep > item.step ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Sidebar */}
            <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Why Choose Us?</h3>
                <p className="text-blue-100 text-sm">Experience the best healthcare services</p>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Star, text: 'Expert Doctors', desc: 'Highly qualified professionals' },
                  { icon: Shield, text: 'Safe & Secure', desc: 'Your data is protected' },
                  { icon: Clock, text: '24/7 Support', desc: 'Round the clock assistance' },
                  { icon: Video, text: 'Virtual Visits', desc: 'Online consultation available' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 mt-1" />
                    <div>
                      <p className="font-semibold">{item.text}</p>
                      <p className="text-sm text-blue-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-blue-400">
                <p className="text-sm text-blue-100">Need help?</p>
                <p className="font-semibold">+1 234 567 8900</p>
                <p className="text-sm text-blue-100">support@healthcare.com</p>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="md:col-span-2 p-8">
              {/* Step 1: Patient Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Patient Information</h2>
                  <p className="text-gray-600">Please provide your personal details</p>
                  
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="patientName"
                          value={formData.patientName}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {validationErrors.patientName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="patientEmail"
                          value={formData.patientEmail}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientEmail ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="your@email.com"
                        />
                      </div>
                      {validationErrors.patientEmail && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientEmail}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="patientPhone"
                          value={formData.patientPhone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientPhone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      {validationErrors.patientPhone && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientPhone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="patientAge"
                        value={formData.patientAge}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.patientAge ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your age"
                      />
                      {validationErrors.patientAge && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientAge}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        name="patientGender"
                        value={formData.patientGender}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.patientGender ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      {validationErrors.patientGender && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientGender}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                        <textarea
                          name="patientAddress"
                          value={formData.patientAddress}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full address"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Select Doctor & Appointment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Select Doctor & Schedule</h2>
                  <p className="text-gray-600">Choose your preferred doctor and time slot</p>
                  
                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor *
                    </label>
                    {!selectedDoctor ? (
                      <div>
                        <div className="flex gap-3 mb-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search by name or specialty..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Specialties</option>
                            {specialties.map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {filteredDoctors.map(doctor => (
                            <div
                              key={doctor.id}
                              onClick={() => selectDoctor(doctor)}
                              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                  {getSpecialtyIcon(doctor.specialty)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600">{doctor.rating || '4.8'}</span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">${doctor.fee || '100'} / visit</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {validationErrors.doctor && (
                          <p className="mt-2 text-sm text-red-600">{validationErrors.doctor}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                              <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
                              <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                              <p className="text-sm text-blue-600 mt-1">Fee: ${selectedDoctor.fee}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedDoctor(null)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Date and Time Selection */}
                  {selectedDoctor && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Date *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={handleInputChange}
                            min={minDate}
                            max={maxDate}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {validationErrors.appointmentDate && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.appointmentDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Time Slot *
                        </label>
                        {loading ? (
                          <div className="flex justify-center py-8">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map(slot => (
                              <button
                                key={slot}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, timeSlot: slot }));
                                  if (validationErrors.timeSlot) {
                                    setValidationErrors(prev => ({ ...prev, timeSlot: '' }));
                                  }
                                }}
                                className={`
                                  px-3 py-2 text-sm rounded-lg border transition-all
                                  ${formData.timeSlot === slot 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'border-gray-300 text-gray-700 hover:border-blue-500'
                                  }
                                `}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        )}
                        {validationErrors.timeSlot && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.timeSlot}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Visit *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.reason ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Briefly describe your symptoms or reason for consultation"
                    />
                    {validationErrors.reason && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.reason}</p>
                    )}
                  </div>
                  
                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'IN_PERSON', icon: Building, label: 'In Person' },
                        { value: 'VIDEO', icon: Video, label: 'Video Call' },
                        { value: 'PHONE', icon: PhoneCall, label: 'Phone Call' }
                      ].map(type => (
                        <button
                          key={type.value}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          className={`
                            flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all
                            ${formData.type === type.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:border-blue-500'
                            }
                          `}
                        >
                          <type.icon className="w-4 h-4" />
                          <span className="text-sm">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Confirm & Additional Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Confirm Appointment</h2>
                  <p className="text-gray-600">Review your details and confirm booking</p>
                  
                  {/* Appointment Summary */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">Appointment Summary</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Patient Name</p>
                        <p className="font-medium">{formData.patientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-medium">{formData.patientPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-medium">{selectedDoctor?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Specialty</p>
                        <p className="font-medium">{selectedDoctor?.specialty}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">
                          {formData.appointmentDate} at {formData.timeSlot}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Appointment Type</p>
                        <p className="font-medium">{formData.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Consultation Fee</p>
                        <p className="font-bold text-blue-600">${selectedDoctor?.fee}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Medical Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Additional Information (Optional)</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Symptoms
                      </label>
                      <textarea
                        name="symptoms"
                        value={formData.symptoms}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="List any symptoms you're experiencing"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical History
                      </label>
                      <textarea
                        name="previousHistory"
                        value={formData.previousHistory}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any previous medical conditions or surgeries"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any allergies to medications or substances"
                      />
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I confirm that the information provided is accurate and agree to the 
                      <button className="text-blue-600 hover:underline mx-1">Terms of Service</button>
                      and 
                      <button className="text-blue-600 hover:underline mx-1">Privacy Policy</button>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Step 4: Success */}
              {currentStep === 4 && success && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
                  <p className="text-gray-600 mb-4">
                    Your appointment has been confirmed. A confirmation email has been sent to {formData.patientEmail}
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-gray-600">Appointment ID: <span className="font-mono font-semibold">APT-{Math.random().toString(36).substr(2, 8).toUpperCase()}</span></p>
                    <p className="text-sm text-gray-600 mt-1">Please arrive 15 minutes before your scheduled time</p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Another Appointment
                  </button>
                </div>
              )}
              
              {/* Navigation Buttons */}
              {currentStep < 4 && !success && (
                <div className="flex justify-between mt-8 pt-6 border-t">
                  {currentStep > 1 ? (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  ) : (
                    <div></div>
                  )}
                  
                  {currentStep < 3 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : currentStep === 3 && (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirm & Book
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Secure Booking', desc: 'Your data is encrypted and secure' },
            { icon: Clock, title: '24/7 Support', desc: 'Round the clock assistance' },
            { icon: CreditCard, title: 'Easy Payment', desc: 'Multiple payment options' },
            { icon: Video, title: 'Virtual Visits', desc: 'Online consultation available' }
          ].map((feature, idx) => (
            <div key={idx} className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mock data for demonstration
const mockDoctors = [
  { id: 1, name: 'Dr. Sarah Wilson', specialty: 'Cardiology', rating: 4.9, fee: 150, experience: '12 years' },
  { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', rating: 4.8, fee: 180, experience: '10 years' },
  { id: 3, name: 'Dr. Emily Brown', specialty: 'Pediatrics', rating: 4.9, fee: 120, experience: '8 years' },
  { id: 4, name: 'Dr. James Rodriguez', specialty: 'Orthopedics', rating: 4.7, fee: 160, experience: '15 years' },
  { id: 5, name: 'Dr. Lisa Anderson', specialty: 'Dermatology', rating: 4.8, fee: 140, experience: '7 years' },
  { id: 6, name: 'Dr. Robert Taylor', specialty: 'Ophthalmology', rating: 4.6, fee: 130, experience: '9 years' },
];

const mockSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
];

export default BookAppointment;