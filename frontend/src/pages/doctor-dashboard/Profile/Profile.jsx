
import { useEffect, useState } from "react";
import axios from "axios";
import { Mail, MapPin, Phone, Clock3 } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_DOCTOR_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const DOCTOR_PROFILE_ENDPOINT = `${API_BASE_URL}/doctors/profile`;

export default function Profile() {


	const [doctorProfile, setDoctorProfile] = useState(null);
	const [loadingProfile, setLoadingProfile] = useState(true);

	 useEffect(() => {
	 	const fetchProfile = async () => {
	 		setLoadingProfile(true);
	 		try {
	 			const token = localStorage.getItem("token");
	 			if (!token) throw new Error("No token");
	 			const response = await axios.get(`${DOCTOR_PROFILE_ENDPOINT}/me`, {
	 				headers: { Authorization: `Bearer ${token}` },
	 			});
	 			const profile = response.data?.data;
	 			setDoctorProfile(profile);
	 		} catch (err) {
	 			setDoctorProfile(null);
	 		} finally {
	 			setLoadingProfile(false);
	 		}
	 	};
	 	fetchProfile();
	 }, []);

	if (loadingProfile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<span className="text-lg text-blue-700 font-semibold">Loading profile...</span>
			</div>
		);
	}

	if (!doctorProfile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<span className="text-lg text-red-700 font-semibold">Profile not found.</span>
			</div>
		);
	}


	// No loading or error state needed with mock data

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="relative">
				<div className="h-48 rounded-b-2xl shadow-lg" style={{ backgroundColor: "#87CEFA" }}></div>
				<div className="absolute -bottom-16 left-8 z-10">
					<div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
						<span className="text-5xl font-bold text-white">
							{doctorProfile.name ? doctorProfile.name.split(" ").map(n => n[0]).join("") : "?"}
						</span>
					</div>
				</div>
			</div>

			<div className="px-8 pt-24 pb-8 max-w-6xl mx-auto">
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

				<div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md mb-8">
					<div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
						<Clock3 size={22} className="text-blue-500" />
						<h2 className="text-lg font-bold text-slate-800">Available Hours</h2>
					</div>
					<div className="p-6">
						<p className="text-base font-semibold text-blue-800">{doctorProfile.availableHours}</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md mb-8">
					<div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
						<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-lg">i</span>
						<h2 className="text-lg font-bold text-slate-800">About</h2>
					</div>
					<div className="p-6">
						<p className="text-slate-700 leading-relaxed mb-4">{doctorProfile.bio}</p>
						<div className="mt-2 space-y-2">
							<p className="text-sm font-semibold text-slate-600">Qualifications:</p>
							<ul className="space-y-1">
								{doctorProfile.qualifications && doctorProfile.qualifications.map((qual, idx) => (
									<li key={idx} className="text-sm text-slate-700">• {qual}</li>
								))}
							</ul>
						</div>
					</div>
				</div>

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
