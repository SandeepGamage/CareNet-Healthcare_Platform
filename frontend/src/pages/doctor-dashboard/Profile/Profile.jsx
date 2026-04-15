import { useState } from "react";
import { Edit, Mail, MapPin, Phone, Clock3, Check } from "lucide-react";

export default function Profile() {
	const doctorProfile = {
		name: "Dr. Sarah Johnson",
		location: "New York, USA",
		email: "sarah.johnson@healthcare.com",
		phone: "+1 (555) 123-4567",
		specialization: "Cardiologist",
		bio: "Experienced cardiologist with 12+ years of clinical practice. Specializing in heart disease prevention and treatment.",
		qualifications: [
			"MD, Columbia University",
			"Board Certified, American Board of Internal Medicine",
			"Fellow, American College of Cardiology",
		],
		experienceYears: 12,
		availableHours: "09:00-17:00",
		isAvailable: true,
		consultationFee: 150,
		rating: 4.8,
		profileViews: 1248,
		appointmentsCompleted: 856,
		patientsServed: 342,
	};

	const [availableHours, setAvailableHours] = useState(doctorProfile.availableHours);
	const [hoursInput, setHoursInput] = useState(doctorProfile.availableHours);
	const [hoursMessage, setHoursMessage] = useState("");

	const handleSaveAvailableHours = () => {
		const trimmedHours = hoursInput.trim();
		if (!trimmedHours) {
			setHoursMessage("Please enter available hours in HH:MM-HH:MM format.");
			return;
		}

		setAvailableHours(trimmedHours);
		setHoursMessage("Available hours updated for this session.");
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
						<span className="text-5xl font-bold text-white">SJ</span>
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

				{/* Availability Editor */}
				<div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
					<h2 className="text-lg font-bold text-slate-800 mb-4">Available Hours</h2>
					<p className="text-sm text-slate-600 mb-4">
						Update your working hours for the doctor dashboard display.
					</p>
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Clock3 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								type="text"
								value={hoursInput}
								onChange={(e) => setHoursInput(e.target.value)}
								placeholder="09:00-17:00"
								className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<button
							onClick={handleSaveAvailableHours}
							className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
						>
							Save Hours
						</button>
					</div>
					{hoursMessage && <p className="mt-3 text-sm text-slate-600">{hoursMessage}</p>}
					<p className="mt-3 text-sm text-slate-600">
						Current available hours: <span className="font-semibold text-slate-800">{availableHours}</span>
					</p>
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
								<p className="mt-2 text-base font-semibold text-slate-800">{availableHours}</p>
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
