import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const INITIAL_FORM = {
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
    profileImage: "",
    allergies: "",
    chronicConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
};

export default function UpdatePatientProfile({ embedded = false, onCancel, onSaved }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage("Please login to update your profile.");
                setLoading(false);
                return;
            }

            try {
                const patientServiceBase = import.meta.env.VITE_API_BASE_URL;
                const authBase = import.meta.env.VITE_API_BASE_URL;

                const [patientRes, authRes] = await Promise.allSettled([
                    fetch(`${patientServiceBase}/patients/me/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${authBase}/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                let profile = {};
                if (patientRes.status === "fulfilled" && patientRes.value.ok) {
                    const payload = await patientRes.value.json();
                    profile = payload?.data || {};
                } else if (patientRes.status === "fulfilled" && !patientRes.value.ok) {
                    setMessage("Profile not found yet. Fill details and save to create your record.");
                }

                let authUser = {};
                if (authRes.status === "fulfilled" && authRes.value.ok) {
                    const authPayload = await authRes.value.json();
                    authUser = authPayload?.user || {};
                }

                const storedUser = (() => {
                    try {
                        return JSON.parse(localStorage.getItem("user") || "{}");
                    } catch {
                        return {};
                    }
                })();

                setFormData({
                    name: authUser.name || storedUser.name || "",
                    phone: authUser.phone || storedUser.phone || "",
                    dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
                    gender: profile.gender || "",
                    address: profile.address || "",
                    bloodGroup: profile.bloodGroup || "",
                    profileImage: profile.profileImage || authUser.profileImage || storedUser.profilePicture || "",
                    allergies: Array.isArray(profile.allergies) ? profile.allergies.join(", ") : "",
                    chronicConditions: Array.isArray(profile.chronicConditions)
                        ? profile.chronicConditions.join(", ")
                        : "",
                    emergencyContactName: profile.emergencyContactName || "",
                    emergencyContactPhone: profile.emergencyContactPhone || "",
                });
            } catch {
                setMessage("Patient service unavailable. Try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

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
            setMessage("Please login to update your profile.");
            return;
        }

        setSaving(true);
        setMessage("");

        const patientPayload = {
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            address: formData.address,
            bloodGroup: formData.bloodGroup,
            profileImage: formData.profileImage,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            allergies: formData.allergies
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            chronicConditions: formData.chronicConditions
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        };

        const authPayload = {
            name: formData.name,
            phone: formData.phone,
            profileImage: formData.profileImage,
        };

        try {
            const patientServiceBase = import.meta.env.VITE_API_BASE_URL;
            const updateRes = await fetch(`${patientServiceBase}/patients/me/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const patientOk = patientResult.status === "fulfilled" && patientResult.value.ok;
            const authOk = authResult.status === "fulfilled" && authResult.value.ok;

            if (authOk) {
                const storedUser = (() => {
                    try {
                        return JSON.parse(localStorage.getItem("user") || "{}");
                    } catch {
                        return {};
                    }
                })();

                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...storedUser,
                        name: formData.name,
                        phone: formData.phone,
                        profilePicture: formData.profileImage || storedUser.profilePicture,
                    })
                );
            }

            if (patientOk && authOk) {
                setMessage("Profile updated successfully.");
                if (onSaved) onSaved();
                return;
            }

            if (!patientOk && authOk) {
                setMessage("Name and phone updated, but patient medical details could not be updated.");
                if (onSaved) onSaved();
                return;
            }

            if (patientOk && !authOk) {
                setMessage("Patient medical details updated, but name/phone update failed.");
                if (onSaved) onSaved();
                return;
            }

            setMessage("Could not update profile details.");
        } catch {
            setMessage("Patient service unavailable. Try again later.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={embedded ? "bg-transparent" : "min-h-screen bg-slate-50 p-6 md:p-8"}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-6 py-4">
                    <h1 className="text-xl font-bold text-slate-800">Update Patient Profile</h1>
                    <p className="mt-1 text-sm text-slate-600">Edit your patient profile details</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    {loading ? (
                        <p className="text-sm text-slate-600">Loading profile...</p>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Full Name
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Telephone Number
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                {/* <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="mb-3 text-sm font-semibold text-slate-700">Profile Image</p>

                                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                                        Profile Image URL
                                        <input
                                            type="url"
                                            name="profileImage"
                                            value={formData.profileImage}
                                            onChange={handleChange}
                                            placeholder="https://example.com/profile.jpg"
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                                        />
                                    </label>

                                    <div className="mt-4 flex items-center gap-4">
                                        <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-white">
                                            {formData.profileImage ? (
                                                <img
                                                    src={formData.profileImage}
                                                    alt="Profile preview"
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData((prev) => ({ ...prev, profileImage: "" }));
                                            }}
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div> */}

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Date of Birth
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Gender
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                    Address
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Blood Group
                                    <input
                                        type="text"
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        placeholder="A+, O-, AB+"
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Emergency Contact Name
                                    <input
                                        type="text"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Emergency Contact Phone
                                    <input
                                        type="text"
                                        name="emergencyContactPhone"
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                    Allergies (comma separated)
                                    <input
                                        type="text"
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                    Chronic Conditions (comma separated)
                                    <input
                                        type="text"
                                        name="chronicConditions"
                                        value={formData.chronicConditions}
                                        onChange={handleChange}
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
                                    {saving ? "Saving..." : "Save Details"}
                                </button>

                                {onCancel && (
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {/* <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                                    <UserRound size={16} />
                                    Patient profile updates are stored in patient-service
                                </span> */}
                            </div>

                            {message && <p className="text-sm text-slate-600">{message}</p>}
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
