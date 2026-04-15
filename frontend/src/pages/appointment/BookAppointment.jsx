// import React, { useState, useEffect } from 'react';
// import {
//   Calendar,
//   Clock,
//   User,
//   Stethoscope,
//   Phone,
//   Mail,
//   MapPin,
//   ArrowLeft,
//   ArrowRight,
//   CheckCircle,
//   Loader,
//   Search,
//   ChevronDown,
//   Video,
//   PhoneCall,
//   Building,
//   Star,
//   Shield,
//   CreditCard,
//   AlertCircle,
//   Heart,
//   Activity,
//   Baby,
//   Brain,
//   Bone,
//   Eye,
//   Smile,
//   Droplet,
//   ChevronRight,
//   X
// } from 'lucide-react';
// import axios from 'axios';
// import PayHereCheckout from '../../components/payment/PayHereCheckout';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const BookAppointment = () => {
//   // Step management
//   const [currentStep, setCurrentStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState(null);
//   const [appointmentId, setAppointmentId] = useState(null);

//   // Form data
//   const [formData, setFormData] = useState({
//     // Patient Information
//     patientName: '',
//     patientEmail: '',
//     patientPhone: '',
//     patientAge: '',
//     patientGender: '',
//     patientAddress: '',

//     // Appointment Details
//     doctorId: '',
//     doctorName: '',
//     specialty: '',
//     appointmentDate: '',
//     timeSlot: '',
//     type: 'IN_PERSON',
//     reason: '',

//     // Additional Info
//     symptoms: '',
//     previousHistory: '',
//     allergies: ''
//   });

//   // Data states
//   const [doctors, setDoctors] = useState([]);
//   const [filteredDoctors, setFilteredDoctors] = useState([]);
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [specialties, setSpecialties] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedSpecialty, setSelectedSpecialty] = useState('');
//   const [minDate, setMinDate] = useState('');
//   const [maxDate, setMaxDate] = useState('');

//   // UI states
//   const [showDoctorList, setShowDoctorList] = useState(false);
//   const [termsAccepted, setTermsAccepted] = useState(false);
//   const [validationErrors, setValidationErrors] = useState({});

//   // Set date limits
//   useEffect(() => {
//     const today = new Date();
//     const maxDateLimit = new Date();
//     maxDateLimit.setMonth(maxDateLimit.getMonth() + 3);

//     setMinDate(today.toISOString().split('T')[0]);
//     setMaxDate(maxDateLimit.toISOString().split('T')[0]);
//   }, []);

//   // Fetch doctors
//   useEffect(() => {
//     fetchDoctors();
//     fetchSpecialties();
//   }, []);

//   // Filter doctors and derive specialty list from real data
//   useEffect(() => {
//     let filtered = doctors;
//     if (searchTerm) {
//       filtered = filtered.filter(doc =>
//         doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
//     if (selectedSpecialty) {
//       filtered = filtered.filter(doc => doc.specialty === selectedSpecialty);
//     }
//     setFilteredDoctors(filtered);

//     // Build specialty list from whatever doctors are loaded
//     const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
//     if (uniqueSpecialties.length > 0) setSpecialties(uniqueSpecialties);
//   }, [searchTerm, selectedSpecialty, doctors]);

//   // Fetch available slots when doctor or date changes
//   useEffect(() => {
//     if (selectedDoctor && formData.appointmentDate) {
//       fetchAvailableSlots();
//     }
//   }, [selectedDoctor, formData.appointmentDate]);

//   const fetchDoctors = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       // Fetch all verified (approved) doctors — public endpoint, no admin role needed
//       const response = await axios.get(`${API_BASE_URL}/auth/doctors/verified`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       // Map the real MongoDB doctor documents to the shape the UI expects
//       const doctorList = (response.data?.data || [])
//         .filter(doc => doc) // all returned are already verified
//         .map(doc => ({
//           id: doc._id,
//           name: doc.name,
//           specialty: doc.specialty || 'General Medicine',
//           email: doc.email,
//           rating: doc.rating || '4.8',
//           fee: doc.consultationFee || doc.fee || 100,
//           experience: doc.experience || 'N/A',
//         }));
//       setDoctors(doctorList);
//       setFilteredDoctors(doctorList);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch doctors:', err);
//       setError('Unable to load doctors. Please make sure you are logged in and try again.');
//       setDoctors([]);
//       setFilteredDoctors([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSpecialties = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${API_BASE_URL}/specialties`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setSpecialties(response.data);
//     } catch (err) {
//       // Mock specialties
//       setSpecialties([
//         'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics',
//         'Orthopedics', 'Ophthalmology', 'Psychiatry', 'Dentistry',
//         'Gynecology', 'ENT', 'General Medicine'
//       ]);
//     }
//   };

//   const fetchAvailableSlots = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.get(
//         `${API_BASE_URL}/appointments/slots?doctorId=${selectedDoctor.id}&date=${formData.appointmentDate}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setAvailableSlots(response.data.availableSlots);
//     } catch (err) {
//       console.error('Failed to fetch slots:', err);
//       // Mock slots
//       setAvailableSlots([
//         '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
//         '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     // Clear error for this field
//     if (validationErrors[name]) {
//       setValidationErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const selectDoctor = (doctor) => {
//     setSelectedDoctor(doctor);
//     setFormData(prev => ({
//       ...prev,
//       doctorId: doctor.id,
//       doctorName: doctor.name,
//       specialty: doctor.specialty,
//       consultationFee: doctor.fee
//     }));
//     setShowDoctorList(false);
//     // Clear doctor error
//     if (validationErrors.doctor) {
//       setValidationErrors(prev => ({ ...prev, doctor: '' }));
//     }
//   };

