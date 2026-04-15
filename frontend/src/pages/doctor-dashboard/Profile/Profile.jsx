import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Clock3, Loader2, Check } from "lucide-react";

import { useEffect, useState } from "react";
import axios from "axios";
import { Mail, MapPin, Phone, Clock3, Loader2 } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const DOCTOR_PROFILE_ENDPOINT = `${API_BASE_URL}/doctors/profile`;

	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [hoursInput, setHoursInput] = useState("");
	const [hoursMessage, setHoursMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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
				const res = await fetch(`${API_BASE_URL}/doctors/profile/me`, {
					headers: {
						"Authorization": `Bearer ${token}`,
						"Content-Type": "application/json"
					}
				});
				const result = await res.json().catch(() => ({}));
				if (!res.ok) {
					setError(result.message || "Failed to fetch profile.");
					setLoading(false);
					return;
				}
				const data = result.data || {};
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
			const res = await fetch(`${API_BASE_URL}/profile/me/available-hours`, {
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

			const token = localStorage.getItem("token");
			await axios.put(`http://localhost:3003/api/doctors/profile/${profile._id}`,
				{ availableHours: trimmedHours },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setProfile({ ...profile, availableHours: trimmedHours });
			setHoursMessage("Available hours updated successfully!");
			setTimeout(() => setHoursMessage(""), 3000);
		} catch (err) {
			setHoursMessage("Network error. Please try again.");
			setTimeout(() => setHoursMessage(""), 3000);
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
							<p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
								<MapPin size={16} />
								Office Location: Available upon appointment
							</p>
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
						<div className="flex items-center gap-2 text-slate-600">
							<span className="text-sm font-medium text-slate-500">Consultation Fee:</span>
							<span className="text-sm font-bold text-slate-900">${profile?.consultationFee || 0}</span>
						</div>
					</div>
				</div>

				{/* Availability Editor */}
				<div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
					<h2 className="text-lg font-bold text-slate-800 mb-4">Available Hours</h2>
					<p className="text-sm text-slate-600 mb-4">
						Update your weekly working hours for booking availability.
					</p>
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Clock3 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								type="text"
								value={hoursInput}
								onChange={(e) => setHoursInput(e.target.value)}
								placeholder="e.g., 09:00-17:00"
								className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<button
							onClick={handleSaveAvailableHours}
							className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95 transform"
						>
							Save Hours
						</button>
					</div>
					{hoursMessage && (
						<p className={`mt-3 text-sm font-medium ${hoursMessage.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>
							{hoursMessage}
						</p>
					)}
					<p className="mt-3 text-sm text-slate-600">
						Current available hours: <span className="font-semibold text-slate-800">{profile?.availableHours || "Not set"}</span>
					</p>
				</div>

				{/* About Section */}
				<div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold text-slate-800">Biography & Qualifications</h2>
					</div>
					<p className="text-slate-700 leading-relaxed italic border-l-4 border-blue-100 pl-4 bg-slate-50 py-3 rounded-r-lg">
						{profile?.bio || "No biography provided yet. Update your profile to add a brief introduction for your patients."}
					</p>
					<div className="mt-6 space-y-3">
						<p className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<Check size={16} className="text-blue-600" />
							Educational Background:
						</p>
						<p className="text-sm text-slate-700 pl-6">
							{profile?.qualifications || "No qualifications listed. Please update your profile."}
						</p>
					</div>
				</div>

				{/* Professional Overview Card */}
				<div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md mb-8">
					<div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
						<h2 className="text-lg font-bold text-white">Professional Summary</h2>
						<p className="mt-1 text-sm text-blue-100 opacity-90">Snapshot of your professional metrics and availability</p>
					</div>
					<div className="p-6">
						<div className="flex flex-wrap items-center gap-3 mb-6">
							<span className="inline-flex items-center rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
								{profile?.specialization}
							</span>
							<span className="inline-flex items-center rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-100">
								{profile?.experienceYears}+ years experience
							</span>
							<span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold ${profile?.isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
								{profile?.isAvailable ? "Currently Available" : "Offline"}
							</span>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-hover hover:border-blue-200">
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consultation Schedule</p>
								<p className="mt-2 text-base font-bold text-slate-800 flex items-center gap-2">
									<Clock3 size={16} className="text-blue-500" />
									{profile?.availableHours || "Not specified"}
								</p>
							</div>
							<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-hover hover:border-blue-200">
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Fee</p>
								<p className="mt-2 text-base font-bold text-slate-800 flex items-center gap-2">
									<span className="text-blue-500 text-lg font-black">$</span>
									{profile?.consultationFee || 0} per session
								</p>
							</div>
							<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-hover hover:border-blue-200">
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rating</p>
								<p className="mt-2 text-base font-bold text-slate-800 flex items-center gap-2">
									<span className="text-amber-400 text-lg">★</span>
									{profile?.rating || "No ratings"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

