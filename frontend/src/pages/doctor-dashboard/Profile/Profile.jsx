import { useState, useEffect } from "react";
import { Edit, Mail, MapPin, Phone, Clock3, Check, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Profile() {
	const [doctor, setDoctor] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const userStr = localStorage.getItem("user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			const response = await axios.get(`${API_BASE_URL}/doctors/profile/user/${user.id || user._id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.data.success) {
				setDoctor(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching doctor profile:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!doctor) {
		return (
			<div className="p-8 text-center">
				<p className="text-slate-600">No doctor profile found. Please contact admin.</p>
			</div>
		);
	}

	const doctorProfile = {
		name: doctor.name || "Doctor",
		location: doctor.location || "Hospital Clinic",
		email: doctor.email || "",
		phone: doctor.phone || "",
		specialization: doctor.specialization,
		bio: doctor.bio || "No bio provided.",
		qualifications: doctor.qualifications ? [doctor.qualifications] : [],
		experienceYears: doctor.experienceYears || 0,
		availableHours: doctor.availableHours || "Not set",
		availableSlots: doctor.availableSlots || [],
		isAvailable: doctor.isAvailable,
		consultationFee: doctor.consultationFee || 0,
		rating: 4.8,
		profileViews: 1248,
		appointmentsCompleted: 856,
		patientsServed: 342,
	};

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header Banner */}
			<div className="relative">
				<div className="h-48 rounded-b-2xl shadow-lg" style={{ backgroundColor: "#87CEFA" }}>
				</div>

				{/* Profile Picture */}
				<div className="absolute -bottom-16 left-8 z-10">
					<div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
						<span className="text-5xl font-bold text-white">{doctorProfile.name.charAt(0)}</span>
					</div>
				</div>
			</div>

			{/* Profile Content */}
			<div className="px-8 pt-24 pb-8 max-w-6xl mx-auto">
				{/* Profile Header Info */}
				<div className="mb-8">
					<div className="flex justify-between items-start mb-6">
						<div>
							<h1 className="text-3xl font-bold text-slate-900">{doctorProfile.name}</h1>
							<p className="text-lg text-blue-600 font-semibold mt-1">{doctorProfile.specialization}</p>
							<p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
								<MapPin size={16} />
								{doctorProfile.location}
							</p>
						</div>
					</div>

					<div className="flex gap-6 mb-6">
						<div className="flex items-center gap-2 text-slate-600">
							<Mail size={16} />
							<span className="text-sm">{doctorProfile.email}</span>
						</div>
						<div className="flex items-center gap-2 text-slate-600">
							<Phone size={16} />
							<span className="text-sm">{doctorProfile.phone}</span>
						</div>
							<div className="flex items-center gap-2 text-slate-600">
								<span className="text-sm font-medium text-slate-500">Fee:</span>
								<span className="text-sm">${doctorProfile.consultationFee}</span>
							</div>
					</div>
				</div>

				{/* About Section */}
				<div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold text-slate-800">About</h2>
					</div>
					<p className="text-slate-700 leading-relaxed">{doctorProfile.bio}</p>
					<div className="mt-4 space-y-2">
						<p className="text-sm font-semibold text-slate-600">Qualifications:</p>
						<ul className="space-y-1">
							{doctorProfile.qualifications.map((qual, idx) => (
								<li key={idx} className="text-sm text-slate-700">• {qual}</li>
							))}
						</ul>
					</div>
				</div>

				{/* Professional Experience */}
				<div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
					<div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-blue-100">
						<h2 className="text-lg font-bold text-slate-800">Professional Experience</h2>
						<p className="mt-1 text-sm text-slate-600">Clinical background, availability, and consultation details</p>
					</div>
					<div className="p-6">
						<div className="flex flex-wrap items-center gap-3 mb-4">
							<span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
								{doctorProfile.specialization}
							</span>
							<span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
								{doctorProfile.experienceYears}+ years experience
							</span>
							<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${doctorProfile.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
								{doctorProfile.isAvailable ? "Available now" : "Currently unavailable"}
							</span>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div className="rounded-xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available Hours</p>
								<p className="mt-2 text-base font-semibold text-slate-800">{doctorProfile.availableHours}</p>
							</div>
							<div className="rounded-xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultation Fee</p>
								<p className="mt-2 text-base font-semibold text-slate-800">${doctorProfile.consultationFee}</p>
							</div>
							<div className="rounded-xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
								<p className="mt-2 text-base font-semibold text-slate-800">{doctorProfile.location}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