//   const validateStep1 = () => {
//     const errors = {};
//     if (!formData.patientName.trim()) errors.patientName = 'Full name is required';
//     if (!formData.patientEmail.trim()) errors.patientEmail = 'Email is required';
//     else if (!/\S+@\S+\.\S+/.test(formData.patientEmail)) errors.patientEmail = 'Email is invalid';
//     if (!formData.patientPhone.trim()) errors.patientPhone = 'Phone number is required';
//     else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.patientPhone))
//       errors.patientPhone = 'Phone number is invalid';
//     if (!formData.patientAge) errors.patientAge = 'Age is required';
//     else if (formData.patientAge < 0 || formData.patientAge > 120) errors.patientAge = 'Age must be between 0 and 120';
//     if (!formData.patientGender) errors.patientGender = 'Gender is required';

//     setValidationErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validateStep2 = () => {
//     const errors = {};
//     if (!selectedDoctor) errors.doctor = 'Please select a doctor';
//     if (!formData.appointmentDate) errors.appointmentDate = 'Please select a date';
//     if (!formData.timeSlot) errors.timeSlot = 'Please select a time slot';
//     if (!formData.reason.trim()) errors.reason = 'Please describe your reason for visit';

//     setValidationErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleNext = () => {
//     if (currentStep === 1 && validateStep1()) {
//       setCurrentStep(2);
//     } else if (currentStep === 2 && validateStep2()) {
//       setCurrentStep(3);
//     }
//   };

//   const handleBack = () => {
//     setCurrentStep(prev => prev - 1);
//   };

//   const handleSubmit = async () => {
//     if (!termsAccepted) {
//       setError('Please accept the terms and conditions');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError(null);

//       const token = localStorage.getItem('token');
//       const appointmentData = {
//         doctorId: formData.doctorId,
//         doctorName: formData.doctorName,
//         specialty: formData.specialty,
//         appointmentDate: formData.appointmentDate,
//         timeSlot: formData.timeSlot,
//         type: formData.type,
//         reason: formData.reason,
//         consultationFee: selectedDoctor?.fee || 0,
//         patientName: formData.patientName,
//         patientEmail: formData.patientEmail,
//         patientPhone: formData.patientPhone,
//         patientAge: formData.patientAge,
//         patientGender: formData.patientGender,
//         patientAddress: formData.patientAddress,
//         symptoms: formData.symptoms,
//         previousHistory: formData.previousHistory,
//         allergies: formData.allergies
//       };

//       const response = await axios.post(
//         `${API_BASE_URL}/appointments`,
//         appointmentData,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setAppointmentId(response.data.appointment?._id || `DEP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
//       setSuccess(true);
//       setCurrentStep(4);

//       // Reset form after 3 seconds
//       setTimeout(() => {
//         resetForm();
//       }, 3000);

//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const resetForm = () => {
//     setCurrentStep(1);
//     setFormData({
//       patientName: '', patientEmail: '', patientPhone: '', patientAge: '',
//       patientGender: '', patientAddress: '', doctorId: '', doctorName: '',
//       specialty: '', appointmentDate: '', timeSlot: '', type: 'IN_PERSON',
//       reason: '', symptoms: '', previousHistory: '', allergies: ''
//     });
//     setSelectedDoctor(null);
//     setAvailableSlots([]);
//     setTermsAccepted(false);
//     setSuccess(false);
//     setAppointmentId(null);
//   };

//   // Get icon for specialty
//   const getSpecialtyIcon = (specialty) => {
//     const icons = {
//       Cardiology: <Heart className="w-5 h-5" />,
//       Neurology: <Brain className="w-5 h-5" />,
//       Pediatrics: <Baby className="w-5 h-5" />,
//       Orthopedics: <Bone className="w-5 h-5" />,
//       Ophthalmology: <Eye className="w-5 h-5" />,
//       Dermatology: <Smile className="w-5 h-5" />,
//       Dentistry: <Activity className="w-5 h-5" />
//     };
//     return icons[specialty] || <Stethoscope className="w-5 h-5" />;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
//       <div className="container mx-auto px-4 py-8 max-w-6xl">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">
//             Book Your Appointment
//           </h1>
//           <p className="text-gray-600">
//             Schedule a consultation with our expert doctors
//           </p>
//         </div>

