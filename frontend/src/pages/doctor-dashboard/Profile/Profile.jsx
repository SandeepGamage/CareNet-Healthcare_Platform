import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Clock3, Loader2, Check, User, DollarSign, Award } from "lucide-react";

import axios from "axios";

export default function DoctorProfile() {

	const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
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
		if (!showModal) {
			// open modal: mount then animate in
			setShowModal(true);
			setTimeout(() => {
				setEditing(true);
				setModalAnimate(true);
			}, 10);
			return;
		}
		// close modal: animate out then unmount and reset form
		setModalAnimate(false);
		setTimeout(() => {
			setEditing(false);
			setShowModal(false);
			// reset form values to current saved profile/user
			setForm({
				name: user?.name || "",
				phone: user?.phone || "",
				profileImage: user?.profileImage || "",
				specialization: profile?.specialization || "",
				consultationFee: profile?.consultationFee || "",
				availableHours: profile?.availableHours || "",
				bio: profile?.bio || "",
				qualifications: profile?.qualifications || "",
				experienceYears: profile?.experienceYears || "",
				isAvailable: !!profile?.isAvailable,
			});
		}, 200);
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
			const payload = {
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
			};
			if (!profileId) {
				throw new Error('Missing profile id');
			}
			const res = await axios.put(`${API_BASE_URL}/doctors/profile/${profileId}`, payload, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const result = res.data || {};
			// update local state
			setUser(prev => ({ ...prev, name: form.name, phone: form.phone, profileImage: form.profileImage }));
			setProfile(prev => ({ ...prev, ...payload }));
			setSaveMessage(result.message || 'Profile updated successfully!');
			// animate modal out then unmount
			setModalAnimate(false);
			setTimeout(() => {
				setEditing(false);
				setShowModal(false);
			}, 200);
		} catch (err) {
			const msg = err?.response?.data?.message || 'Network error. Please try again.';
			setSaveMessage(msg);
		} finally {
			setSaveLoading(false);
			setTimeout(() => setSaveMessage(''), 3000);
		}
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

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="relative">
				<div className="h-48 rounded-b-2xl shadow-lg" style={{ backgroundColor: "#87CEFA" }}></div>
				<div className="absolute -bottom-16 left-8 z-10">
					{user?.profileImage ? (
						<img
							src={user.profileImage}
							alt={user.name}
							className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
						/>
					) : (
						<div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
							<span className="text-5xl font-bold text-white">
								{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="px-8 pt-24 pb-8 max-w-6xl mx-auto">
				<div className="mb-8">
					<div className="flex justify-between items-start mb-6">
						<div>
							<h1 className="text-3xl font-bold text-slate-900">{user?.name}</h1>
							<p className="text-lg text-blue-600 font-semibold mt-1">{profile?.specialization || "General Physician"}</p>
						</div>

						<div className="flex items-start gap-2">
							{!editing && (
								<button onClick={handleEditToggle} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Edit Profile</button>
							)}
							{editing && (
								<span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-sm">Editing...</span>
							)}
						</div>
					</div>

					   <div className="flex flex-wrap gap-6 mb-6">
						   <div className="flex items-center gap-2 text-slate-600">
							   <Mail size={16} />
							   <span className="text-sm">{user?.email}</span>
						   </div>
						   <div className="flex items-center gap-2 text-slate-600">
							   <Phone size={16} />
							   <span className="text-sm">{user?.phone || "Not provided"}</span>
						   </div>
					   </div>
				</div>


				{/* About Section */}
			   <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md mb-8">
				       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
					       <div className="flex items-center gap-3">
						       <User size={18} className="text-white" />
						       <h2 className="text-lg font-bold text-white">Biography</h2>
					       </div>
					   </div>
				   <div className="p-6">
					   <p className="text-slate-700 leading-relaxed italic border-l-4 border-blue-100 pl-4 bg-slate-50 py-3 rounded-r-lg">
						   {profile?.bio || "No biography provided yet. Update your profile to add a brief introduction for your patients."}
					   </p>
				   </div>
			   </div>

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
											<label className="block text-sm font-semibold text-slate-700 mb-2">Full name</label>
											<input name="name" value={form.name} onChange={handleChange} placeholder="Full name" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.name ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
										</div>
										<div>
											<label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
											<input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 ${validationErrors?.phone ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"}`} />
										</div>
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

									{/* hidden fields kept in DOM to preserve values in payload */}
									<input type="hidden" name="profileImage" value={form.profileImage} />
									<input type="hidden" name="availableHours" value={form.availableHours} />

									<button onClick={handleSaveProfile} disabled={saveLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">{saveLoading ? 'Saving...' : 'Save Changes'}</button>
								</div>
							</div>
						</div>
				   )}

				{/* Professional Overview Card */}
				<div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(2,6,23,0.08)] mb-8">
					<div className="px-6 py-5 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
						<div>
							<h2 className="text-lg font-bold text-white">Professional Summary</h2>
							<p className="mt-1 text-sm text-blue-100 opacity-90">Snapshot of your professional metrics and availability</p>
						</div>
						<div />
					</div>
					<div className="p-6">
						<div className="flex flex-wrap items-center gap-3 mb-6">
							<span className="inline-flex items-center rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-100">
								{profile?.specialization || 'General'}
							</span>
							<span className="inline-flex items-center rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-100">
								{profile?.experienceYears || 0} yrs
							</span>
							<span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold ${profile?.isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
								{profile?.isAvailable ? "Available" : "Offline"}
							</span>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-5 hover:shadow-lg transition-shadow">
								<p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Consultation Schedule</p>
								<p className="mt-2 text-base font-extrabold text-slate-900 flex items-center gap-2">
									<Clock3 size={18} className="text-blue-500" />
									{profile?.availableHours || "Not specified"}
								</p>
							</div>
								<div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-5 hover:shadow-lg transition-shadow flex flex-col justify-between">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Service Fee</p>
									<p className="mt-2 text-2xl font-extrabold text-slate-900 flex items-baseline gap-2"><DollarSign size={20} className="text-blue-500" />{profile?.consultationFee || 0}</p>
								</div>
								<div className="mt-3 text-sm text-slate-500">per session</div>
							</div>
							<div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-5 hover:shadow-lg transition-shadow">
								<p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Education</p>
								<p className="mt-2 text-sm font-bold text-slate-800 flex items-center gap-2">
									<Award size={16} className="text-indigo-600" />
									{profile?.qualifications || "No qualifications listed."}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

}
