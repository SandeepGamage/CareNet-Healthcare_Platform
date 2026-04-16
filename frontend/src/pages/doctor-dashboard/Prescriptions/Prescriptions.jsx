import { useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import PrescriptionForm from "./PrescriptionForm";

export default function Prescriptions() {
    // Prescription history state 
  const [historySearch, setHistorySearch] = useState("");
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  // Sorting state (must be inside component)
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // Fetch prescriptions for the logged-in doctor only (doctorId from localStorage)
  const fetchPrescriptions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setPrescriptionHistory([]);
      return;
    }
    try {
      const response = await fetch(`${PRESCRIPTIONS_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPrescriptionHistory([]);
        return;
      }
      // Accepts either .data or .prescriptions as array
      const rawList = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.prescriptions)
        ? data.prescriptions
        : [];
      // Map backend fields to frontend display format
      const list = rawList.map((item) => ({
        id: item._id,
        patient: item.patientId || item.patient || "Unknown Patient",
        patientReportId: item.patientReportId || item.patientReport || null,
        title: item.reportTitle || item.title || null,
        reportType: item.reportType || null,
        fileName: item.fileName || item.reportFileName || null,
        fileUrl: item.fileUrl || item.reportFileUrl || null,
        mimeType: item.mimeType || item.fileType || null,
        fileSize: item.fileSize || null,
        description: item.reportDescription || item.description || null,
        diagnosis: item.diagnosis,
        medications: [
          {
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            notes: item.notes,
          },
        ],
        createdAt: item.createdAt,
      }));
      setPrescriptionHistory(list);
      return list;
    } catch {
      setPrescriptionHistory([]);
      return [];
    }
  };

  // Delete prescription handler (scoped inside component)
  const handleDeletePrescription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${PRESCRIPTIONS_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data?.message || 'Failed to delete prescription.');
        return;
      }
      await fetchPrescriptions();
    } catch {
      alert('Network error. Could not delete prescription.');
    }
  };

  // Edit prescription: open form with prescription data and report details
  const handleEditPrescription = async (prescription) => {
    setEditingPrescription(prescription);
    const token = localStorage.getItem("token");

    // Build a minimal selectedPatient that PrescriptionForm expects
    let patientObj = {
      patientUserId: prescription.patient,
      medicalReportId: prescription.patientReportId || null,
      title: prescription.title || null,
      reportType: prescription.reportType || null,
      fileName: prescription.fileName || null,
      fileUrl: prescription.fileUrl || null,
      mimeType: prescription.mimeType || null,
      fileSize: prescription.fileSize || null,
      description: prescription.description || null,
    };

    // If we have a report id, try to fetch the full report details from patient service
    if (patientObj.medicalReportId && token) {
      try {
        // Patient service does not expose a direct GET by report id for doctors.
        // Fetch the patient's reports and find the matching report by id.
        const resp = await fetch(`${PATIENT_API_BASE}/patients/${patientObj.patientUserId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await resp.json().catch(() => ({}));
        const reports = Array.isArray(body?.data) ? body.data : Array.isArray(body?.reports) ? body.reports : (Array.isArray(body) ? body : []);
        const report = reports.find(r => (r._id === patientObj.medicalReportId || r.medicalReportId === patientObj.medicalReportId || r.id === patientObj.medicalReportId));
        if (report) {
          patientObj = {
            patientUserId: prescription.patient,
            medicalReportId: report._id || report.medicalReportId || patientObj.medicalReportId,
            title: report.title || patientObj.title,
            reportType: report.reportType || patientObj.reportType,
            fileName: report.fileName || report.reportFileName || patientObj.fileName,
            fileUrl: report.fileUrl || report.reportFileUrl || patientObj.fileUrl,
            mimeType: report.mimeType || report.fileType || patientObj.mimeType,
            fileSize: report.fileSize || patientObj.fileSize,
            description: report.description || report.reportDescription || patientObj.description,
          };
        }
      } catch (e) {
        // ignore fetch errors — we'll still open form with minimal data
      }
    }

    setSelectedPatient(patientObj);

    // Prefill medications and form fields
    const meds = (prescription.medications && prescription.medications.length)
      ? prescription.medications.map((m, i) => ({ id: Date.now() + i, ...m }))
      : [
          {
            id: Date.now(),
            medicationName: prescription.medicationName || "",
            dosage: prescription.dosage || "",
            frequency: prescription.frequency || "",
            duration: prescription.duration || "",
            instructions: prescription.instructions || "",
            notes: prescription.notes || "",
          },
        ];

    setMedications(meds);
    setFormData({
      diagnosis: prescription.diagnosis || "",
      medicationName: meds[0]?.medicationName || "",
      dosage: meds[0]?.dosage || "",
      frequency: meds[0]?.frequency || "",
      duration: meds[0]?.duration || "",
      instructions: meds[0]?.instructions || "",
      notes: meds[0]?.notes || "",
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

  const getSortedReports = (data) => {
    return [...data].sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case "medicalReportId":
          valA = a.medicalReportId || "";
          valB = b.medicalReportId || "";
          break;
        case "title":
          valA = a.title?.toLowerCase() || "";
          valB = b.title?.toLowerCase() || "";
          break;
        case "reportType":
          valA = a.reportType?.toLowerCase() || "";
          valB = b.reportType?.toLowerCase() || "";
          break;
        case "createdAt":
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          valA = a[sortField] || "";
          valB = b[sortField] || "";
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortField !== columnKey) return <ArrowUpDown size={14} className="opacity-30 inline ml-1" />;
    return <ArrowUpDown size={14} className={sortDirection === "asc" ? "opacity-100 inline ml-1" : "opacity-50 rotate-180 inline ml-1"} />;
  };
  // ...existing code...

  // Use environment variables for API base URLs
  const DOCTOR_API_BASE = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3003/api").replace(/\/$/, "");
  const PATIENT_API_BASE = (import.meta.env.VITE_PATIENT_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3006/api").replace(/\/$/, "");
  const API_BASE_URL = DOCTOR_API_BASE; // legacy reference used elsewhere
  const PRESCRIPTIONS_ENDPOINT = `${DOCTOR_API_BASE}/doctors/prescriptions`;


  // Patient reports state
  const [patientReports, setPatientReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch reports and prescriptions together, then hide reports that already have prescriptions
  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/patients/reports/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return [];
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.reports)
        ? payload.reports
        : [];
      return list;
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const [presList, reportsList] = await Promise.all([fetchPrescriptions(), fetchReports()]);
        // fetchPrescriptions already set prescriptionHistory; presList is the mapped list returned
        const existingReportIds = new Set((presList || []).map(p => p.patientReportId).filter(Boolean));
        const filtered = (reportsList || []).filter(r => {
          const ids = [r._id, r.medicalReportId, r.id].filter(Boolean);
          return !ids.some(i => existingReportIds.has(i));
        });
        setPatientReports(filtered);
        if (filtered.length === 0) setMessage("No patient reports found.");
      } catch (e) {
        setPatientReports([]);
        setMessage("Patient service unavailable. Could not fetch reports.");
      } finally {
        setLoading(false);
      }
    };
    load();
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
        onSubmitPrescription={async () => {
          setSubmitLoading(true);
          setErrorMessage("");
          setSuccessMessage("");
            try {
              console.log("[Prescriptions] creating prescription, selectedPatient:", selectedPatient);
              // Prefer medication fields from medications[0] if present (doctors add medicines)
              const firstMed = (medications && medications.length > 0) ? medications[0] : null;
              const payload = {
                patientId: selectedPatient.patientUserId,
                patientReportId: selectedPatient.medicalReportId,
                diagnosis: formData.diagnosis,
                medicationName: firstMed?.medicationName || formData.medicationName || "",
                dosage: firstMed?.dosage || formData.dosage || "",
                frequency: firstMed?.frequency || formData.frequency || "",
                duration: firstMed?.duration || formData.duration || "",
                instructions: firstMed?.instructions || formData.instructions || "",
                notes: firstMed?.notes || formData.notes || "",
              };
              console.log("[Prescriptions] payload about to send:", payload);
            const token = localStorage.getItem("token");

            if (editingPrescription && editingPrescription.id) {
              // Update existing prescription
              const response = await fetch(`${PRESCRIPTIONS_ENDPOINT}/${editingPrescription.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) {
                setErrorMessage(data?.message || "Failed to update prescription.");
                setSubmitLoading(false);
                return;
              }
              setSuccessMessage("Prescription updated successfully.");
            } else {
              // Create new prescription
              const response = await fetch(PRESCRIPTIONS_ENDPOINT, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              });
              let data = null;
              let textBody = null;
              try {
                data = await response.json();
              } catch (err) {
                try { textBody = await response.text(); } catch (e) { textBody = null; }
              }
              console.log("[Prescriptions] create response:", { ok: response.ok, status: response.status, data, textBody });
              if (!response.ok) {
                const message = (data && data.message) ? data.message : (textBody || `Failed to create prescription (status ${response.status})`);
                setErrorMessage(message);
                setSubmitLoading(false);
                return;
              }
              setSuccessMessage("Prescription created successfully.");
              // Remove the associated report from the reports table so it no longer appears.
              try {
                // Use backend-created object if available — it may store a different id field.
                const createdObj = data && (data.data || data.prescription || data.created || data) ? (data.data || data.prescription || data.created || data) : null;
                console.log('[Prescriptions] created object from response:', createdObj);
                const candidateIds = [
                  payload.patientReportId,
                  selectedPatient?.medicalReportId,
                  createdObj?.patientReportId,
                  createdObj?.patientReport,
                  createdObj?._id,
                  createdObj?.medicalReportId,
                  createdObj?.reportId,
                ].filter(Boolean);
                console.log('[Prescriptions] candidate ids for removal:', candidateIds);
                if (candidateIds.length > 0) {
                  setPatientReports(prev => prev.filter(r => {
                    const ids = [r._id, r.medicalReportId, r.id].filter(Boolean);
                    return !ids.some(i => candidateIds.includes(i));
                  }));
                  // also log optimistic new array
                  try {
                    const optimistic = patientReports.filter(r => {
                      const ids = [r._id, r.medicalReportId, r.id].filter(Boolean);
                      return !ids.some(i => candidateIds.includes(i));
                    });
                    console.log("[Prescriptions] patientReports optimistic after removal:", optimistic);
                  } catch (e) {}
                }
              } catch (e) {
                // ignore UI update errors
              }
            }
            // Refetch all prescriptions after creation/update
            await fetchPrescriptions();
            setSelectedPatient(null);
            setMedications([]);
            setFormData({ diagnosis: "", medicationName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
            setEditingPrescription(null);
          } catch (err) {
            setErrorMessage("Network error. Could not save prescription.");
          } finally {
            setSubmitLoading(false);
          }
        }}
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
            <table className="w-full min-w-[900px] rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-blue-50 border border-blue-100">
              <thead className="bg-gradient-to-r from-white to-slate-50">
                <tr>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase cursor-pointer select-none"
                    onClick={() => handleSort("medicalReportId")}
                  >
                    Report ID <SortIcon columnKey="medicalReportId" />
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase cursor-pointer select-none"
                    onClick={() => handleSort("title")}
                  >
                    Title <SortIcon columnKey="title" />
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase cursor-pointer select-none"
                    onClick={() => handleSort("reportType")}
                  >
                    Type <SortIcon columnKey="reportType" />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase">Description</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase" style={{minWidth: '120px', maxWidth: '180px'}}>File </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    Uploaded At <SortIcon columnKey="createdAt" />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 tracking-wide uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {getSortedReports(patientReports).map((report, idx) => (
                  <tr
                    key={report.medicalReportId || report._id || idx}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100`}
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">{report.medicalReportId || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-800 whitespace-nowrap">{report.title || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{report.reportType || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{report.description || "-"}</td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                      {report.mimeType && report.mimeType.startsWith("image") && report.fileUrl ? (
                        <a href={report.fileUrl} target="_blank" rel="noreferrer">
                          <img src={report.fileUrl} alt={report.fileName || 'preview'} className="w-20 h-12 rounded-md object-cover border border-slate-100 shadow-sm" />
                        </a>
                      ) : report.mimeType === 'application/pdf' && report.fileUrl ? (
                        <div className="w-20 h-12 rounded-md border border-slate-100 shadow-sm overflow-hidden">
                          <object
                            data={report.fileUrl}
                            type="application/pdf"
                            aria-label={report.fileName || 'PDF preview'}
                            style={{
                              width: '200%',
                              height: '200%',
                              transform: 'scale(0.5)',
                              transformOrigin: 'top left',
                              border: 'none',
                              display: 'block'
                            }}
                          >
                            <a href={report.fileUrl} target="_blank" rel="noreferrer" title={report.fileName || 'PDF file'} className="inline-flex items-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 text-xs font-semibold rounded border border-slate-200">PDF</span>
                            </a>
                          </object>
                        </div>
                      ) : (
                        <a href={report.fileUrl || '#'} target="_blank" rel="noreferrer" className="text-blue-600 underline" style={{maxWidth: '220px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {report.fileName || '-'}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{report.createdAt ? new Date(report.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-5 py-4 text-sm">
                      <button
                        className="bg-blue-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full shadow-sm font-medium transition-all"
                        onClick={() => {
                          // Clear edit state and reset form so this opens as a create form
                          setEditingPrescription(null);
                          setMedications([]);
                          setFormData({ diagnosis: "", medicationName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
                          setValidationErrors({});
                          setErrorMessage("");
                          setSuccessMessage("");
                          setSelectedPatient(report);
                        }}
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

      {/* Prescription History Section */}
      <div className="mt-12">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-0">Prescription History</h2>
          </div>
          <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                placeholder="Search by patient or diagnosis..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full sm:max-w-xs px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            {prescriptionHistory.length === 0 ? (
              <div className="text-slate-400 italic text-center py-8">No prescriptions created yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prescriptionHistory
                  .filter(item => {
                    const q = historySearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (item.patient?.toLowerCase().includes(q)) ||
                      (item.diagnosis?.toLowerCase().includes(q))
                    );
                  })
                  .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 border-l-4 border-blue-400 rounded-3xl p-8 flex flex-col gap-4 transition-transform duration-200 hover:scale-[1.025]"
                  >
                    <div className="flex-1 flex flex-col">
                      <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-semibold uppercase tracking-[0.22em] rounded-full px-3 py-1 mb-2 shadow-sm mx-auto text-center">Medical Prescription</span>
                      <div className="mb-1 text-xs text-gray-500 font-medium">
                        Patient id - {item.patient}
                      </div>
                      <div className="mb-1 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-slate-700">Diagnosis:</span> <span className="text-slate-600">{item.diagnosis || "-"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Medications:</span>
                        {item.medications.length === 0 ? (
                          <span className="text-slate-400 ml-2">None</span>
                        ) : (
                          <ul className="list-disc ml-6 mt-1">
                            {item.medications.map((med, idx) => (
                              <li key={med.id || idx} className="text-slate-600 text-sm">
                                {med.medicationName} ({med.dosage}, {med.frequency}, {med.duration})
                                {med.instructions && <span className="ml-2 italic text-xs text-slate-400">{med.instructions}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 mt-auto">
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        onClick={() => handleEditPrescription(item)}
                      >
                        Update
                      </button>
                      <button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        onClick={() => handleDeletePrescription(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