//         {/* Progress Steps */}
//         <div className="mb-12">
//           <div className="flex justify-between items-center max-w-3xl mx-auto">
//             {[
//               { step: 1, title: 'Patient Info', icon: User },
//               { step: 2, title: 'Select Doctor', icon: Stethoscope },
//               { step: 3, title: 'Confirm & Pay', icon: CreditCard },
//               { step: 4, title: 'Confirmation', icon: CheckCircle }
//             ].map((item) => (
//               <div key={item.step} className="flex-1 relative">
//                 <div className="flex flex-col items-center">
//                   <div className={`
//                     w-12 h-12 rounded-full flex items-center justify-center mb-2
//                     transition-all duration-300 z-10 relative
//                     ${currentStep >= item.step
//                       ? 'bg-blue-600 text-white shadow-lg'
//                       : 'bg-gray-200 text-gray-500'}
//                     ${currentStep === item.step ? 'ring-4 ring-blue-200' : ''}
//                   `}>
//                     <item.icon className="w-5 h-5" />
//                   </div>
//                   <span className="text-sm font-medium text-gray-600">{item.title}</span>
//                 </div>
//                 {item.step < 4 && (
//                   <div className={`
//                     absolute top-6 left-1/2 w-full h-0.5
//                     transition-all duration-300
//                     ${currentStep > item.step ? 'bg-blue-600' : 'bg-gray-200'}
//                   `} />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600" />
//             <p className="text-red-600 flex-1">{error}</p>
//             <button onClick={() => setError(null)} className="text-red-600">
//               <X className="w-4 h-4" />
//             </button>
//           </div>
//         )}

//         {/* Main Form */}
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//           <div className="grid md:grid-cols-3">
//             {/* Sidebar */}
//             <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
//               <div className="mb-8">
//                 <h3 className="text-xl font-bold mb-2">Why Choose Us?</h3>
//                 <p className="text-blue-100 text-sm">Experience the best healthcare services</p>
//               </div>

//               <div className="space-y-4">
//                 {[
//                   { icon: Star, text: 'Expert Doctors', desc: 'Highly qualified professionals' },
//                   { icon: Shield, text: 'Safe & Secure', desc: 'Your data is protected' },
//                   { icon: Clock, text: '24/7 Support', desc: 'Round the clock assistance' },
//                   { icon: Video, text: 'Virtual Visits', desc: 'Online consultation available' }
//                 ].map((item, idx) => (
//                   <div key={idx} className="flex items-start gap-3">
//                     <item.icon className="w-5 h-5 mt-1" />
//                     <div>
//                       <p className="font-semibold">{item.text}</p>
//                       <p className="text-sm text-blue-100">{item.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-8 pt-8 border-t border-blue-400">
//                 <p className="text-sm text-blue-100">Need help?</p>
//                 <p className="font-semibold">+1 234 567 8900</p>
//                 <p className="text-sm text-blue-100">support@healthcare.com</p>
//               </div>
//             </div>

//             {/* Form Content */}
//             <div className="md:col-span-2 p-8">
//               {/* Step 1: Patient Information */}
//               {currentStep === 1 && (
//                 <div className="space-y-6">
//                   <h2 className="text-2xl font-bold text-gray-900">Patient Information</h2>
//                   <p className="text-gray-600">Please provide your personal details</p>

//                   <div className="grid md:grid-cols-2 gap-5">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Full Name *
//                       </label>
//                       <div className="relative">
//                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                         <input
//                           type="text"
//                           name="patientName"
//                           value={formData.patientName}
//                           onChange={handleInputChange}
//                           className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.patientName ? 'border-red-500' : 'border-gray-300'
//                             }`}
//                           placeholder="Enter your full name"
//                         />
//                       </div>
//                       {validationErrors.patientName && (
//                         <p className="mt-1 text-sm text-red-600">{validationErrors.patientName}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Email Address *
//                       </label>
//                       <div className="relative">
//                         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                         <input
//                           type="email"
//                           name="patientEmail"
//                           value={formData.patientEmail}
//                           onChange={handleInputChange}
//                           className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.patientEmail ? 'border-red-500' : 'border-gray-300'
//                             }`}
//                           placeholder="your@email.com"
//                         />
//                       </div>
//                       {validationErrors.patientEmail && (
//                         <p className="mt-1 text-sm text-red-600">{validationErrors.patientEmail}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Phone Number *
//                       </label>
//                       <div className="relative">
//                         <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                         <input
//                           type="tel"
//                           name="patientPhone"
//                           value={formData.patientPhone}
//                           onChange={handleInputChange}
//                           className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.patientPhone ? 'border-red-500' : 'border-gray-300'
//                             }`}
//                           placeholder="+1 234 567 8900"
//                         />
//                       </div>
//                       {validationErrors.patientPhone && (
//                         <p className="mt-1 text-sm text-red-600">{validationErrors.patientPhone}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Age *
//                       </label>
//                       <input
//                         type="number"
//                         name="patientAge"
//                         value={formData.patientAge}
//                         onChange={handleInputChange}
//                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.patientAge ? 'border-red-500' : 'border-gray-300'
//                           }`}
//                         placeholder="Enter your age"
//                       />
//                       {validationErrors.patientAge && (
//                         <p className="mt-1 text-sm text-red-600">{validationErrors.patientAge}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Gender *
//                       </label>
//                       <select
//                         name="patientGender"
//                         value={formData.patientGender}
//                         onChange={handleInputChange}
//                         className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.patientGender ? 'border-red-500' : 'border-gray-300'
//                           }`}
//                       >
//                         <option value="">Select Gender</option>
//                         <option value="Male">Male</option>
//                         <option value="Female">Female</option>
//                         <option value="Other">Other</option>
//                         <option value="Prefer not to say">Prefer not to say</option>
//                       </select>
//                       {validationErrors.patientGender && (
//                         <p className="mt-1 text-sm text-red-600">{validationErrors.patientGender}</p>
//                       )}
//                     </div>

