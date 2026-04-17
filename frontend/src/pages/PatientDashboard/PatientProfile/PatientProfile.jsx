import { useEffect, useMemo, useState } from "react";
import { CalendarDays, HeartPulse, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import UpdatePatientProfile from "./UpdatePatientProfile";

const FALLBACK_PROFILE = {
    name: "Patient",
    email: "Not available",
    phone: "Not available",
    address: "Not available",
    dateOfBirth: "Not available",
    gender: "Not available",
    bloodGroup: "Not available",
    emergencyContact: "Not available",
    allergies: "None recorded",
    chronicConditions: "None recorded",
};

function getStoredUserProfile() {
    const stored = localStorage.getItem("user");
    if (!stored) {
        return {};
    }

    try {
        return JSON.parse(stored);
    } catch {
        return {};
    }
}

export default function PatientProfile() {
    const [profile, setProfile] = useState(() => ({
        ...FALLBACK_PROFILE,
        ...getStoredUserProfile(),
    }));
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setStatusMessage("Using locally stored profile details.");
                setLoading(false);
                return;
            }

            try {
                const patientServiceBase = import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:3002";
                const response = await fetch(`${patientServiceBase}/api/patients/me/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Could not fetch patient profile");
                }

                const data = await response.json();
                const patient = data?.data || {};

                const emergencyContact =
                    patient.emergencyContactName || patient.emergencyContactPhone
                        ? `${patient.emergencyContactName || ""}${
                              patient.emergencyContactName && patient.emergencyContactPhone ? " - " : ""
                          }${patient.emergencyContactPhone || ""}`
                        : "Not available";

                setProfile((prev) => ({
                    ...prev,
                    address: patient.address || prev.address,
                    dateOfBirth: patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toLocaleDateString()
                        : prev.dateOfBirth,
                    gender: patient.gender || prev.gender,
                    bloodGroup: patient.bloodGroup || prev.bloodGroup,
                    emergencyContact,
                    allergies: Array.isArray(patient.allergies)
                        ? patient.allergies.join(", ") || prev.allergies
                        : prev.allergies,
                    chronicConditions: Array.isArray(patient.chronicConditions)
                        ? patient.chronicConditions.join(", ") || prev.chronicConditions
                        : prev.chronicConditions,
                    profilePicture: patient.profileImage || prev.profilePicture,
                }));

                setStatusMessage("Profile synced from patient service.");
            } catch {
                setStatusMessage("Patient service unavailable. Showing locally stored profile details.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [refreshKey]);

    const initials = useMemo(() => {
        const name = profile.name || "Patient";
        const parts = name.trim().split(" ").filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }, [profile.name]);

    if (isEditing) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-8">
                <UpdatePatientProfile
                    embedded
                    onCancel={() => {
                        setIsEditing(false);
                    }}
                    onSaved={() => {
                        setIsEditing(false);
                        setRefreshKey((prev) => prev + 1);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="relative">
                <div className="h-48 rounded-b-2xl shadow-lg" style={{ backgroundColor: "#87CEFA" }} />

                <div className="absolute -bottom-16 left-8 z-10">
                    <div className="h-40 w-40 rounded-full border-4 border-white bg-linear-to-br from-blue-400 to-blue-600 shadow-lg">
                        {profile.profilePicture ? (
                            <img src={profile.profilePicture} alt="Patient profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <span className="text-5xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-8 pb-8 pt-24">
                <div className="mb-8">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{profile.name || "Patient"}</h1>
                            <p className="mt-1 text-lg font-semibold text-blue-600">Patient Profile</p>
                            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                <ShieldCheck size={14} />
                                Logged-in account details
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(true);
                            }}
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-6">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={16} />
                            <span className="text-sm">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={16} />
                            <span className="text-sm">{profile.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <MapPin size={16} />
                            <span className="text-sm">{profile.address}</span>
                        </div>
                    </div>

                    {/* {statusMessage && (
                        <p className="text-sm text-slate-600">{loading ? "Loading profile..." : statusMessage}</p>
                    )} */}
                </div>

                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date of Birth</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
                            <CalendarDays size={16} />
                            {profile.dateOfBirth}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
                            <UserRound size={16} />
                            {profile.gender}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Group</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
                            <HeartPulse size={16} />
                            {profile.bloodGroup}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                    <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                        <h2 className="text-lg font-bold text-slate-800">Health & Emergency Details</h2>
                        {/* <p className="mt-1 text-sm text-slate-600">Information currently associated with your logged-in account</p> */}
                    </div>
                    <div className="grid gap-6 p-6 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency Contact</p>
                            <p className="mt-2 text-base font-semibold text-slate-800">{profile.emergencyContact}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allergies</p>
                            <p className="mt-2 text-base font-semibold text-slate-800">{profile.allergies}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chronic Conditions</p>
                            <p className="mt-2 text-base font-semibold text-slate-800">{profile.chronicConditions}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
