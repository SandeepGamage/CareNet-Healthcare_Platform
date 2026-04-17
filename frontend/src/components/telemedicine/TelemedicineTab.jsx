import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleCheck, Clock3, ExternalLink, Loader2, PhoneOff, Video } from "lucide-react";

const TELEMEDICINE_TYPE = "TELEMEDICINE";
const TELEMEDICINE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const canJoinTelemedicine = (appointment) => {
    const type = String(appointment?.type || "").toUpperCase();
    const status = String(appointment?.status || "").toUpperCase();
    const allowedStatuses = ["CONFIRMED", "PENDING"];

    return type === TELEMEDICINE_TYPE && allowedStatuses.includes(status);
};

const formatDateTime = (appointmentDate, timeSlot) => {
    if (!appointmentDate) {
        return timeSlot || "Time not available";
    }

    const dateText = new Date(appointmentDate).toLocaleDateString();
    return `${dateText}${timeSlot ? ` • ${timeSlot}` : ""}`;
};

export default function TelemedicineTab({ role = "patient" }) {
    const [appointments, setAppointments] = useState([]);
    const [sessionStatusByAppointmentId, setSessionStatusByAppointmentId] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("PENDING");
    const [joiningAppointmentId, setJoiningAppointmentId] = useState("");
    const [embeddedRoomUrl, setEmbeddedRoomUrl] = useState("");
    const [embeddedAppointmentId, setEmbeddedAppointmentId] = useState("");
    const [endingSession, setEndingSession] = useState(false);

    const apiBase = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
        []
    );

    const fetchAppointments = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to access telemedicine sessions.");
            setLoading(false);
            return;
        }

        const endpoint = role === "doctor" ? "/appointments/doctor" : "/appointments/my";

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${apiBase}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const payload = await response.json().catch(() => ([]));
            if (!response.ok) {
                setAppointments([]);
                setMessage(payload?.message || "Failed to load appointments.");
                return;
            }

            const items = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.appointments)
                ? payload.appointments
                : [];

            setAppointments(items);

            const sessionsResponse = await fetch(`${apiBase}/telemedicine/sessions/my`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const sessionsPayload = await sessionsResponse.json().catch(() => ({}));
            if (sessionsResponse.ok && Array.isArray(sessionsPayload?.data)) {
                const statusMap = sessionsPayload.data.reduce((acc, session) => {
                    if (session?.appointmentId) {
                        acc[String(session.appointmentId)] = String(session.status || "SCHEDULED").toUpperCase();
                    }
                    return acc;
                }, {});
                setSessionStatusByAppointmentId(statusMap);
            } else {
                setSessionStatusByAppointmentId({});
            }
        } catch {
            setAppointments([]);
            setSessionStatusByAppointmentId({});
            setMessage("Unable to reach services. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [apiBase, role]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const telemedicineAppointments = useMemo(
        () => appointments.filter((appointment) => String(appointment?.type || "").toUpperCase() === TELEMEDICINE_TYPE),
        [appointments]
    );

    const visibleTelemedicineAppointments = useMemo(() => {
        const normalizedRole = String(role || "").toLowerCase();
        if (!["patient", "doctor"].includes(normalizedRole)) {
            return telemedicineAppointments;
        }

        return telemedicineAppointments.filter(
            (appointment) => String(appointment?.status || "").toUpperCase() === selectedStatus
        );
    }, [telemedicineAppointments, role, selectedStatus]);

    const handleJoin = async (appointmentId, mode = "embed") => {
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to join telemedicine sessions.");
            return;
        }

        setJoiningAppointmentId(appointmentId);
        setMessage("");

        try {
            const normalizedRole = String(role || "").toLowerCase();

            // Session creation is doctor/admin-only. Patients join existing sessions.
            if (["doctor", "admin"].includes(normalizedRole)) {
                const ensureSessionResponse = await fetch(`${apiBase}/telemedicine/sessions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ appointmentId }),
                });

                if (!ensureSessionResponse.ok) {
                    const payload = await ensureSessionResponse.json().catch(() => ({}));
                    throw new Error(payload?.message || "Failed to prepare telemedicine session.");
                }
            }

            const joinResponse = await fetch(
                `${apiBase}/telemedicine/sessions/appointment/${appointmentId}/join`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const joinPayload = await joinResponse.json().catch(() => ({}));
            if (!joinResponse.ok) {
                if (joinResponse.status === 404 && normalizedRole === "patient") {
                    throw new Error("Session has not started yet. Please wait for the doctor to start the call.");
                }
                throw new Error(joinPayload?.message || "Failed to join telemedicine session.");
            }

            const roomUrl = joinPayload?.data?.roomUrl;
            const jwt = joinPayload?.data?.jwt;

            if (!roomUrl) {
                throw new Error("Room URL was not returned from telemedicine service.");
            }

            const finalUrl = jwt
                ? `${roomUrl}${roomUrl.includes("?") ? "&" : "?"}jwt=${encodeURIComponent(jwt)}`
                : roomUrl;

            if (mode === "new-tab") {
                window.open(finalUrl, "_blank", "noopener,noreferrer");
                setMessage("Telemedicine session opened in a new tab.");
            } else {
                setEmbeddedRoomUrl(finalUrl);
                setEmbeddedAppointmentId(String(appointmentId));
                setMessage("Telemedicine session started in embedded mode.");
            }
        } catch (error) {
            setMessage(error.message || "Could not open telemedicine session.");
        } finally {
            setJoiningAppointmentId("");
        }
    };

    const handleEndSession = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to end telemedicine sessions.");
            return;
        }

        if (!embeddedAppointmentId) {
            setMessage("No active embedded session found.");
            return;
        }

        setEndingSession(true);

        try {
            const response = await fetch(
                `${apiBase}/telemedicine/sessions/appointment/${embeddedAppointmentId}/end`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.message || "Failed to end session.");
            }

            setEmbeddedRoomUrl("");
            setEmbeddedAppointmentId("");
            setMessage("Telemedicine session ended successfully.");
            await fetchAppointments();
        } catch (error) {
            setMessage(error.message || "Could not end telemedicine session.");
        } finally {
            setEndingSession(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
            <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Telemedicine Sessions</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Appointment-based secure video calls powered by Jitsi as a Service (JaaS)
                </p>
            </div>

            <div className="p-6">
                {embeddedRoomUrl && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-slate-50">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-700">
                                Live Session • Appointment {embeddedAppointmentId}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.open(embeddedRoomUrl, "_blank", "noopener,noreferrer")}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    <ExternalLink size={14} />
                                    Open in New Tab
                                </button>

                                {role === "doctor" ? (
                                    <button
                                        type="button"
                                        onClick={handleEndSession}
                                        disabled={endingSession}
                                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                                    >
                                        {endingSession ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} />}
                                        {endingSession ? "Ending..." : "End Session"}
                                    </button>
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        The doctor controls session ending.
                                    </p>
                                )}
                            </div>
                        </div>

                        <iframe
                            title="CareNet Telemedicine Session"
                            src={embeddedRoomUrl}
                            className="h-[70vh] w-full border-0"
                            allow="camera; microphone; fullscreen; display-capture"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}

                {!loading && ["patient", "doctor"].includes(String(role || "").toLowerCase()) && telemedicineAppointments.length > 0 && (
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        {TELEMEDICINE_STATUSES.map((status) => {
                            const active = selectedStatus === status;
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setSelectedStatus(status)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                        active
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    {status}
                                </button>
                            );
                        })}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 size={16} className="animate-spin" />
                        Loading appointments...
                    </div>
                ) : visibleTelemedicineAppointments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="mb-2 text-4xl">📹</p>
                        <p className="text-sm text-slate-600">
                            {message || (["patient", "doctor"].includes(String(role || "").toLowerCase())
                                ? `No ${selectedStatus.toLowerCase()} telemedicine appointments found.`
                                : "No telemedicine appointments found yet.")}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {visibleTelemedicineAppointments.map((appointment) => {
                            const appointmentId = appointment._id || appointment.id;
                            const canJoin = canJoinTelemedicine(appointment);
                            const joining = joiningAppointmentId === appointmentId;
                            const sessionStatus = sessionStatusByAppointmentId[String(appointmentId)] || "NOT_CREATED";

                            return (
                                <div
                                    key={appointmentId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">
                                                {role === "doctor"
                                                    ? appointment.patientName || "Patient"
                                                    : appointment.doctorName || "Doctor"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Appointment ID: {appointmentId}
                                            </p>
                                        </div>

                                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            <Video size={14} />
                                            {appointment.type || TELEMEDICINE_TYPE}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                        <p className="inline-flex items-center gap-2">
                                            <CalendarDays size={15} className="text-slate-500" />
                                            {formatDateTime(appointment.appointmentDate, appointment.timeSlot)}
                                        </p>
                                        <p className="inline-flex items-center gap-2">
                                            <Clock3 size={15} className="text-slate-500" />
                                            Status: {appointment.status || "Unknown"}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Telemedicine Session: {sessionStatus}
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            disabled={!canJoin || joining}
                                            onClick={() => handleJoin(appointmentId, "embed")}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {joining ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
                                            {joining ? "Joining..." : "Join In Page"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!canJoin || joining}
                                            onClick={() => handleJoin(appointmentId, "new-tab")}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <ExternalLink size={15} />
                                            Open in New Tab
                                        </button>

                                        {!canJoin && (
                                            <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                                                <CircleCheck size={14} />
                                                Available only for confirmed or pending TELEMEDICINE appointments.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && message && visibleTelemedicineAppointments.length > 0 && (
                    <p className="mt-4 text-sm text-slate-600">{message}</p>
                )}
            </div>
        </div>
    );
}