//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Address
//                       </label>
//                       <div className="relative">
//                         <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
//                         <textarea
//                           name="patientAddress"
//                           value={formData.patientAddress}
//                           onChange={handleInputChange}
//                           rows="2"
//                           className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           placeholder="Enter your full address"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Step 2: Select Doctor & Appointment */}
//               {currentStep === 2 && (
//                 <div className="space-y-6">
//                   <h2 className="text-2xl font-bold text-gray-900">Select Doctor & Schedule</h2>
//                   <p className="text-gray-600">Choose your preferred doctor and time slot</p>

//                   {/* Doctor Selection */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Select Doctor *
//                     </label>
//                     {!selectedDoctor ? (
//                       <div>
//                         <div className="flex gap-3 mb-4">
//                           <div className="flex-1 relative">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                             <input
//                               type="text"
//                               placeholder="Search by name or specialty..."
//                               value={searchTerm}
//                               onChange={(e) => setSearchTerm(e.target.value)}
//                               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             />
//                           </div>
//                           <select
//                             value={selectedSpecialty}
//                             onChange={(e) => setSelectedSpecialty(e.target.value)}
//                             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           >
//                             <option value="">All Specialties</option>
//                             {specialties.map(spec => (
//                               <option key={spec} value={spec}>{spec}</option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
//                           {filteredDoctors.map(doctor => (
//                             <div
//                               key={doctor.id}
//                               onClick={() => selectDoctor(doctor)}
//                               className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
//                             >
//                               <div className="flex items-start gap-3">
//                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
//                                   {getSpecialtyIcon(doctor.specialty)}
//                                 </div>
//                                 <div className="flex-1">
//                                   <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
//                                   <p className="text-sm text-gray-600">{doctor.specialty}</p>
//                                   <div className="flex items-center gap-2 mt-1">
//                                     <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                                     <span className="text-sm text-gray-600">{doctor.rating || '4.8'}</span>
//                                     <span className="text-xs text-gray-400">•</span>
//                                     <span className="text-sm text-gray-600">${doctor.fee || '100'} / visit</span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                         {validationErrors.doctor && (
//                           <p className="mt-2 text-sm text-red-600">{validationErrors.doctor}</p>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                         <div className="flex justify-between items-start">
//                           <div className="flex gap-3">
//                             <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
//                               <Stethoscope className="w-6 h-6 text-white" />
//                             </div>
//                             <div>
//                               <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
//                               <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
//                               <p className="text-sm text-blue-600 mt-1">Fee: ${selectedDoctor.fee}</p>
//                             </div>
//                           </div>
//                           <button
//                             onClick={() => setSelectedDoctor(null)}
//                             className="text-red-600 hover:text-red-700 text-sm"
//                           >
//                             Change
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Date and Time Selection */}
//                   {selectedDoctor && (
//                     <div className="grid md:grid-cols-2 gap-5">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Select Date *
//                         </label>
//                         <div className="relative">
//                           <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                           <input
//                             type="date"
//                             name="appointmentDate"
//                             value={formData.appointmentDate}
//                             onChange={handleInputChange}
//                             min={minDate}
//                             max={maxDate}
//                             className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.appointmentDate ? 'border-red-500' : 'border-gray-300'
//                               }`}
//                           />
//                         </div>
//                         {validationErrors.appointmentDate && (
//                           <p className="mt-1 text-sm text-red-600">{validationErrors.appointmentDate}</p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Select Time Slot *
//                         </label>
//                         {loading ? (
//                           <div className="flex justify-center py-8">
//                             <Loader className="w-8 h-8 animate-spin text-blue-600" />
//                           </div>
//                         ) : (
//                           <div className="grid grid-cols-3 gap-2">
//                             {availableSlots.map(slot => (
//                               <button
//                                 key={slot}
//                                 onClick={() => {
//                                   setFormData(prev => ({ ...prev, timeSlot: slot }));
//                                   if (validationErrors.timeSlot) {
//                                     setValidationErrors(prev => ({ ...prev, timeSlot: '' }));
//                                   }
//                                 }}
//                                 className={`
//                                   px-3 py-2 text-sm rounded-lg border transition-all
//                                   ${formData.timeSlot === slot
//                                     ? 'bg-blue-600 text-white border-blue-600'
//                                     : 'border-gray-300 text-gray-700 hover:border-blue-500'
//                                   }
//                                 `}
//                               >
//                                 {slot}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                         {validationErrors.timeSlot && (
//                           <p className="mt-1 text-sm text-red-600">{validationErrors.timeSlot}</p>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* Reason for Visit */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Reason for Visit *
//                     </label>
//                     <textarea
//                       name="reason"
//                       value={formData.reason}
//                       onChange={handleInputChange}
//                       rows="3"
//                       className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.reason ? 'border-red-500' : 'border-gray-300'
//                         }`}
//                       placeholder="Briefly describe your symptoms or reason for consultation"
//                     />
//                     {validationErrors.reason && (
//                       <p className="mt-1 text-sm text-red-600">{validationErrors.reason}</p>
//                     )}
//                   </div>

