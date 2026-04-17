import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
// Toast removed per request
import ConfirmationDialog from "../../../components/confirmationDialog";

const INITIAL_FORM = {
    name: "",
    phone: "",
    profileImage: "",
    specialization: "",
    consultationFee: "",
    availableHours: "",
    bio: "",
    qualifications: "",
    experienceYears: "",
    isAvailable: false,
};

export default function UpdateDoctorProfile({ embedded = false, onCancel, onSaved, onSave }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState("");
    // profileId no longer required; using PUT /me endpoint

    const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3003/api").replace(/\/$/, "");
    const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/$/, "");

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
                        name: profile.name || "",
                        phone: profile.phone || "",
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

    const uploadAvatarFile = async (file) => {
        setUploadingAvatar(true);
        setMessage("");
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to upload your profile image.");
            setUploadingAvatar(false);
            return;
        }

        try {
            const fd = new FormData();
            fd.append('profileImage', file);

            const res = await fetch(`${AUTH_API_BASE}/auth/me/avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setMessage(err.message || 'Image upload failed.');
                setUploadingAvatar(false);
                return;
            }

            const payload = await res.json();
            const url = payload?.url || payload?.data?.url || null;
            if (url) {
                setFormData((p) => ({ ...p, profileImage: url }));
                setMessage('Image uploaded. Preview updated.');
            } else {
                setMessage('Upload succeeded but no URL returned.');
            }
        } catch (err) {
            setMessage('Image upload failed.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const performSave = async () => {
        setConfirmVisible(false);
        setSaving(true);
        setMessage("");

        const payload = { ...formData };

        // If parent provided an onSave handler, delegate saving to it (keeps component UI-only)
        if (onSave) {
            try {
                await onSave(payload);
                setMessage("Profile updated successfully.");
                if (onSaved) setTimeout(() => onSaved(), 450);
                return;
            } catch (err) {
                const msg = err?.message || err?.response?.data?.message || "Could not update profile details.";
                setMessage(msg);
            } finally {
                setSaving(false);
            }
        }

        // Fallback: local PUT to /me (legacy behavior)
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please login to update your profile.");
            setSaving(false);
            return;
        }

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
            <div className="p-8">
                <div className="grid grid-cols-1 gap-8 items-stretch">
                    <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-blue-100/60 flex flex-col">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">Profile</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-800">Update Doctor Profile</h2>
                            <p className="mt-1 text-sm text-slate-600">Edit your doctor-service profile details</p>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); setConfirmVisible(true); }} className="flex-1 p-6 space-y-6">
                            {loading ? (
                                <p className="text-sm text-slate-600">Loading profile...</p>
                            ) : (
                                <>
                                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="mb-3 text-sm font-semibold text-slate-700">Profile Image</p>

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

                                        <label className="flex flex-col gap-2 text-sm text-slate-700 mt-3">
                                            Upload from device
                                            <input type="file" accept="image/*" onChange={(e) => {
                                                const f = e.target.files && e.target.files[0];
                                                if (f) uploadAvatarFile(f);
                                                e.currentTarget.value = null;
                                            }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                            {uploadingAvatar && <span className="text-xs text-slate-500">Uploading image...</span>}
                                        </label>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                                            Full name
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                        </label>

                                        <label className="flex flex-col gap-2 text-sm text-slate-700">
                                            Contact number
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. +94771234567" className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                                        </label>

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

                                        
                                    </div>

                                    {message && <p className="text-sm text-slate-600">{message}</p>}
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            <ConfirmationDialog
                isOpen={confirmVisible}
                onClose={() => setConfirmVisible(false)}
                onConfirm={performSave}
                title="Confirm Save"
                description="Save changes to your doctor profile?"
                confirmText="Save"
                cancelText="Cancel"
                type="primary"
            />
        </div>
    );
}
