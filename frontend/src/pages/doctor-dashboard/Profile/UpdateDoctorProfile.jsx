import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
// Toast removed per request
import ConfirmModal from "../../../components/common/ConfirmModal";

const INITIAL_FORM = {
    profileImage: "",
    specialization: "",
    consultationFee: "",
    availableHours: "",
    bio: "",
    qualifications: "",
    experienceYears: "",
    isAvailable: false,
};

export default function UpdateDoctorProfile({ embedded = false, onCancel, onSaved }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    // profileId no longer required; using PUT /me endpoint

    const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3003/api").replace(/\/$/, "");

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage("Please login to update your profile.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/doctors/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const payload = await response.json();
                    const profile = payload?.data || {};
                    setFormData({
                        profileImage: profile.profileImage || "",
                        specialization: profile.specialization || "",
                        consultationFee: profile.consultationFee || "",
                        availableHours: profile.availableHours || "",
                        bio: profile.bio || "",
                        qualifications: profile.qualifications || "",
                        experienceYears: profile.experienceYears || "",
                        isAvailable: !!profile.isAvailable,
                    });
                } else {
                    setMessage("Profile not found yet. Fill details and save to create your record.");
                }
            } catch {
                setMessage("Doctor service unavailable. Try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [API_BASE_URL]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const [confirmVisible, setConfirmVisible] = useState(false);

    const performSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to update your profile.");
            return;
        }

        setConfirmVisible(false);
        setSaving(true);
        setMessage("");

        const payload = { ...formData };

        try {
            const res = await fetch(`${API_BASE_URL}/doctors/profile/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setMessage("Profile updated successfully.");
                if (onSaved) setTimeout(() => onSaved(), 450);
                return;
            }

            setMessage("Could not update profile details.");
        } catch {
            setMessage("Doctor service unavailable. Try again later.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={embedded ? "bg-transparent" : "min-h-screen bg-slate-50 p-6 md:p-8"}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                <div className="border-b border-blue-100 px-6 py-4">
                    <h1 className="text-xl font-bold text-slate-800">Update Doctor Profile</h1>
                    <p className="mt-1 text-sm text-slate-600">Edit your doctor-service profile details</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setConfirmVisible(true); }} className="space-y-6 p-6">
                    {loading ? (
                        <p className="text-sm text-slate-600">Loading profile...</p>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                                                <img src={formData.profileImage} alt="Profile preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                                            )}
                                        </div>

                                        <button type="button" onClick={() => setFormData((p) => ({ ...p, profileImage: "" }))} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100">Remove Image</button>
                                    </div>
                                </div>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Specialization
                                    <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Consultation Fee (USD)
                                    <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                    Available Hours
                                    <input type="text" name="availableHours" value={formData.availableHours} onChange={handleChange} placeholder="e.g. Mon-Fri 9:00-17:00" className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                    Short biography
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" rows={3} />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Qualifications
                                    <input type="text" name="qualifications" value={formData.qualifications} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-700">
                                    Experience (years)
                                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                </label>

                                <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                                    <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="form-checkbox" /> Currently accepting patients
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button type="button" onClick={() => setConfirmVisible(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                                    <Save size={16} />
                                    {saving ? "Saving..." : "Save Details"}
                                </button>

                                {onCancel && (
                                    <button type="button" onClick={onCancel} className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">Cancel</button>
                                )}

                                <span className="inline-flex items-center gap-2 text-sm text-slate-600"><UserRound size={16} />Doctor profile updates are stored in doctor-service</span>
                            </div>

                            {message && <p className="text-sm text-slate-600">{message}</p>}
                        </>
                    )}
                </form>
            </div>
            <ConfirmModal visible={confirmVisible} title="Confirm Save" message="Save changes to your doctor profile?" onConfirm={performSave} onCancel={() => setConfirmVisible(false)} />
        </div>
    );
}
