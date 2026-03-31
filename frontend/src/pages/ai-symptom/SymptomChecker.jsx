import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Heart,
  Loader,
  Microscope,
  Phone,
  Search,
  Shield,
  Star,
  Stethoscope,
  TrendingUp,
  User,
  Users,
  Video,
  X,
  Zap
} from 'lucide-react';
import axios from 'axios';

const SYMPTOM_SERVICE_URL ='http://localhost:3000';

const urgencyConfig = {
  emergency: {
    label: "EMERGENCY",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    icon: AlertCircle,
    message: "Please call emergency services or go to the nearest ER immediately.",
    action: "Call Emergency Services"
  },
  within_48h: {
    label: "URGENT - Within 48 Hours",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    icon: Clock,
    message: "Your symptoms need attention soon. Book an appointment today.",
    action: "Book Urgent Appointment"
  },
  routine: {
    label: "Routine Care",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#6ee7b7",
    icon: Shield,
    message: "Your symptoms appear non-urgent. Schedule a routine appointment.",
    action: "Book Appointment"
  },
};

const likelihoodConfig = {
  high: { color: "#dc2626", bg: "#fef2f2", label: "High Probability" },
  moderate: { color: "#d97706", bg: "#fffbeb", label: "Moderate Probability" },
  low: { color: "#6b7280", bg: "#f3f4f6", label: "Low Probability" }
};

export default function SymptomChecker({ onBookAppointment }) {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followUp, setFollowUp] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [commonSymptoms, setCommonSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonSymptomsList = [
    "Headache", "Fever", "Cough", "Fatigue", "Nausea", 
    "Dizziness", "Chest pain", "Shortness of breath", 
    "Sore throat", "Muscle pain", "Abdominal pain", "Rash"
  ];

  const handleSymptomSelect = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
    }
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    setSymptoms(symptoms.replace(symptom, '').replace(/,,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, ''));
  };

  const handleCheck = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 5) {
      setError("Please describe your symptoms in more detail (minimum 5 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await axios.post(
        `${SYMPTOM_SERVICE_URL}/api/symptoms/check`,
        { 
          symptoms, 
          age: age || null, 
          gender: gender || null,
          duration: duration || null,
          severity
        }
      );
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to analyze symptoms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms("");
    setAge("");
    setGender("");
    setDuration("");
    setSeverity(5);
    setError(null);
    setFollowUp(false);
    setSelectedSymptoms([]);
  };

  const urgency = result?.data?.urgency ? urgencyConfig[result.data.urgency] : null;
  const isEmergency = result?.emergency || result?.data?.urgency === 'emergency';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 shadow-lg mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Symptom Checker</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced AI-powered preliminary assessment. Get insights about your symptoms 
            and receive recommendations for next steps.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress/Info Bar */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">AI Powered Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Instant Results</span>
              </div>
            </div>
          </div>

          {/* Input Form */}
          {!result && (
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="0"
                      max="120"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender (Optional)
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Symptom Duration (Optional)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Select duration</option>
                      <option value="Less than 24 hours">Less than 24 hours</option>
                      <option value="1-3 days">1-3 days</option>
                      <option value="4-7 days">4-7 days</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="More than 2 weeks">More than 2 weeks</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Severity Level (1-10)
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={severity}
                      onChange={(e) => setSeverity(parseInt(e.target.value))}
                      className="w-full pl-10 pr-4 py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Symptoms */}
              <div className="mb-6">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mb-3"
                >
                  <Zap className="w-4 h-4" />
                  <span>Common Symptoms</span>
                  {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {commonSymptomsList.map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => handleSymptomSelect(symptom)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-700 rounded-full text-sm transition-colors"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Symptoms Tags */}
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSymptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm"
                    >
                      {symptom}
                      <button onClick={() => removeSymptom(symptom)} className="hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Symptoms Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Describe Your Symptoms *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    placeholder="e.g., I've been experiencing a persistent headache for 3 days, accompanied by mild fever and sensitivity to light..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    Be as detailed as possible for better accuracy
                  </span>
                  <span className="text-xs text-gray-500">{symptoms.length}/1000</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600 flex-1">{error}</p>
                  <button onClick={() => setError(null)} className="text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing Symptoms...
                  </>
                ) : (
                  <>
                    <Microscope className="w-5 h-5" />
                    Analyze Symptoms
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Medical Disclaimer</p>
                    <p className="text-xs text-blue-800">
                      This tool provides preliminary suggestions based on AI analysis and is NOT a medical diagnosis. 
                      Always consult with a qualified healthcare professional for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="p-8">
              {/* Emergency Alert */}
              {isEmergency && (
                <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-800">🚨 EMERGENCY</h3>
                      <p className="text-red-700 mt-1">
                        Please call emergency services immediately or go to the nearest emergency room!
                      </p>
                      <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Call Emergency Services
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Urgency Banner */}
              {urgency && !isEmergency && (
                <div className="mb-6 p-6 rounded-2xl" style={{ background: urgency.bg, border: `1px solid ${urgency.border}` }}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full" style={{ background: urgency.color + '20' }}>
                      {React.createElement(urgency.icon, { className: "w-6 h-6", style: { color: urgency.color } })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: urgency.color }}>{urgency.label}</h3>
                      <p className="text-gray-700 mt-1">{urgency.message}</p>
                      {onBookAppointment && (
                        <button
                          onClick={() => onBookAppointment(result.data.recommendedSpecialty)}
                          className="mt-3 px-4 py-2 rounded-lg text-white font-medium transition-all"
                          style={{ background: urgency.color }}
                        >
                          {urgency.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Specialty */}
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Recommended Specialty</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{result.data.recommendedSpecialty}</h3>
                    <p className="text-gray-600 mt-2">Based on your symptoms, we recommend consulting with this specialist.</p>
                    {onBookAppointment && (
                      <button
                        onClick={() => onBookAppointment(result.data.recommendedSpecialty)}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        Book {result.data.recommendedSpecialty} Appointment
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Possible Conditions */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Possible Conditions</h4>
                </div>
                <div className="space-y-3">
                  {result.data.possibleConditions.map((condition, i) => {
                    const likelihood = likelihoodConfig[condition.likelihood];
                    return (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900">{condition.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">{condition.reason}</p>
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: likelihood.bg, color: likelihood.color }}
                          >
                            {likelihood.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Questions */}
              {result.data.followUpQuestions?.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setFollowUp(!followUp)}
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">Questions to Discuss with Your Doctor</span>
                    {followUp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {followUp && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-xl">
                      <ul className="space-y-2">
                        {result.data.followUpQuestions.map((question, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Tips */}
              <div className="mb-6">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
                >
                  <Heart className="w-4 h-4" />
                  <span>Health Tips & Recommendations</span>
                  {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTips && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>Stay hydrated and get adequate rest</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>Monitor your symptoms and track any changes</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>Avoid self-medication without professional advice</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>Keep a record of your symptoms for the doctor</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Medical Disclaimer</p>
                    <p className="text-xs text-gray-600 mt-1">{result.data.disclaimer}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Check Another Symptom
                </button>
                {onBookAppointment && (
                  <button
                    onClick={() => onBookAppointment(result.data.recommendedSpecialty)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-gray-600">Advanced algorithms analyze your symptoms for accurate preliminary assessment</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your health data is encrypted and protected with HIPAA compliance</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Results</h3>
            <p className="text-sm text-gray-600">Get immediate insights and recommendations for next steps</p>
          </div>
        </div>
      </div>
    </div>
  );
}