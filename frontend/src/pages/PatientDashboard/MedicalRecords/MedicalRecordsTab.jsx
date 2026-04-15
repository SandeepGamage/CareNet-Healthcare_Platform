import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, PencilLine, Trash2 } from "lucide-react";
import EditMedicalReport from "./EditMedicalReport";
import UploadMedicalReport from "./UploadMedicalReport";

export default function MedicalRecordsTab() {
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [listMessage, setListMessage] = useState("");
    const [deletingReportId, setDeletingReportId] = useState(null);
    const [pendingDeleteReportId, setPendingDeleteReportId] = useState(null);
    const [editingReport, setEditingReport] = useState(null);

    const patientServiceBase = useMemo(
        () => import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3002",
        []
    );

    const fetchReports = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setListMessage("Please login to view medical reports.");
            setLoadingReports(false);
            return;
        }

        setLoadingReports(true);
        setListMessage("");

        try {
            const response = await fetch(`${patientServiceBase}/api/patients/me/reports`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setListMessage(payload?.message || "Failed to fetch medical reports.");
                setReports([]);
                return;
            }

            setReports(Array.isArray(payload?.data) ? payload.data : []);
        } catch {
            setListMessage("Patient service unavailable. Could not fetch medical reports.");
            setReports([]);
        } finally {
            setLoadingReports(false);
        }
    }, [patientServiceBase]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const confirmDeleteReport = (reportId) => {
        if (deletingReportId) {
            return;
        }
        setPendingDeleteReportId(reportId);
    };

    const handleDeleteReport = async (reportId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setListMessage("Please login to delete medical reports.");
            return;
        }

        setDeletingReportId(reportId);

        try {
            const response = await fetch(`${patientServiceBase}/api/patients/me/reports/${reportId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setListMessage(payload?.message || "Failed to delete medical report.");
                return;
            }

            setListMessage("Medical report deleted successfully.");
            await fetchReports();
        } catch {
            setListMessage("Patient service unavailable. Could not delete medical report.");
        } finally {
            setDeletingReportId(null);
            setPendingDeleteReportId(null);
        }
    };

    const pendingDeleteReport = reports.find(
        (report) => (report.medicalReportId || report._id) === pendingDeleteReportId
    );

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) {
            return "";
        }
        if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
            return fileUrl;
        }

        return `${patientServiceBase}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
    };

    return (
        <div className="space-y-6">
            <UploadMedicalReport embedded onUploaded={fetchReports} />

            <EditMedicalReport
                report={editingReport}
                onCancel={() => {
                    setEditingReport(null);
                }}
                onSaved={async () => {
                    setEditingReport(null);
                    await fetchReports();
                    setListMessage("Medical report updated successfully.");
                }}
            />

            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">My Medical Reports</h2>
                    <p className="mt-1 text-sm text-slate-600">Reports fetched from patient-service</p>
                </div>

                <div className="p-6">
                    {loadingReports ? (
                        <p className="text-sm text-slate-600">Loading reports...</p>
                    ) : reports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <p className="mb-2 text-4xl">📄</p>
                            <p className="text-sm text-slate-600">
                                {listMessage || "No medical reports found. Upload your first report above."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {reports.map((report) => (
                                <div
                                    key={report._id || report.medicalReportId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">{report.title || "Untitled report"}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {report.reportType || "general"} • {report.medicalReportId || report._id}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {report.fileUrl && (
                                                <a
                                                    href={getFileUrl(report.fileUrl)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    <FileText size={14} />
                                                    Open File
                                                </a>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingReport(report);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                            >
                                                <PencilLine size={14} />
                                                Edit Report
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => confirmDeleteReport(report.medicalReportId || report._id)}
                                                disabled={deletingReportId === (report.medicalReportId || report._id)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                            >
                                                <Trash2 size={14} />
                                                {deletingReportId === (report.medicalReportId || report._id)
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                        <p>
                                            <span className="font-semibold">Uploaded:</span>{" "}
                                            {report.createdAt ? new Date(report.createdAt).toLocaleString() : "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-semibold">File:</span> {report.fileName || "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Type:</span> {report.mimeType || "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Size:</span>{" "}
                                            {typeof report.fileSize === "number"
                                                ? `${(report.fileSize / 1024).toFixed(1)} KB`
                                                : "N/A"}
                                        </p>
                                    </div>

                                    {report.description && (
                                        <p className="mt-3 text-sm text-slate-700">
                                            <span className="font-semibold">Description:</span> {report.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {pendingDeleteReportId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800">Delete Medical Report?</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            This action cannot be undone.
                            {pendingDeleteReport?.title ? ` Report: ${pendingDeleteReport.title}` : ""}
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingDeleteReportId(null)}
                                disabled={Boolean(deletingReportId)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteReport(pendingDeleteReportId)}
                                disabled={Boolean(deletingReportId)}
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                                {Boolean(deletingReportId) ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
