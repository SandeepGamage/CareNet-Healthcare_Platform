import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Clock3, Loader2, Check, User, DollarSign, Award } from "lucide-react";

import axios from "axios";
import UpdateDoctorProfile from "./UpdateDoctorProfile";

export default function DoctorProfile() {

	const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3003/api").replace(/\/$/, "");
	const DOCTOR_PROFILE_ENDPOINT = `${API_BASE_URL}/doctors/profile`;

	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [profileId, setProfileId] = useState(null);
	const [editing, setEditing] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [modalAnimate, setModalAnimate] = useState(false);
	const [form, setForm] = useState({
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
	});
	const [hoursInput, setHoursInput] = useState("");
	const [hoursMessage, setHoursMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saveLoading, setSaveLoading] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");
	const [validationErrors, setValidationErrors] = useState({});
	const [saveError, setSaveError] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			setError("");
			try {
				const token = localStorage.getItem("token");
				if (!token) {
					setError("Not authenticated. Please log in.");
					setLoading(false);
					return;
				}

				// Only get doctor profile from doctor-service
				const profileRes = await fetch(`${API_BASE_URL}/doctors/profile/me`, {
					headers: {
						"Authorization": `Bearer ${token}`,
						"Content-Type": "application/json"
					}
				});
				const profileResult = await profileRes.json().catch(() => ({}));
				if (!profileRes.ok) {
					setError(profileResult.message || "Failed to fetch profile.");
					setLoading(false);
					return;
				}
				const data = profileResult.data || {};
				// Use populated user fields directly from backend
				setUser({
					name: data.name,
					email: data.email,
					phone: data.phone,
					profileImage: data.profileImage,
				});
				setProfile({
					specialization: data.specialization,
					consultationFee: data.consultationFee,
					availableHours: data.availableHours,
					bio: data.bio,
					qualifications: data.qualifications,
					experienceYears: data.experienceYears,
					isAvailable: data.isAvailable,
					rating: data.rating,
				});
				// initialize form values for editing
				setForm({
					name: data.name || "",
					phone: data.phone || "",
					profileImage: data.profileImage || "",
					specialization: data.specialization || "",
					consultationFee: data.consultationFee || "",
					availableHours: data.availableHours || "",
					bio: data.bio || "",
					qualifications: data.qualifications || "",
					experienceYears: data.experienceYears || "",
					isAvailable: !!data.isAvailable,
				});
				// store profile id if provided by backend
				setProfileId(data.id || data._id || null);
				setLoading(false);
			} catch (err) {
				setError("Network error. Please try again.");
				setLoading(false);
			}
		};
		fetchProfile();
	}, []);


	// Save available hours (PATCH to backend)
	const handleSaveAvailableHours = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setHoursMessage("Not authenticated. Please log in.");
			setTimeout(() => setHoursMessage(""), 3000);
			return;
		}
		if (!hoursInput.trim()) {
			setHoursMessage("Please enter your available hours.");
			setTimeout(() => setHoursMessage(""), 3000);
			return;
		}
		try {
			const res = await fetch(`${API_BASE_URL}/doctors/profile/me/available-hours`, {
				method: "PATCH",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ availableHours: hoursInput })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				setHoursMessage(result.message || "Failed to update available hours.");
				setTimeout(() => setHoursMessage(""), 3000);
				return;
			}

			setProfile({ ...profile, availableHours: hoursInput });
			setForm({ ...form, availableHours: hoursInput });
			setHoursMessage("Available hours updated successfully!");
			setTimeout(() => setHoursMessage(""), 3000);
		} catch (err) {
			setHoursMessage("Network error. Please try again.");
			setTimeout(() => setHoursMessage(""), 3000);
		}
	};

	const handleEditToggle = () => {
		setSaveMessage("");
		// Open edit view using the same pattern as PatientProfile (full-page editor)
		setEditing(true);
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	};

	const handleSaveProfile = async () => {
		const token = localStorage.getItem('token');
		if (!token) {
			setSaveMessage('Not authenticated. Please log in.');
			setTimeout(() => setSaveMessage(''), 3000);
			return;
		}
		setSaveLoading(true);
		setSaveMessage('');
		try {
			await saveProfilePayload({
				name: form.name,
				phone: form.phone,
				profileImage: form.profileImage,
				specialization: form.specialization,
				consultationFee: form.consultationFee,
				availableHours: form.availableHours,
				bio: form.bio,
				qualifications: form.qualifications,
				experienceYears: form.experienceYears,
				isAvailable: form.isAvailable,
			});
		} catch (err) {
			const msg = err?.response?.data?.message || 'Network error. Please try again.';
			setSaveMessage(msg);
		} finally {
			setSaveLoading(false);
			setTimeout(() => setSaveMessage(''), 3000);
		}
	};

	// Shared save logic used by modal save and embedded UpdateDoctorProfile via onSave
	const saveProfilePayload = async (payload) => {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('Not authenticated');
		if (!profileId) throw new Error('Missing profile id');

		const res = await axios.put(`${API_BASE_URL}/doctors/profile/${profileId}`, payload, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const result = res.data || {};

		// update local state
		setUser(prev => ({ ...prev, name: payload.name, phone: payload.phone, profileImage: payload.profileImage }));
		setProfile(prev => ({ ...prev, ...payload }));
		setSaveMessage(result.message || 'Profile updated successfully!');
		// animate modal out then unmount
		setModalAnimate(false);
		setTimeout(() => {
			setEditing(false);
			setShowModal(false);
		}, 200);

		return result;
	};


	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<Loader2 className="animate-spin mr-2" />
				<span className="text-slate-700 text-lg">Loading profile...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<span className="text-rose-600 text-lg font-semibold">{error}</span>
			</div>
		);
	}
		// If editing, render the full-page editor (same pattern as PatientProfile)
		if (editing) {
			return (
				<div className="min-h-screen bg-slate-50 p-6 md:p-8">
					<UpdateDoctorProfile
						embedded
						onCancel={() => setEditing(false)}
						onSave={async (payload) => await saveProfilePayload(payload)}
						onSaved={() => {
							setEditing(false);
							// refetch profile to refresh view
							(async () => {
								setLoading(true);
								try {
									const token = localStorage.getItem("token");
									if (token) {
										const profileRes = await fetch(`${API_BASE_URL}/doctors/profile/me`, {
											headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
										});
										const profileResult = await profileRes.json().catch(() => ({}));
										const data = profileResult.data || {};
										setUser({ name: data.name, email: data.email, phone: data.phone, profileImage: data.profileImage });
										setProfile({ specialization: data.specialization, consultationFee: data.consultationFee, availableHours: data.availableHours, bio: data.bio, qualifications: data.qualifications, experienceYears: data.experienceYears, isAvailable: data.isAvailable, rating: data.rating });
										setForm({ name: data.name || "", phone: data.phone || "", profileImage: data.profileImage || "", specialization: data.specialization || "", consultationFee: data.consultationFee || "", availableHours: data.availableHours || "", bio: data.bio || "", qualifications: data.qualifications || "", experienceYears: data.experienceYears || "", isAvailable: !!data.isAvailable });
									}
								} catch (e) {
									// ignore
								} finally {
									setLoading(false);
								}
							})();
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
					<div className="h-40 w-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
						{user?.profileImage ? (
							<img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<span className="text-5xl font-bold text-white">
									{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-8 pb-8 pt-24">
				<div className="mb-8">
					<div className="mb-4 flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-slate-900">{user?.name || 'Doctor'}</h1>
							<p className="mt-1 text-lg font-semibold text-blue-600">{profile?.specialization || 'General Physician'}</p>
							<p className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
								<Check size={14} />
								Logged-in account details
							</p>
						</div>

						<button
							type="button"
							onClick={handleEditToggle}
							className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
						>
							Edit Profile
						</button>
					</div>

					<div className="mb-4 flex flex-wrap gap-6">
						<div className="flex items-center gap-2 text-slate-600">
							<Mail size={16} />
							<span className="text-sm">{user?.email || 'Not provided'}</span>
						</div>
						<div className="flex items-center gap-2 text-slate-600">
							<Phone size={16} />
							<span className="text-sm">{user?.phone || 'Not provided'}</span>
						</div>
						<div className="flex items-center gap-2 text-slate-600">
							<MapPin size={16} />
							<span className="text-sm">{profile?.clinicAddress || 'Not provided'}</span>
						</div>
					</div>

					{saveMessage && <p className="text-sm text-slate-600">{saveMessage}</p>}
				</div>

				<div className="mb-8 grid gap-4 md:grid-cols-3">
					<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultation Schedule</p>
						<p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
							<Clock3 size={16} />
							{profile?.availableHours || 'Not specified'}
						</p>
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service Fee</p>
						<p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
							<DollarSign size={16} />
							{profile?.consultationFee || 0}
						</p>
						<div className="mt-3 text-sm text-slate-500">per session</div>
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</p>
						<p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-800">
							<Award size={16} />
							{profile?.qualifications || 'No qualifications listed.'}
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
					<div className="border-b border-blue-100 px-6 py-4">
						<h2 className="text-lg font-bold text-slate-800">Biography & Details</h2>
						<p className="mt-1 text-sm text-slate-600">Short introduction and professional details</p>
					</div>
					<div className="grid gap-6 p-6 md:grid-cols-2">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biography</p>
							<p className="mt-2 text-base font-semibold text-slate-800">{profile?.bio || 'No biography provided yet.'}</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</p>
							<p className="mt-2 text-base font-semibold text-slate-800">{profile?.experienceYears ? `${profile.experienceYears} years` : 'Not specified'}</p>
							<p className="mt-3 text-xs text-slate-500">{profile?.isAvailable ? 'Currently accepting patients' : 'Not accepting patients'}</p>
						</div>
						<div className="md:col-span-2">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</p>
							<p className="mt-2 text-base font-semibold text-slate-800">{profile?.qualifications || 'No qualifications listed.'}</p>
						</div>
					</div>
				</div>

				{/* keep modal for backward compatibility (unused when using full-page editor) */}
				{showModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
						<div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${modalAnimate ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={handleEditToggle}></div>
						<div className={`relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-lg p-6 z-10 transform transition-all duration-200 ${modalAnimate ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0'}`}>
							<div className="border-b border-slate-100 bg-slate-50 px-4 py-3 mb-4 rounded-t-2xl">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">Profile</p>
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-bold">Edit Profile</h3>
									<button onClick={handleEditToggle} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">Cancel</button>
								</div>
							</div>
							<div className="p-2 space-y-4">
								{saveError && (
									<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>
								)}
								{saveMessage && (
									<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveMessage}</div>
								)}
								{validationErrors?.form && (
									<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{validationErrors.form}</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
										<input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Specialization" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.specialization ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
									</div>
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Consultation fee (USD)</label>
										<input name="consultationFee" value={form.consultationFee} onChange={handleChange} placeholder="Consultation fee" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.consultationFee ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
									</div>

									<div className="col-span-1 md:col-span-2">
										<label className="block text-sm font-semibold text-slate-700 mb-2">Short biography</label>
										<textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Short biography" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm resize-none disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.bio ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} rows={3} />
									</div>
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Qualifications</label>
										<input name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="Qualifications" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.qualifications ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
									</div>
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">Experience (years)</label>
										<input name="experienceYears" value={form.experienceYears} onChange={handleChange} placeholder="Experience years" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.experienceYears ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
									</div>
									<div className="col-span-1 md:col-span-2 flex items-center">
										<label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="form-checkbox" /> <span>Available now</span></label>
									</div>
								</div>

								<input type="hidden" name="profileImage" value={form.profileImage} />
								<input type="hidden" name="availableHours" value={form.availableHours} />

								<button onClick={handleSaveProfile} disabled={saveLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">{saveLoading ? 'Saving...' : 'Save Changes'}</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);

}
