import { useEffect, useMemo, useState } from "react";
import { PencilLine, Save } from "lucide-react";

export default function EditMedicalReport({ report, onCancel, onSaved }) {
    const [formData, setFormData] = useState({
        title: "",
        reportType: "general",
        description: "",
    });
    const [newFile, setNewFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const patientServiceBase = useMemo(
        () => import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3002",
        []
    );

    useEffect(() => {
        if (!report) {
            return;
        }

        setFormData({
            title: report.title || "",
            reportType: report.reportType || "general",
            description: report.description || "",
        });
        setNewFile(null);
        setMessage("");
    }, [report]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to edit reports.");
            return;
        }

        if (!formData.title.trim()) {
            setMessage("Report title is required.");
            return;
        }

        setSaving(true);
        setMessage("");

        const payload = new FormData();
        payload.append("title", formData.title.trim());
        payload.append("reportType", formData.reportType);
        payload.append("description", formData.description.trim());
        if (newFile) {
            payload.append("report", newFile);
        }

        try {
            const reportId = report?.medicalReportId || report?._id;
            const response = await fetch(`${patientServiceBase}/api/patients/me/reports/${reportId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(result?.message || "Failed to update report.");
                return;
            }

            setMessage("Report updated successfully.");
            if (onSaved) {
                onSaved(result?.data || null);
            }
        } catch {
            setMessage("Patient service unavailable. Could not update report.");
        } finally {
            setSaving(false);
        }
    };

    if (!report) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-md">
            <div className="border-b border-amber-100 bg-linear-to-r from-amber-50 to-orange-50 px-6 py-4">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-800">
                    <PencilLine size={18} />
                    Edit Medical Report
                </h2>
                <p className="mt-1 text-sm text-slate-600">Update report details and optionally replace the file</p>
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
                        Replace File (optional)
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(event) => {
                                setNewFile(event.target.files?.[0] || null);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                        Description
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                </div>

                {message && <p className="text-sm text-slate-600">{message}</p>}
            </form>
        </div>
    );
}
