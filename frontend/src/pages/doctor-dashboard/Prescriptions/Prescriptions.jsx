import { useState } from "react";
import { Plus, Trash2, FileText, Calendar, User, Eye, ArrowLeft, Edit, X, ArrowUpDown, Search } from "lucide-react";
import PrescriptionForm from "./PrescriptionForm";

// Mock patient and medical report data
const MOCK_PATIENTS_DATA = [
  {
    id: 1,
    patientName: "Ahamed Shaba",
    patientId: "P001",
    age: 45,
    gender: "Male",
    lastVisit: "Oct 12, 2023",
    diagnosis: "Hypertension with mild fever",
    symptoms: ["High Blood Pressure", "Headache", "Mild Fever"],
    vitals: {
      bloodPressure: "150/95 mmHg",
      temperature: "98.6°F",
      heartRate: "88 bpm",
      weight: "75 kg"
    },
    allergies: ["Penicillin", "Aspirin"],
    previousMedications: ["Lisinopril 10mg", "Metoprolol 50mg"],
    medicalReportId: "MR-2023-10-12-001",
    reportTitle: "Comprehensive Medical Report",
    reportType: "general",
    reportDescription: "Comprehensive medical examination and lab results",
    fileName: "medical_report_001.pdf",
    mimeType: "application/pdf",
    fileSize: 2048000,
    uploadedDate: "Oct 12, 2023",
    prescriptionHistory: [
      {
        id: "RX-001-1",
        medications: [
          { medicationName: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "30 days", instructions: "Take in the morning" },
          { medicationName: "Aspirin", dosage: "81mg", frequency: "Once daily", duration: "30 days", instructions: "Take with food" }
        ],
        diagnosis: "Hypertension",
        notes: "Monitor blood pressure weekly",
        createdDate: "Oct 10, 2023",
        status: "Active"
      },
      {
        id: "RX-001-2",
        medications: [
          { medicationName: "Metoprolol", dosage: "50mg", frequency: "Twice daily", duration: "14 days", instructions: "Take with meals" }
        ],
        diagnosis: "Hypertension with headache",
        notes: "Follow up in 2 weeks",
        createdDate: "Sep 28, 2023",
        status: "Completed"
      }
    ]
  },
  {
    id: 2,
    patientName: "Sandeep Gamage",
    patientId: "P002",
    age: 38,
    gender: "Female",
    lastVisit: "Oct 10, 2023",
    diagnosis: "Type 2 Diabetes",
    symptoms: ["High Blood Sugar", "Fatigue"],
    vitals: {
      bloodPressure: "130/85 mmHg",
      temperature: "98.4°F",
      heartRate: "72 bpm",
      weight: "68 kg"
    },
    allergies: ["Sulfa drugs"],
    previousMedications: ["Metformin 500mg"],
    medicalReportId: "MR-2023-10-10-002",
    reportTitle: "Diabetes Management Report",
    reportType: "lab",
    reportDescription: "Blood glucose and HbA1c test results",
    fileName: "diabetes_report_002.pdf",
    mimeType: "application/pdf",
    fileSize: 1542000,
    uploadedDate: "Oct 10, 2023",
    prescriptionHistory: [
      {
        id: "RX-002-1",
        medications: [
          { medicationName: "Metformin", dosage: "500mg", frequency: "Three times daily", duration: "60 days", instructions: "Take with meals" }
        ],
        diagnosis: "Type 2 Diabetes",
        notes: "Check HbA1c levels after 3 months",
        createdDate: "Oct 05, 2023",
        status: "Active"
      }
    ]
  },
  {
    id: 3,
    patientName: "M. Rizwan",
    patientId: "P003",
    age: 52,
    gender: "Male",
    lastVisit: "Oct 08, 2023",
    diagnosis: "Cardiac Assessment",
    symptoms: ["Chest Pain", "Shortness of Breath"],
    vitals: {
      bloodPressure: "145/90 mmHg",
      temperature: "98.7°F",
      heartRate: "95 bpm",
      weight: "82 kg"
    },
    allergies: ["ACE inhibitors"],
    previousMedications: ["Aspirin 81mg", "Atorvastatin 20mg"],
    medicalReportId: "MR-2023-10-08-003",
    reportTitle: "ECG and Cardiac Report",
    reportType: "imaging",
    reportDescription: "ECG results and cardiac imaging analysis",
    fileName: "cardiac_report_003.pdf",
    mimeType: "application/pdf",
    fileSize: 3124000,
    uploadedDate: "Oct 08, 2023",
    prescriptionHistory: [
      {
        id: "RX-003-1",
        medications: [
          { medicationName: "Aspirin", dosage: "81mg", frequency: "Once daily", duration: "90 days", instructions: "Take with water" },
          { medicationName: "Atorvastatin", dosage: "20mg", frequency: "Once daily", duration: "90 days", instructions: "Take at night" }
        ],
        diagnosis: "Cardiac Assessment",
        notes: "Repeat ECG after 6 weeks",
        createdDate: "Oct 06, 2023",
        status: "Active"
      }
    ]
  }
];

