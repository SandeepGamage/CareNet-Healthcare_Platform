import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, FileText, Edit, ArrowUpDown, Search } from "lucide-react";
import PrescriptionForm from "./PrescriptionForm";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const DOCTOR_API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || API_BASE_URL).replace(/\/$/, "");
const PRESCRIPTIONS_ENDPOINT = `${DOCTOR_API_BASE_URL}/doctors/prescriptions`;
const PATIENTS_ENDPOINT = `${API_BASE_URL}/patients`;
const APPOINTMENTS_ENDPOINT = `${API_BASE_URL}/appointments`;

const MOCK_APPOINTMENTS = [
  { patientId: "P001" },
  { patientId: "P002" },
  { patientId: "P003" },
];

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

const getMockPatientsWithAppointments = () => {
  const appointmentPatientIds = new Set(
    MOCK_APPOINTMENTS.map((appointment) => String(appointment.patientId || "").trim().toUpperCase()).filter(Boolean)
  );

  return MOCK_PATIENTS_DATA.filter((patient) =>
    appointmentPatientIds.has(String(patient.patientId || "").trim().toUpperCase())
  );
};

const getMockPatientsWithAppointmentsAndReports = () =>
  getMockPatientsWithAppointments().filter((patient) => Boolean(patient.medicalReportId));

