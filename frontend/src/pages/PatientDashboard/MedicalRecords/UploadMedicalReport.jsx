import { useState } from "react";
import { FileUp, Upload } from "lucide-react";

const INITIAL_FORM = {
    title: "",
    reportType: "general",
    description: "",
};

export default function UploadMedicalReport({ embedded = false, onUploaded }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [reportFile, setReportFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setReportFile(file);
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setReportFile(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to upload medical reports.");
            return;
        }

        if (!formData.title.trim()) {
            setMessage("Report title is required.");
            return;
        }

        if (!reportFile) {
            setMessage("Please choose a report file to upload.");
            return;
        }

        setUploading(true);
        setMessage("");

        const payload = new FormData();
        payload.append("title", formData.title.trim());
        payload.append("reportType", formData.reportType);
        payload.append("description", formData.description.trim());
        payload.append("report", reportFile);

        try {
            const patientServiceBase = import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3002";
            const response = await fetch(`${patientServiceBase}/api/patients/me/reports`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(result?.message || "Failed to upload medical report.");
                return;
            }

            setMessage("Medical report uploaded successfully.");
            resetForm();

            if (onUploaded) {
                onUploaded(result?.data || null);
            }
        } catch {
            setMessage("Patient service unavailable. Try again later.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={embedded ? "bg-transparent" : "min-h-screen bg-slate-50 p-6 md:p-8"}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                    <h1 className="text-xl font-bold text-slate-800">Upload Medical Report</h1>
                    <p className="mt-1 text-sm text-slate-600">Submit your report to patient-service records</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                            Report Title
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Blood Test - March 2026"
                                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-700">
                            Report Type
                            <select
                                name="reportType"
                                value={formData.reportType}
                                onChange={handleChange}
                                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="general">General</option>
                                <option value="lab">Lab</option>
                                <option value="scan">Scan</option>
                                <option value="prescription">Prescription</option>
                                <option value="discharge">Discharge</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-700">
                            Report File
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileChange}
                                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                            Description
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Optional notes about this report"
                                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                            {uploading ? <Upload size={16} className="animate-pulse" /> : <FileUp size={16} />}
                            {uploading ? "Uploading..." : "Upload Report"}
                        </button>
                    </div>

                    {message && <p className="text-sm text-slate-600">{message}</p>}
                </form>
            </div>
        </div>
    );
}
