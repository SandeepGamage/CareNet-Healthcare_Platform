import { Plus, Trash2, FileText, Calendar, ArrowLeft, X } from "lucide-react";

export default function PrescriptionForm({
  selectedPatient,
  editingPrescription,
  medications,
  formData,
  validationErrors,
  isSubmitting,
  errorMessage,
  successMessage,
  onBackToList,
  onInputChange,
  onAddMedicine,
  onRemoveMedicine,
  onSubmitPrescription,
  onEditPrescription,
  onDeletePrescription,
  onCancelEdit,
  onValidationErrorsChange,
  onFormError,
}) {
  const validateMedicineForm = (data) => {
    const errors = {};

    if (!data.diagnosis?.trim()) {
      errors.diagnosis = "Please enter the patient diagnosis.";
    } else if (data.diagnosis.trim().length < 5) {
      errors.diagnosis = "Diagnosis should be at least 5 characters.";
    }

    if (!data.medicationName?.trim()) {
      errors.medicationName = "Medication name is required.";
    } else if (data.medicationName.trim().length < 2) {
      errors.medicationName = "Medication name must have at least 2 characters.";
    }

    if (!data.dosage?.trim()) {
      errors.dosage = "Dosage is required (example: 500mg).";
    } else if (!/^\d+(\.\d+)?\s?(mg|g|ml|mcg|units|tablet|tablets|capsule|capsules)?$/i.test(data.dosage.trim())) {
      errors.dosage = "Enter a valid dosage like 500mg or 5 ml.";
    }

    if (!data.frequency?.trim()) {
      errors.frequency = "Please select the frequency.";
    }

    if (!data.duration?.trim()) {
      errors.duration = "Duration is required (example: 7 days).";
    } else if (!/^\d+\s?(day|days|week|weeks|month|months)$/i.test(data.duration.trim())) {
      errors.duration = "Enter duration like 7 days or 2 weeks.";
    }

    if (data.instructions && data.instructions.trim().length > 300) {
      errors.instructions = "Instructions cannot exceed 300 characters.";
    }

    if (data.notes && data.notes.trim().length > 300) {
      errors.notes = "Notes cannot exceed 300 characters.";
    }

    return errors;
  };

  const handleAddMedicineWithValidation = () => {
    const errors = validateMedicineForm(formData);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0] || "Please fix the highlighted form fields before adding medicine.";
      onValidationErrorsChange?.(errors);
      onFormError?.(firstError);
      return;
    }

    onValidationErrorsChange?.({});
    onFormError?.("");
    onAddMedicine();
  };

  const handleSubmitWithValidation = () => {
    if (medications.length === 0) {
      onValidationErrorsChange?.({ form: "Add at least one medicine before submitting the prescription." });
      onFormError?.("Add at least one medicine before submitting.");
      return;
    }

    onValidationErrorsChange?.((prev) => ({ ...(prev || {}), form: "" }));
    onFormError?.("");
    onSubmitPrescription();
  };

  return (
    <div className="p-8">
      <button
        onClick={onBackToList}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to Prescriptions
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
        {/* Left Side: Prescription Form */}
        <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-blue-100/60 flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">Prescription</p>
            <h2 className="mt-1 text-lg font-bold text-slate-800">
              {editingPrescription ? "Edit Prescription for" : "Create Prescription for"} {selectedPatient.patientName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Patient ID: {selectedPatient.patientId}</p>
            {editingPrescription && (
              <button
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={14} /> Cancel Edit
              </button>
            )}
          </div>

          <div className="flex-1 p-6 space-y-6">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {validationErrors?.form && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {validationErrors.form}
              </div>
            )}

            {/* Diagnosis Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis *</label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={onInputChange}
                disabled={isSubmitting}
                placeholder="e.g., Hypertension with mild fever"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.diagnosis ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
              />
              {validationErrors?.diagnosis && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.diagnosis}</p>}
            </div>

            {/* Medicine Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Medication Name *</label>
                <input
                  type="text"
                  name="medicationName"
                  value={formData.medicationName}
                  onChange={onInputChange}
                  disabled={isSubmitting}
                  placeholder="e.g., Paracetamol"
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.medicationName ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
                />
                {validationErrors?.medicationName && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.medicationName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dosage *</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={onInputChange}
                  disabled={isSubmitting}
                  placeholder="e.g., 500mg"
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.dosage ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
                />
                {validationErrors?.dosage && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.dosage}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Frequency *</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={onInputChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.frequency ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
                >
                  <option value="">Select Frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="As needed">As needed</option>
                </select>
                {validationErrors?.frequency && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.frequency}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={onInputChange}
                  disabled={isSubmitting}
                  placeholder="e.g., 7 days"
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.duration ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
                />
                {validationErrors?.duration && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.duration}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Special Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={onInputChange}
                disabled={isSubmitting}
                placeholder="e.g., Take with food, avoid dairy products..."
                rows="3"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm resize-none disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.instructions ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
              />
              {validationErrors?.instructions && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.instructions}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={onInputChange}
                disabled={isSubmitting}
                placeholder="e.g., Patient allergic to penicillin, monitor BP regularly..."
                rows="3"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm resize-none disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.notes ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`}
              />
              {validationErrors?.notes && <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.notes}</p>}
            </div>

            <button
              onClick={handleAddMedicineWithValidation}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} /> {editingPrescription ? "Update Medicine" : "Add Medicine"}
            </button>

            {/* Added Medicines List */}
            {medications.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-800">Medicines Added ({medications.length})</h3>
                </div>

                <div className="divide-y divide-slate-200">
                  {medications.map((medicine) => (
                    <div key={medicine.id} className="p-4 hover:bg-white transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{medicine.medicationName}</h4>
                          <p className="text-xs text-slate-500 mt-1">Diagnosed: {medicine.diagnosis}</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-500 font-medium">Dosage</p>
                              <p className="text-slate-800 font-semibold">{medicine.dosage}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Frequency</p>
                              <p className="text-slate-800 font-semibold">{medicine.frequency}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Duration</p>
                              <p className="text-slate-800 font-semibold">{medicine.duration}</p>
                            </div>
                            {medicine.instructions && (
                              <div>
                                <p className="text-slate-500 font-medium">Instructions</p>
                                <p className="text-slate-800 font-semibold">{medicine.instructions}</p>
                              </div>
                            )}
                            {medicine.notes && (
                              <div className="col-span-2">
                                <p className="text-slate-500 font-medium">Notes</p>
                                <p className="text-slate-800 font-semibold">{medicine.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveMedicine(medicine.id)}
                          disabled={isSubmitting}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 px-4 py-4">
                  <button
                    onClick={handleSubmitWithValidation}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileText size={18} /> {isSubmitting ? "Saving..." : editingPrescription ? "Update Prescription" : "Submit Prescription"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Patient Info & Report */}
        <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Patient Summary</p>
            <h2 className="mt-1 text-lg font-bold text-slate-800">Patient Info & Report</h2>
          </div>

          <div className="flex-1 space-y-6 p-6">
            {/* Patient Info Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white ring-1 ring-slate-100">
              <div className="border-b border-blue-100 bg-blue-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-lg font-bold text-blue-700 ring-2 ring-blue-50">
                    {selectedPatient.patientName?.charAt(0) || "P"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-blue-400">Patient Info</p>
                    <h3 className="mt-1 truncate text-base font-bold leading-tight text-slate-800">{selectedPatient.patientName}</h3>
                    <p className="mt-1 text-xs text-slate-500">Patient ID {selectedPatient.patientId}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Age</p>
                    <p className="mt-1 font-bold text-slate-800">{selectedPatient.age} years</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Gender</p>
                    <p className="mt-1 font-bold text-slate-800">{selectedPatient.gender}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                      <Calendar size={12} />
                      Last Visit
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">{selectedPatient.lastVisit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Report Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white ring-1 ring-slate-100">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Medical Report</p>
                  <p className="text-sm font-bold text-slate-800">Report Snapshot</p>
                </div>
              </div>

              <div className="px-4 py-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Title</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-slate-800 line-clamp-2">{selectedPatient.reportTitle}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Type</p>
                      <p className="mt-1 font-bold capitalize text-slate-800">{selectedPatient.reportType}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">File Type</p>
                      <p className="mt-1 truncate font-bold text-slate-800">{selectedPatient.mimeType}</p>
                    </div>
                  </div>

                  {selectedPatient.reportDescription && (
                    <div className="rounded-2xl bg-amber-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Description</p>
                      <p className="mt-1 text-sm font-medium leading-snug text-slate-700 line-clamp-3">{selectedPatient.reportDescription}</p>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Uploaded File Preview</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedPatient.fileName || selectedPatient.reportTitle}</p>
                      </div>
                      <div className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {selectedPatient.mimeType || "File"}
                      </div>
                    </div>

                    <div className="bg-white p-3">
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                          <FileText size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{selectedPatient.fileName || "Uploaded report file"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {selectedPatient.mimeType || "Unknown type"}
                            {selectedPatient.fileSize ? ` • ${(selectedPatient.fileSize / 1024).toFixed(2)} KB` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