export default function Prescriptions() {
  const [medications, setMedications] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [sortField, setSortField] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    diagnosis: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    notes: ""
  });

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      diagnosis: patient.diagnosis,
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      notes: ""
    });
    setMedications([]);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setFormData({
      diagnosis: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      notes: ""
    });
    setMedications([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMedicine = () => {
    if (formData.diagnosis && formData.medicationName && formData.dosage && formData.frequency && formData.duration) {
      setMedications([...medications, { ...formData, id: Date.now() }]);
      setFormData(prev => ({
        ...prev,
        medicationName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        notes: ""
      }));
    }
  };

  const handleRemoveMedicine = (id) => {
    setMedications(medications.filter(medicine => medicine.id !== id));
  };

  const handleSubmitPrescription = () => {
    if (medications.length === 0) {
      alert("Please add at least one medicine");
      return;
    }
    console.log("Prescription submitted for patient:", selectedPatient.patientName, medications);
    alert("Prescription created successfully for " + selectedPatient.patientName);
    handleBackToList();
  };

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePrescription = (prescriptionId) => {
    if (confirm("Are you sure you want to delete this prescription?")) {
      console.log("Prescription deleted:", prescriptionId);
      alert("Prescription deleted successfully");
    }
  };

  const handleCancelEdit = () => {
    setEditingPrescription(null);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortPrescriptions = (prescriptions) => {
    const sorted = [...prescriptions].sort((a, b) => {
      let compareA, compareB;

      switch (sortField) {
        case "patientName":
          compareA = a.patientName.toLowerCase();
          compareB = b.patientName.toLowerCase();
          break;
        case "diagnosis":
          compareA = a.diagnosis.toLowerCase();
          compareB = b.diagnosis.toLowerCase();
          break;
        case "status":
          compareA = a.status;
          compareB = b.status;
          break;
        case "createdDate":
        default:
          compareA = new Date(a.createdDate);
          compareB = new Date(b.createdDate);
          break;
      }

      if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
      if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const filterPrescriptions = (prescriptions) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return prescriptions;
    }

    return prescriptions.filter((prescription) => {
      const medicationText = prescription.medications
        .map((medicine) => `${medicine.medicationName} ${medicine.dosage} ${medicine.frequency} ${medicine.duration} ${medicine.instructions || ""}`)
        .join(" ")
        .toLowerCase();

      return [
        prescription.patientName,
        prescription.patientId,
        prescription.diagnosis,
        prescription.notes,
        medicationText
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  };

  // Patient List View
  if (!selectedPatient) {
    // Collect all prescriptions from all patients
    const allPrescriptions = MOCK_PATIENTS_DATA.flatMap(patient =>
      patient.prescriptionHistory.map(prescription => ({
        ...prescription,
        patientName: patient.patientName,
        patientId: patient.patientId
      }))
    );

    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-sm text-slate-600 mt-1">Select a patient to create a prescription</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Patient ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Age / Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Medical Report</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Report Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Last Visit</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_PATIENTS_DATA.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{patient.patientName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.patientId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.age} / {patient.gender}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.diagnosis}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.reportTitle}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        patient.reportType === 'general' ? 'bg-blue-100 text-blue-700' :
                        patient.reportType === 'lab' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {patient.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.lastVisit}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSelectPatient(patient)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        <FileText size={16} /> Create Prescription
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prescription History Section */}
        {allPrescriptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Prescription History</h2>
                  <p className="text-xs text-slate-500 mt-1">{allPrescriptions.length} total prescription(s)</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by patient, diagnosis, notes, or medicine"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button
                    onClick={() => handleSort("createdDate")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sortField === "createdDate"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowUpDown size={14} />
                    Date {sortField === "createdDate" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSort("patientName")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sortField === "patientName"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowUpDown size={14} />
                    Patient {sortField === "patientName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSort("diagnosis")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sortField === "diagnosis"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowUpDown size={14} />
                    Diagnosis {sortField === "diagnosis" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSort("status")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sortField === "status"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowUpDown size={14} />
                    Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterPrescriptions(sortPrescriptions(allPrescriptions)).map((prescription) => (
                <div key={prescription.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
                  {/* Card Header */}
                  <div className="mb-3">
                    <h4 className="font-bold text-slate-800 text-sm">{prescription.patientName}</h4>
                    <p className="text-xs text-slate-500">{prescription.patientId}</p>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">Diagnosis: {prescription.diagnosis}</p>
                    <p className="text-xs text-slate-500">Created: {prescription.createdDate}</p>
                    
                    {/* Medications */}
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Medications:</p>
                      <div className="space-y-1">
                        {prescription.medications.map((med, idx) => (
                          <div key={idx} className="text-xs text-slate-600">
                            • {med.medicationName} {med.dosage}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {prescription.notes && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-slate-600 font-medium">Notes:</p>
                        <p className="text-xs text-slate-700 line-clamp-2">{prescription.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const patient = MOCK_PATIENTS_DATA.find(p => p.patientId === prescription.patientId);
                        if (patient) handleSelectPatient(patient);
                        handleEditPrescription(prescription);
                      }}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                      title="Edit prescription"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePrescription(prescription.id)}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                      title="Delete prescription"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filterPrescriptions(sortPrescriptions(allPrescriptions)).length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No prescription history matches your search.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Prescription Form View
  return (
    <PrescriptionForm
      selectedPatient={selectedPatient}
      editingPrescription={editingPrescription}
      medications={medications}
      formData={formData}
      onBackToList={handleBackToList}
      onInputChange={handleInputChange}
      onAddMedicine={handleAddMedicine}
      onRemoveMedicine={handleRemoveMedicine}
      onSubmitPrescription={handleSubmitPrescription}
      onEditPrescription={handleEditPrescription}
      onDeletePrescription={handleDeletePrescription}
      onCancelEdit={handleCancelEdit}
    />
  );
}
