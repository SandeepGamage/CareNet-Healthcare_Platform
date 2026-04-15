import { useState, useEffect } from "react";
import PrescriptionForm from "./PrescriptionForm";

export default function Prescriptions() {

  // Use environment variable for API base URL (like PrescriptionsTab)
  const API_BASE_URL = import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3003";


  // Patient reports state
  const [patientReports, setPatientReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login to view patient reports.");
        setPatientReports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        // Doctor: fetch all medical reports
        const response = await fetch(`${API_BASE_URL}/api/patients/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setPatientReports([]);
          setMessage(payload?.message || "Failed to fetch patient reports.");
          return;
        }

        // Accepts either .data or .reports as array
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.reports)
          ? payload.reports
          : [];
        setPatientReports(list);
        if (list.length === 0) {
          setMessage("No patient reports found.");
        }
      } catch {
        setPatientReports([]);
        setMessage("Patient service unavailable. Could not fetch reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [API_BASE_URL]);


  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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

  // Show PrescriptionForm if a patient is selected
  if (selectedPatient) {
    return (
      <PrescriptionForm
        selectedPatient={selectedPatient}
        editingPrescription={editingPrescription}
        medications={medications}
        formData={formData}
        validationErrors={validationErrors}
        isSubmitting={submitLoading}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onBackToList={() => setSelectedPatient(null)}
        onInputChange={e => {
          const { name, value } = e.target;
          setValidationErrors((prev) => ({ ...prev, [name]: "", form: "" }));
          setFormData(prev => ({ ...prev, [name]: value }));
        }}
        onAddMedicine={() => {
          setValidationErrors({});
          setErrorMessage("");
          setMedications([...medications, { ...formData, id: Date.now() }]);
          setFormData(prev => ({ ...prev, medicationName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" }));
        }}
        onRemoveMedicine={id => setMedications(medications.filter(medicine => medicine.id !== id))}
        onSubmitPrescription={() => {}}
        onEditPrescription={() => {}}
        onDeletePrescription={() => {}}
        onCancelEdit={() => {
          setEditingPrescription(null);
          setMedications([]);
          setValidationErrors({});
          setFormData({ diagnosis: "", medicationName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
        }}
        onValidationErrorsChange={setValidationErrors}
        onFormError={setErrorMessage}
      />
    );
  }

  // Patient Reports Table View (API data)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Patient Reports</h1>
      <p className="text-sm text-slate-600 mb-6">Review and manage all patient reports below</p>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Requested Reports</h2>
              <p className="text-xs text-slate-500 mt-1">{patientReports.length} total report(s)</p>
            </div>

          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading reports...</div>
          ) : patientReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">{message || "No patient reports found."}</div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">PATIENT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">DATE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">TIME</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">TYPE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">TITLE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">FILE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientReports.map((report, idx) => (
                  <tr key={report.id || report._id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{report.patientName || report.patient_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.uploadedDate || report.uploaded_date || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.uploadedTime || report.uploaded_time || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.type || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.title || "-"}</td>
                    <td className="px-6 py-4 text-sm text-blue-700 underline cursor-pointer">{report.fileName || report.file_name || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        report.status === 'Reviewed' ? 'bg-green-100 text-green-700' :
                        report.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {report.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        onClick={() => setSelectedPatient(report)}
                      >
                        Create Prescription
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
