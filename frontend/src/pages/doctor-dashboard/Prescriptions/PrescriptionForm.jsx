import { Plus, Trash2, FileText, Calendar, ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import ConfirmationDialog from "../../../components/confirmationDialog";

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
  onEditMedicineClick,
  onSaveMedicine,
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

  void onAddMedicine;
  void onRemoveMedicine;

  const handleCreatePrescriptionWithValidation = () => {
    const errors = validateMedicineForm(formData);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0] || "Please fix the highlighted form fields before submitting.";
      onValidationErrorsChange?.(errors);
      onFormError?.(firstError);
      return;
    }
    onValidationErrorsChange?.({});
    onFormError?.("");
    if (editingPrescription) {
      onEditPrescription?.();
    } else {
      onSubmitPrescription();
    }
  };

  const handleSubmitWithValidation = () => {
    if (meds.length === 0) {
      onValidationErrorsChange?.({ form: "Add at least one medicine before submitting the prescription." });
      onFormError?.("Add at least one medicine before submitting.");
      return;
    }

    onValidationErrorsChange?.((prev) => ({ ...(prev || {}), form: "" }));
    onFormError?.("");
    onSubmitPrescription();
  };

  void handleSubmitWithValidation;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const patient = selectedPatient || {};
  const meds = Array.isArray(medications) ? medications : [];

  return (
    <>
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
                {editingPrescription ? "Edit Prescription" : "Create Prescription"}
              </h2>
              <div className="text-sm text-gray-500 font-medium">
                Patient id - {selectedPatient.patientUserId}
              </div>
              {editingPrescription && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={onCancelEdit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={14} /> Cancel Edit
                  </button>

                  <button
                    onClick={() => {
                      setPendingAction("delete");
                      setConfirmVisible(true);
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
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
                type="button"
                onClick={() => {
                  const errors = validateMedicineForm(formData);
                  if (Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0] || "Please fix the highlighted form fields before adding.";
                    onValidationErrorsChange?.(errors);
                    onFormError?.(firstError);
                    return;
                  }
                  // If an edit is in progress, call save; otherwise add new medicine
                  if (typeof onSaveMedicine === "function" && formData._editingMedicineId) {
                    onSaveMedicine?.();
                  } else {
                    onAddMedicine?.();
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} /> {formData._editingMedicineId ? "Save Medicine" : "Add Medicine"}
              </button>
            </div>
            <ConfirmationDialog
              isOpen={confirmVisible}
              onClose={() => {
                setConfirmVisible(false);
                setPendingAction(null);
              }}
              onConfirm={() => {
                if (pendingAction === "create" || pendingAction === "update") {
                  if (meds.length > 0) {
                    handleSubmitWithValidation();
                  } else {
                    handleCreatePrescriptionWithValidation();
                  }
                } else if (pendingAction === "delete") {
                  onDeletePrescription?.();
                }
                setConfirmVisible(false);
                setPendingAction(null);
              }}
              title={pendingAction === "delete" ? "Confirm Delete" : editingPrescription ? "Confirm Update" : "Confirm Create"}
              description={pendingAction === "delete" ? "Delete this prescription? This action cannot be undone." : editingPrescription ? "Update this prescription?" : "Create prescription?"}
              confirmText={pendingAction === "delete" ? "Delete" : (editingPrescription ? "Update" : "Create")}
              cancelText="Cancel"
              type={pendingAction === "delete" ? "danger" : "primary"}
            />
          </div>

          {/* Right Side: Patient Info & Report */}
          <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Medical Summary</p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">Medical Report Details</h2>
            </div>

            <div className="flex-1 space-y-6 p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Title</p>
                  <p className="mt-1 text-sm font-bold leading-snug text-slate-800 line-clamp-2">{selectedPatient.title || selectedPatient.reportTitle || "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Type</p>
                    <p className="mt-1 font-bold capitalize text-slate-800">{selectedPatient.reportType || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">File Type</p>
                    <p className="mt-1 truncate font-bold text-slate-800">{selectedPatient.mimeType || selectedPatient.fileType || "-"}</p>
                  </div>
                </div>

                {(selectedPatient.description || selectedPatient.reportDescription) && (
                  <div className="rounded-2xl bg-amber-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Description</p>
                    <p className="mt-1 text-sm font-medium leading-snug text-slate-700 line-clamp-3">{selectedPatient.description || selectedPatient.reportDescription}</p>
                  </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Uploaded File Preview</p>
                    </div>
                    <div className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {selectedPatient.mimeType || selectedPatient.fileType || "File"}
                    </div>
                  </div>

                  <div className="bg-white p-3">
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-slate-800">{selectedPatient.fileName || selectedPatient.title || selectedPatient.reportTitle || "Uploaded report file"}</p>
                        <p className="mt-1 text-[13px] text-slate-500">
                          {selectedPatient.mimeType || selectedPatient.fileType || "Unknown type"}
                          {selectedPatient.fileSize ? ` • ${(selectedPatient.fileSize / 1024).toFixed(2)} KB` : ""}
                        </p>
                        {selectedPatient.fileUrl && (
                          <button
                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            onClick={() => window.open(selectedPatient.fileUrl, "_blank")}
                            type="button"
                          >
                            View File
                          </button>
                        )}
                        <div className="mt-4 flex items-center justify-center h-56 w-full">
                          {selectedPatient.fileUrl && selectedPatient.mimeType?.startsWith("image/") ? (
                            <img
                              src={selectedPatient.fileUrl}
                              alt="Report Preview"
                              className="h-full w-full object-contain rounded-xl bg-white"
                            />
                          ) : selectedPatient.fileUrl && selectedPatient.mimeType === "application/pdf" ? (
                            <iframe
                              src={selectedPatient.fileUrl}
                              title="PDF Preview"
                              className="h-full w-full rounded-xl bg-white"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                              <FileText size={80} />
                            </div>
                          )}
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

      {/* Added Medicines Section moved below form and medical report sections */}
      <div className="mt-8 mb-8 mx-4 md:mx-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Added Medicines</p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">{meds.length} total</p>
              <button
                type="button"
                onClick={() => {
                  setPendingAction(editingPrescription ? "update" : "create");
                  setConfirmVisible(true);
                }}
                disabled={isSubmitting}
                aria-label={editingPrescription ? "Update Prescription" : "Create Prescription"}
                className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 text-sm font-bold shadow-lg ring-1 ring-blue-200 transition-transform transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText size={16} /> {editingPrescription ? "Update Prescription" : "Create Prescription"}
              </button>
            </div>
          </div>
          {meds.length === 0 ? (
            <p className="text-slate-400">No medicines added yet.</p>
          ) : (
            <ul className="space-y-2">
              {meds.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="font-semibold text-sm">{m.medicationName || m.name || "Medicine"}</p>
                    <p className="text-xs text-slate-500">{m.dosage || ""} • {m.frequency || ""} • {m.duration || ""}</p>
                    {m.instructions && <p className="text-xs text-slate-400 mt-1">{m.instructions}</p>}
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={() => onEditMedicineClick?.(m.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 mr-2"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMedicine?.(m.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}