//                   {/* Appointment Type */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Appointment Type
//                     </label>
//                     <div className="grid grid-cols-3 gap-3">
//                       {[
//                         { value: 'IN_PERSON', icon: Building, label: 'In Person' },
//                         { value: 'VIDEO', icon: Video, label: 'Video Call' },
//                         { value: 'PHONE', icon: PhoneCall, label: 'Phone Call' }
//                       ].map(type => (
//                         <button
//                           key={type.value}
//                           onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
//                           className={`
//                             flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all
//                             ${formData.type === type.value
//                               ? 'bg-blue-600 text-white border-blue-600'
//                               : 'border-gray-300 text-gray-700 hover:border-blue-500'
//                             }
//                           `}
//                         >
//                           <type.icon className="w-4 h-4" />
//                           <span className="text-sm">{type.label}</span>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Step 3: Confirm & Additional Info */}
//               {currentStep === 3 && (
//                 <div className="space-y-6">
//                   <h2 className="text-2xl font-bold text-gray-900">Confirm Appointment</h2>
//                   <p className="text-gray-600">Review your details and confirm booking</p>

//                   {/* Appointment Summary */}
//                   <div className="bg-gray-50 rounded-xl p-6 space-y-4">
//                     <h3 className="font-semibold text-gray-900">Appointment Summary</h3>

//                     <div className="grid md:grid-cols-2 gap-4">
//                       <div>
//                         <p className="text-sm text-gray-500">Patient Name</p>
//                         <p className="font-medium">{formData.patientName}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Contact</p>
//                         <p className="font-medium">{formData.patientPhone}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Doctor</p>
//                         <p className="font-medium">{selectedDoctor?.name}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Specialty</p>
//                         <p className="font-medium">{selectedDoctor?.specialty}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Date & Time</p>
//                         <p className="font-medium">
//                           {formData.appointmentDate} at {formData.timeSlot}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Appointment Type</p>
//                         <p className="font-medium">{formData.type.replace('_', ' ')}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Consultation Fee</p>
//                         <p className="font-bold text-blue-600">${selectedDoctor?.fee}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Additional Medical Information */}
//                   <div className="space-y-4">
//                     <h3 className="font-semibold text-gray-900">Additional Information (Optional)</h3>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Symptoms
//                       </label>
//                       <textarea
//                         name="symptoms"
//                         value={formData.symptoms}
//                         onChange={handleInputChange}
//                         rows="2"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         placeholder="List any symptoms you're experiencing"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Medical History
//                       </label>
//                       <textarea
//                         name="previousHistory"
//                         value={formData.previousHistory}
//                         onChange={handleInputChange}
//                         rows="2"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         placeholder="Any previous medical conditions or surgeries"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Allergies
//                       </label>
//                       <textarea
//                         name="allergies"
//                         value={formData.allergies}
//                         onChange={handleInputChange}
//                         rows="2"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         placeholder="Any allergies to medications or substances"
//                       />
//                     </div>
//                   </div>

//                   {/* Terms and Conditions */}
//                   <div className="flex items-start gap-3">
//                     <input
//                       type="checkbox"
//                       id="terms"
//                       checked={termsAccepted}
//                       onChange={(e) => setTermsAccepted(e.target.checked)}
//                       className="mt-1 w-4 h-4 text-blue-600 rounded"
//                     />
//                     <label htmlFor="terms" className="text-sm text-gray-600">
//                       I confirm that the information provided is accurate and agree to the
//                       <button className="text-blue-600 hover:underline mx-1">Terms of Service</button>
//                       and
//                       <button className="text-blue-600 hover:underline mx-1">Privacy Policy</button>
//                     </label>
//                   </div>
//                 </div>
//               )}

//               {/* Step 4: Success */}
//               {currentStep === 4 && success && (
//                 <div className="text-center py-12">
//                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                     <CheckCircle className="w-10 h-10 text-green-600" />
//                   </div>
//                   <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
//                   <p className="text-gray-600 mb-4">
//                     Your appointment has been confirmed. A confirmation email has been sent to {formData.patientEmail}
//                   </p>
//                   <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
//                     <p className="text-sm text-gray-600">Appointment ID: <span className="font-mono font-semibold">{appointmentId || 'APT-0000'}</span></p>
//                     <p className="text-sm text-gray-600 mt-1">Please arrive 15 minutes before your scheduled time</p>
//                   </div>

//                   <div className="mt-8 max-w-md mx-auto">
//                     <PayHereCheckout
//                       appointmentId={appointmentId}
//                       doctorId={formData.doctorId}
//                       amount={selectedDoctor?.fee || 150}
//                       doctorName={selectedDoctor?.name || "Dr. Wilson"}
//                       patientDetails={{
//                         firstName: formData.patientName.split(' ')[0] || "Patient",
//                         lastName: formData.patientName.split(' ').slice(1).join(' ') || "User",
//                         email: formData.patientEmail,
//                         phone: formData.patientPhone,
//                         address: formData.patientAddress || "Colombo",
//                         city: "Colombo"
//                       }}
//                     />
//                   </div>
//                   <button
//                     onClick={resetForm}
//                     className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                   >
//                     Book Another Appointment
//                   </button>
//                 </div>
//               )}