export default function Prescriptions() {
  const [medications, setMedications] = useState([]);
  const [patientsData, setPatientsData] = useState(getMockPatientsWithAppointmentsAndReports());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sortField, setSortField] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    diagnosis: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    notes: ""
  });

  const getAuthToken = () => localStorage.getItem("token");

  const getRequestConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const formatPrescription = (prescription) => {
    const matchedPatient = patientsData.find((patient) => patient.patientId === prescription.patientId);
    const createdAt = prescription.createdAt || prescription.updatedAt || new Date().toISOString();

    return {
      id: prescription._id,
      patientName: matchedPatient?.patientName || `Patient ${prescription.patientId}`,
      patientId: prescription.patientId,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes || "",
      status: "Active",
      createdDate: new Date(createdAt).toLocaleDateString(),
      createdTimestamp: createdAt,
      medications: [
        {
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          instructions: prescription.instructions || "",
          notes: prescription.notes || "",
        },
      ],
      patientReportId: prescription.patientReportId,
    };
  };

  const fetchAllPrescriptions = async () => {
    const token = getAuthToken();
    if (!token) {
      setErrorMessage("Login token not found. Please login again.");
      return;
    }

    try {
      setHistoryLoading(true);
      const response = await axios.get(PRESCRIPTIONS_ENDPOINT, getRequestConfig());
      const prescriptions = Array.isArray(response.data?.data) ? response.data.data : [];
      setAllPrescriptions(prescriptions.map(formatPrescription));
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load prescription history";
      setErrorMessage(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const mapAppointmentPatients = (appointments = []) => {
    const unique = new Map();

    appointments.forEach((appointment) => {
      const patientUserId = String(appointment.patientId || "").trim();
      if (!patientUserId) {
        return;
      }

      if (!unique.has(patientUserId)) {
        unique.set(patientUserId, {
          id: patientUserId,
          patientUserId,
          patientId: patientUserId,
          patientName: appointment.patientName || `Patient ${patientUserId.slice(-6)}`,
          age: "N/A",
          gender: "N/A",
          lastVisit: appointment.appointmentDate
            ? new Date(appointment.appointmentDate).toLocaleDateString()
            : "N/A",
          diagnosis: appointment.reason || "General consultation",
          symptoms: [],
          vitals: {},
          allergies: [],
          previousMedications: [],
          medicalReportId: "",
          reportTitle: "No report loaded",
          reportType: "general",
          reportDescription: "",
          fileName: "",
          mimeType: "",
          fileSize: null,
          uploadedDate: "N/A",
          prescriptionHistory: [],
        });
      }
    });

    return [...unique.values()];
  };

  const fetchLatestPatientReport = async (patientUserId) => {
    if (!patientUserId) {
      return null;
    }

    const response = await axios.get(`${PATIENTS_ENDPOINT}/${patientUserId}/reports`, getRequestConfig());
    const reports = Array.isArray(response.data?.data) ? response.data.data : [];
    return reports[0] || null;
  };

  const attachLatestReportsToPatients = async (patients = []) => {
    const hydratedPatients = await Promise.all(
      patients.map(async (patient) => {
        try {
          const report = await fetchLatestPatientReport(patient.patientUserId || patient.patientId);
          if (!report) {
            return null;
          }

          return {
            ...patient,
            medicalReportId: report.medicalReportId,
            reportTitle: report.title,
            reportType: report.reportType || "general",
            reportDescription: report.description || "",
            fileName: report.fileName || "",
            mimeType: report.mimeType || "",
            fileSize: report.fileSize || null,
            uploadedDate: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A",
            reportUrl: report.fileUrl || "",
          };
        } catch (_error) {
          return null;
        }
      }),
    );

    return hydratedPatients.filter(Boolean);
  };

  const fetchDoctorPatients = async () => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(`${APPOINTMENTS_ENDPOINT}/doctor`, getRequestConfig());
      const appointments = Array.isArray(response.data) ? response.data : [];
      const mappedPatients = mapAppointmentPatients(appointments);
      const patientsWithReports = await attachLatestReportsToPatients(mappedPatients);

      if (patientsWithReports.length > 0) {
        setPatientsData(patientsWithReports);
        setErrorMessage("");
      } else {
        setPatientsData([]);
        setErrorMessage("No appointment patients with medical reports were found.");
      }
    } catch (_error) {
      setPatientsData(getMockPatientsWithAppointmentsAndReports());
      setErrorMessage("Could not load appointment patients from backend. Showing mock appointment patients.");
    }
  };

  useEffect(() => {
    fetchDoctorPatients();
    fetchAllPrescriptions();
  }, []);

  const handleSelectPatient = async (patient) => {
    let hydratedPatient = patient;

    try {
      const report = await fetchLatestPatientReport(patient.patientUserId || patient.patientId);
      if (report) {
        hydratedPatient = {
          ...patient,
          medicalReportId: report.medicalReportId,
          reportTitle: report.title,
          reportType: report.reportType || "general",
          reportDescription: report.description || "",
          fileName: report.fileName || "",
          mimeType: report.mimeType || "",
          fileSize: report.fileSize || null,
          uploadedDate: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A",
          reportUrl: report.fileUrl || "",
        };
      }
    } catch (_error) {
      setErrorMessage("Could not load latest patient report from backend.");
    }

    setEditingPrescription(null);
    setErrorMessage("");
    setSuccessMessage("");
    setValidationErrors({});
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
    setSelectedPatient(hydratedPatient);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setEditingPrescription(null);
    setValidationErrors({});
    setErrorMessage("");
    setSuccessMessage("");
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
    setValidationErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMedicine = () => {
    setValidationErrors({});
    setErrorMessage("");
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
  };

  const handleRemoveMedicine = (id) => {
    setMedications(medications.filter(medicine => medicine.id !== id));
  };

  const handleSubmitPrescription = () => {
    const submit = async () => {
      if (!selectedPatient?.patientId) {
        alert("Patient ID is missing");
        return;
      }

      const patientReportId = selectedPatient.medicalReportId || selectedPatient.patientReportId;
      if (!patientReportId) {
        alert("Patient report ID is missing");
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert("Login token not found. Please login again.");
        return;
      }

      try {
        setSubmitLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        if (editingPrescription) {
          const firstMedicine = medications[0];
          await axios.put(
            `${PRESCRIPTIONS_ENDPOINT}/${editingPrescription.id}`,
            {
              patientReportId,
              diagnosis: firstMedicine.diagnosis,
              medicationName: firstMedicine.medicationName,
              dosage: firstMedicine.dosage,
              frequency: firstMedicine.frequency,
              duration: firstMedicine.duration,
              instructions: firstMedicine.instructions || "",
              notes: firstMedicine.notes || "",
            },
            getRequestConfig(),
          );
          setSuccessMessage("Prescription updated successfully");
        } else {
          await Promise.all(
            medications.map((medicine) =>
              axios.post(
                PRESCRIPTIONS_ENDPOINT,
                {
                  patientId: selectedPatient.patientId,
                  patientReportId,
                  diagnosis: medicine.diagnosis,
                  medicationName: medicine.medicationName,
                  dosage: medicine.dosage,
                  frequency: medicine.frequency,
                  duration: medicine.duration,
                  instructions: medicine.instructions || "",
                  notes: medicine.notes || "",
                },
                getRequestConfig(),
              ),
            ),
          );
          setSuccessMessage(`Prescription created successfully for ${selectedPatient.patientName}`);
        }

        await fetchAllPrescriptions();
        handleBackToList();
      } catch (error) {
        const message = error.response?.data?.message || "Failed to submit prescription";
        setErrorMessage(message);
        alert(message);
      } finally {
        setSubmitLoading(false);
      }
    };

    submit();
  };

  const handleEditPrescription = (prescription) => {
    const matchedPatient =
      patientsData.find((patient) => patient.patientId === prescription.patientId) ||
      {
        patientName: prescription.patientName,
        patientId: prescription.patientId,
        diagnosis: prescription.diagnosis,
        medicalReportId: prescription.patientReportId || "",
        age: "N/A",
        gender: "N/A",
        lastVisit: "N/A",
        reportTitle: "Patient Report",
        reportType: "general",
        reportDescription: "",
        fileName: "",
        mimeType: "",
      };

    setSelectedPatient(matchedPatient);
    setEditingPrescription(prescription);
    const firstMedicine = prescription.medications?.[0];

    if (firstMedicine) {
      setFormData({
        diagnosis: prescription.diagnosis || firstMedicine.diagnosis || "",
        medicationName: firstMedicine.medicationName || "",
        dosage: firstMedicine.dosage || "",
        frequency: firstMedicine.frequency || "",
        duration: firstMedicine.duration || "",
        instructions: firstMedicine.instructions || "",
        notes: firstMedicine.notes || prescription.notes || "",
      });

      setMedications([
        {
          ...firstMedicine,
          diagnosis: prescription.diagnosis || firstMedicine.diagnosis || "",
          id: Date.now(),
        },
      ]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm("Are you sure you want to delete this prescription?")) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert("Login token not found. Please login again.");
      return;
    }

    try {
      await axios.delete(`${PRESCRIPTIONS_ENDPOINT}/${prescriptionId}`, getRequestConfig());
      setSuccessMessage("Prescription deleted successfully");
      setAllPrescriptions((prev) => prev.filter((prescription) => prescription.id !== prescriptionId));
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete prescription";
      setErrorMessage(message);
      alert(message);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrescription(null);
    setMedications([]);
    setValidationErrors({});
    setFormData({
      diagnosis: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      notes: "",
    });
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
          compareA = new Date(a.createdTimestamp || a.createdDate);
          compareB = new Date(b.createdTimestamp || b.createdDate);
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
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-sm text-slate-600 mt-1">Select a patient to create a prescription</p>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          {successMessage && <p className="mt-2 text-sm text-emerald-600">{successMessage}</p>}
          {submitLoading && <p className="mt-2 text-sm text-blue-600">Submitting prescription...</p>}
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
                {patientsData.map((patient) => (
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
                {patientsData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                      No patients with appointments and medical reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prescription History Section */}
        {(historyLoading || allPrescriptions.length > 0) && (
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
              {historyLoading && (
                <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Loading prescription history...
                </div>
              )}
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
                        const patient = patientsData.find(p => p.patientId === prescription.patientId);
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
    <div className="space-y-4">
      {(validationErrors?.form || errorMessage) && (
        <div className="mx-8 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationErrors?.form || errorMessage}
        </div>
      )}

      <PrescriptionForm
        selectedPatient={selectedPatient}
        editingPrescription={editingPrescription}
        medications={medications}
        formData={formData}
        validationErrors={validationErrors}
        isSubmitting={submitLoading}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onBackToList={handleBackToList}
        onInputChange={handleInputChange}
        onAddMedicine={handleAddMedicine}
        onRemoveMedicine={handleRemoveMedicine}
        onSubmitPrescription={handleSubmitPrescription}
        onEditPrescription={handleEditPrescription}
        onDeletePrescription={handleDeletePrescription}
        onCancelEdit={handleCancelEdit}
        onValidationErrorsChange={setValidationErrors}
        onFormError={setErrorMessage}
      />
    </div>
  );
}
