import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OtpVerification from './pages/OtpVerification'
import AdminDashboard from './pages/admin-dashboard/AdminDashboard'
import PatientDashboard from './pages/PatientDashboard/PatientDashboard'
import DoctorDashboard from './pages/doctor-dashboard/DoctorDashboard'
import BookAppointment from './pages/appointment/BookAppointment'
import MyAppointments from './pages/appointment/AppointmentsViewAsPatient'
import Symptom from './pages/ai-symptom/SymptomChecker'
import PaymentSuccess from './pages/payment/PaymentSuccess'
import PaymentCancel from './pages/payment/PaymentCancel'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/ai-symptom" element={<Symptom />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