//               {/* Navigation Buttons */}
//               {currentStep < 4 && !success && (
//                 <div className="flex justify-between mt-8 pt-6 border-t">
//                   {currentStep > 1 ? (
//                     <button
//                       onClick={handleBack}
//                       className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                     >
//                       <ArrowLeft className="w-4 h-4" />
//                       Back
//                     </button>
//                   ) : (
//                     <div></div>
//                   )}

//                   {currentStep < 3 ? (
//                     <button
//                       onClick={handleNext}
//                       className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                     >
//                       Next
//                       <ArrowRight className="w-4 h-4" />
//                     </button>
//                   ) : currentStep === 3 && (
//                     <button
//                       onClick={handleSubmit}
//                       disabled={submitting}
//                       className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
//                     >
//                       {submitting ? (
//                         <>
//                           <Loader className="w-4 h-4 animate-spin" />
//                           Processing...
//                         </>
//                       ) : (
//                         <>
//                           <CheckCircle className="w-4 h-4" />
//                           Confirm & Book
//                         </>
//                       )}
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="mt-12 grid md:grid-cols-4 gap-6">
//           {[
//             { icon: Shield, title: 'Secure Booking', desc: 'Your data is encrypted and secure' },
//             { icon: Clock, title: '24/7 Support', desc: 'Round the clock assistance' },
//             { icon: CreditCard, title: 'Easy Payment', desc: 'Multiple payment options' },
//             { icon: Video, title: 'Virtual Visits', desc: 'Online consultation available' }
//           ].map((feature, idx) => (
//             <div key={idx} className="text-center p-4">
//               <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <feature.icon className="w-6 h-6 text-blue-600" />
//               </div>
//               <h3 className="font-semibold text-gray-900">{feature.title}</h3>
//               <p className="text-sm text-gray-600">{feature.desc}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookAppointment;
import React, { useState, useEffect, useRef } from 'react';
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
  X,
  SlidersHorizontal,
  GraduationCap,
  Briefcase,
  Users,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import PayHereCheckout from '../../components/payment/PayHereCheckout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BookAppointment = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [userData, setUserData] = useState(null);

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
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [topDoctors, setTopDoctors] = useState([]);

  // UI states
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [bookingForSelf, setBookingForSelf] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    specialty: '',
    gender: '',
    minExperience: '',
    maxFee: '',
    sortBy: 'rating'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const modalRef = useRef(null);

  // Set date limits
  useEffect(() => {
    const today = new Date();
    const maxDateLimit = new Date();
    maxDateLimit.setMonth(maxDateLimit.getMonth() + 3);

    setMinDate(today.toISOString().split('T')[0]);
    setMaxDate(maxDateLimit.toISOString().split('T')[0]);
  }, []);

  // Fetch user data and doctors
  useEffect(() => {
    fetchUserProfile();
    fetchDoctors();
  }, []);

  // Filter doctors based on all criteria
  useEffect(() => {
    let filtered = [...doctors];
    
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        (doc.name && doc.name.toLowerCase().includes(searchLower)) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(searchLower)) ||
        (doc.hospital && doc.hospital.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.specialty && filters.specialty !== '') {
      filtered = filtered.filter(doc => doc.specialty === filters.specialty);
    }
    
    if (filters.gender && filters.gender !== '') {
      filtered = filtered.filter(doc => doc.gender === filters.gender);
    }
    
    if (filters.minExperience && filters.minExperience !== '') {
      filtered = filtered.filter(doc => parseInt(doc.experience) >= parseInt(filters.minExperience));
    }
    
    if (filters.maxFee && filters.maxFee !== '') {
      filtered = filtered.filter(doc => doc.fee <= parseInt(filters.maxFee));
    }
    
    // Apply sorting
    switch(filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        filtered.sort((a, b) => parseInt(b.experience || 0) - parseInt(a.experience || 0));
        break;
      case 'fee_low':
        filtered.sort((a, b) => (a.fee || 0) - (b.fee || 0));
        break;
      case 'fee_high':
        filtered.sort((a, b) => (b.fee || 0) - (a.fee || 0));
        break;
      default:
        break;
    }
    
    setFilteredDoctors(filtered);
    
    // Extract unique specialties
    const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
    if (uniqueSpecialties.length > 0) setSpecialties(uniqueSpecialties);
    
    // Set top 4 doctors (highest rated)
    const top = [...doctors]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
    setTopDoctors(top);
  }, [filters, doctors]);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, formData.appointmentDate]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDoctorModal(false);
      }
    };
    
    if (showDoctorModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDoctorModal]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = response.data.data || response.data;
      setUserData(user);
      
      // Auto-fill form with user data (default booking for self)
      setFormData(prev => ({
        ...prev,
        patientName: user.name || '',
        patientEmail: user.email || '',
        patientPhone: user.phone || '',
        patientAge: user.age || '',
        patientGender: user.gender || '',
        patientAddress: user.address || ''
      }));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/doctors/verified`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const doctorList = (response.data?.data || [])
        .filter(doc => doc)
        .map(doc => ({
          id: doc._id,
          name: doc.name,
          specialty: doc.specialty || 'General Medicine',
          email: doc.email,
          rating: doc.rating || 4.5,
          fee: doc.consultationFee || doc.fee || 100,
          experience: doc.experience || 5,
          gender: doc.gender || 'Male',
          hospital: doc.hospital || 'City General Hospital',
          education: doc.education || 'MBBS, MD',
          languages: doc.languages || ['English'],
          about: doc.about || 'Experienced healthcare professional',
          availability: doc.availability || {},
          profileImage: doc.profileImage || null,
          totalPatients: doc.totalPatients || 500,
          reviewCount: doc.reviewCount || 50
        }));
      
      setDoctors(doctorList);
      setFilteredDoctors(doctorList);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Unable to load doctors. Please make sure you are logged in and try again.');
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
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
      
      // Filter only available slots (where isBooked is false)
      const available = (response.data.availableSlots || [])
        .filter(slot => !slot.isBooked)
        .map(slot => slot.time);
      
      setAvailableSlots(available);
      
      // Auto-select first available slot
      if (available.length > 0 && !formData.timeSlot) {
        setFormData(prev => ({ ...prev, timeSlot: available[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBookingTypeChange = (forSelf) => {
    setBookingForSelf(forSelf);
    if (forSelf && userData) {
      // Auto-fill with logged user data
      setFormData(prev => ({
        ...prev,
        patientName: userData.name || '',
        patientPhone: userData.phone || '',
        patientAge: userData.age || '',
        patientGender: userData.gender || '',
        patientAddress: userData.address || ''
      }));
    } else {
      // Clear form for someone else
      setFormData(prev => ({
        ...prev,
        patientName: '',
        patientPhone: '',
        patientAge: '',
        patientGender: '',
        patientAddress: ''
      }));
    }
  };

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      consultationFee: doctor.fee,
      timeSlot: '' // Reset time slot when doctor changes
    }));
    setShowDoctorModal(false);
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

      setAppointmentId(response.data.appointment?._id || response.data.data?._id);
      setSuccess(true);
      setCurrentStep(4);

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
    setAppointmentId(null);
    setBookingForSelf(true);
  };

  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'Cardiology': <Heart className="w-5 h-5" />,
      'Cardiologists': <Heart className="w-5 h-5" />,
      'Neurology': <Brain className="w-5 h-5" />,
      'Pediatrics': <Baby className="w-5 h-5" />,
      'Orthopedics': <Bone className="w-5 h-5" />,
      'Ophthalmology': <Eye className="w-5 h-5" />,
      'Dermatology': <Smile className="w-5 h-5" />,
      'Dentistry': <Activity className="w-5 h-5" />,
      'ENT': <Droplet className="w-5 h-5" />
    };
    return icons[specialty] || <Stethoscope className="w-5 h-5" />;
  };

  // Doctor Modal Component
  const DoctorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Find Your Doctor</h2>
              <p className="text-gray-600 mt-1">Browse and select from our verified specialists</p>
            </div>
            <button
              onClick={() => setShowDoctorModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, specialty, or hospital..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <select
                  value={filters.specialty}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                
                <input
                  type="number"
                  placeholder="Min Experience (years)"
                  value={filters.minExperience}
                  onChange={(e) => setFilters(prev => ({ ...prev, minExperience: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="number"
                  placeholder="Max Fee ($)"
                  value={filters.maxFee}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxFee: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Sort Options */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-gray-600">Sort by:</span>
              {[
                { value: 'rating', label: 'Rating' },
                { value: 'experience', label: 'Experience' },
                { value: 'fee_low', label: 'Fee: Low to High' },
                { value: 'fee_high', label: 'Fee: High to Low' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setFilters({
                  searchTerm: '',
                  specialty: '',
                  gender: '',
                  minExperience: '',
                  maxFee: '',
                  sortBy: 'rating'
                })}
                className="ml-auto text-sm text-blue-600 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Doctor List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredDoctors.map(doctor => (
                <div
                  key={doctor.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => selectDoctor(doctor)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {doctor.name.charAt(0)}
                      </div>
                      {doctor.rating >= 4.5 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">{doctor.rating}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{doctor.experience}+ years experience</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{doctor.hospital}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{doctor.education}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Consultation Fee</p>
                          <p className="text-lg font-bold text-blue-600">${doctor.fee}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">{doctor.totalPatients}+ patients</span>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No doctors found matching your criteria</p>
              <button
                onClick={() => setFilters({
                  searchTerm: '',
                  specialty: '',
                  gender: '',
                  minExperience: '',
                  maxFee: '',
                  sortBy: 'rating'
                })}
                className="mt-4 text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
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
                    ${currentStep > item.step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}
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
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Sidebar */}
            <div className="md:col-span-1 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-6 text-white">
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
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.text}</p>
                      <p className="text-sm text-blue-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-sm text-blue-100">Need help?</p>
                <p className="font-semibold text-lg">+1 234 567 8900</p>
                <p className="text-sm text-blue-100">support@healthcare.com</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="md:col-span-2 p-8">
              {/* Step 1: Patient Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Patient Information</h2>
                      <p className="text-gray-600">Please provide patient details</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookingTypeChange(true)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          bookingForSelf
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Book for Myself
                      </button>
                      <button
                        onClick={() => handleBookingTypeChange(false)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          !bookingForSelf
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Book for Someone Else
                      </button>
                    </div>
                  </div>

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
                          disabled={bookingForSelf}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            validationErrors.patientName ? 'border-red-500' : 'border-gray-300'
                          } ${bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="Enter full name"
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
                          disabled={bookingForSelf}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                            validationErrors.patientEmail ? 'border-red-500' : 'border-gray-300'
                          } ${bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
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
                          disabled={bookingForSelf}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientPhone ? 'border-red-500' : 'border-gray-300'
                          } ${bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
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
                      <div className="relative">
                        <input
                          type="number"
                          name="patientAge"
                          value={formData.patientAge}
                          onChange={handleInputChange}
                          disabled={bookingForSelf}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientAge ? 'border-red-500' : 'border-gray-300'
                          } ${bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="Enter age"
                        />
                      </div>
                      {validationErrors.patientAge && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientAge}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <div className="relative">
                        <select
                          name="patientGender"
                          value={formData.patientGender}
                          onChange={handleInputChange}
                          disabled={bookingForSelf}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.patientGender ? 'border-red-500' : 'border-gray-300'
                          } ${bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
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
                          disabled={bookingForSelf}
                          rows="2"
                          className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            bookingForSelf ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
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
                  <p className="text-gray-600">Choose your preferred doctor and appointment date</p>

                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor *
                    </label>
                    {!selectedDoctor ? (
                      <div className="space-y-4">
                        {/* Top Doctors Section */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-900">Top Rated Doctors</h3>
                            <button
                              onClick={() => setShowDoctorModal(true)}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              See All Doctors
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {topDoctors.map(doctor => (
                              <div
                                key={doctor.id}
                                onClick={() => selectDoctor(doctor)}
                                className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {doctor.name.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                      {doctor.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="text-sm font-medium">{doctor.rating}</span>
                                      </div>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-sm text-gray-600">{doctor.experience}+ years</span>
                                    </div>
                                    <p className="text-sm font-semibold text-blue-600 mt-2">${doctor.fee}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => setShowDoctorModal(true)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                          Browse All Doctors
                        </button>
                        
                        {validationErrors.doctor && (
                          <p className="mt-2 text-sm text-red-600">{validationErrors.doctor}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                              {selectedDoctor.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{selectedDoctor.name}</h3>
                              <p className="text-gray-600">{selectedDoctor.specialty}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm">{selectedDoctor.rating}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm text-gray-600">{selectedDoctor.experience}+ years</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-lg font-bold text-blue-600">${selectedDoctor.fee}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedDoctor(null)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Change Doctor
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Selection */}
                  {selectedDoctor && (
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
                  )}

                  {/* Available Time Slots - Shows only when doctor and date are selected */}
                  {selectedDoctor && formData.appointmentDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots
                      </label>
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot }))}
                              className={`
                                px-3 py-2 text-sm rounded-lg border transition-all
                                ${formData.timeSlot === slot
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                  : 'border-gray-300 text-gray-700 hover:border-blue-400'
                                }
                              `}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No available slots for this date</p>
                          <p className="text-sm text-gray-500">Please select another date</p>
                        </div>
                      )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">
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
                            flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all
                            ${formData.type === type.value
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                              : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-sm'
                            }
                          `}
                        >
                          <type.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{type.label}</span>
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
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Appointment Summary
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Patient Name</p>
                        <p className="font-medium text-gray-900">{formData.patientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-medium text-gray-900">{formData.patientPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-medium text-gray-900">{selectedDoctor?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Specialty</p>
                        <p className="font-medium text-gray-900">{selectedDoctor?.specialty}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium text-gray-900">
                          {formData.appointmentDate} at {formData.timeSlot}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Appointment Type</p>
                        <p className="font-medium text-gray-900">{formData.type.replace('_', ' ')}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Consultation Fee</p>
                        <p className="text-2xl font-bold text-blue-600">${selectedDoctor?.fee}</p>
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
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
                  <p className="text-gray-600 mb-4">
                    Your appointment has been confirmed. A confirmation email has been sent to {formData.patientEmail}
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-sm text-gray-600">
                      Appointment ID: <span className="font-mono font-semibold">{appointmentId || 'APT-0000'}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Please arrive 15 minutes before your scheduled time</p>
                  </div>

                  <div className="mt-8 max-w-md mx-auto">
                    <PayHereCheckout
                      appointmentId={appointmentId}
                      doctorId={formData.doctorId}
                      amount={selectedDoctor?.fee || 150}
                      doctorName={selectedDoctor?.name || "Dr. Wilson"}
                      patientDetails={{
                        firstName: formData.patientName.split(' ')[0] || "Patient",
                        lastName: formData.patientName.split(' ').slice(1).join(' ') || "User",
                        email: formData.patientEmail,
                        phone: formData.patientPhone,
                        address: formData.patientAddress || "Colombo",
                        city: "Colombo"
                      }}
                    />
                  </div>
                  <button
                    onClick={resetForm}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Book Another Appointment
                  </button>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && !success && (
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
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
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : currentStep === 3 && (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Selection Modal */}
      {showDoctorModal && <DoctorModal />}
    </div>
  );
};

export default BookAppointment;// Update the selectDoctor function to include the doctor's available time in the summary
