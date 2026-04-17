import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pill, Stethoscope } from "lucide-react";

export default function PrescriptionsTab() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const patientServiceBase = useMemo(
        () => import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3002",
        []
    );

    useEffect(() => {
        const fetchPrescriptions = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage("Please login to view prescriptions.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setMessage("");

            try {
                const response = await fetch(`${patientServiceBase}/api/patients/me/prescriptions`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setPrescriptions([]);
                    setMessage(payload?.message || "Failed to fetch prescriptions.");
                    return;
                }

                const list = Array.isArray(payload?.data) ? payload.data : [];
                setPrescriptions(list);

                if (list.length === 0) {
                    setMessage("No prescriptions found.");
                }
            } catch {
                setPrescriptions([]);
                setMessage("Patient service unavailable. Could not fetch prescriptions.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [patientServiceBase]);

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
            <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">My Prescriptions</h2>
                <p className="mt-1 text-sm text-slate-600">Fetched using getMyPrescriptions endpoint</p>
            </div>

            <div className="p-6">
                {loading ? (
                    <p className="text-sm text-slate-600">Loading prescriptions...</p>
                ) : prescriptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="mb-2 text-4xl">💊</p>
                        <p className="text-sm text-slate-600">{message || "No prescriptions available."}</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {prescriptions.map((item, index) => {
                            const id = item._id || item.prescriptionId || item.id || `rx-${index}`;
                            const medicine =
                                item.medicineName || item.medicine || item.drugName || item.medication || "Medication";
                            const dosage = item.dosage || item.dose || "Not specified";
                            const frequency = item.frequency || item.instructions || "Not specified";
                            const prescribedBy =
                                item.doctorName || item.prescribedBy || item.providerName || "Not specified";
                            const issuedAt = item.createdAt || item.updatedAt || item.date;

                            return (
                                <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">{medicine}</p>
                                            <p className="mt-1 text-xs text-slate-500">Prescription ID: {id}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            <Pill size={14} />
                                            Active Record
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                                        <p className="inline-flex items-center gap-2">
                                            <Stethoscope size={15} className="text-slate-500" />
                                            <span>
                                                <span className="font-semibold">Prescribed By:</span> {prescribedBy}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="font-semibold">Dosage:</span> {dosage}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Frequency:</span> {frequency}
                                        </p>
                                        <p className="inline-flex items-center gap-2">
                                            <CalendarDays size={15} className="text-slate-500" />
                                            <span>
                                                <span className="font-semibold">Issued:</span>{" "}
                                                {issuedAt ? new Date(issuedAt).toLocaleString() : "Not available"}
                                            </span>
                                        </p>
                                    </div>

                                    {item.notes && (
                                        <p className="mt-3 text-sm text-slate-700">
                                            <span className="font-semibold">Notes:</span> {item.notes}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
