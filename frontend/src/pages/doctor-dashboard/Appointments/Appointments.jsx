import { useState, useEffect } from "react";
import { 
	Calendar, 
	CheckCircle, 
	XCircle, 
	Clock3, 
	User, 
	MessageSquare, 
	ArrowUpDown, 
	Search, 
	X, 
	Loader2, 
	AlertCircle,
	Check,
	History
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, CheckCircle, XCircle, Clock3, User, MessageSquare, ArrowUpDown, Search, X } from "lucide-react";

const statusStyles = {
	PENDING: "bg-amber-100 text-amber-700",
	CONFIRMED: "bg-emerald-100 text-emerald-700",
	CANCELLED: "bg-rose-100 text-rose-700",
	COMPLETED: "bg-blue-100 text-blue-700",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
	const hours = Math.floor(i / 2).toString().padStart(2, "0");
	const minutes = (i % 2 === 0 ? "00" : "30");
	return `${hours}:${minutes}`;
});
	PENDING: "bg-amber-100 text-amber-700",
	CONFIRMED: "bg-emerald-100 text-emerald-700",
	CANCELLED: "bg-rose-100 text-rose-700",
	COMPLETED: "bg-blue-100 text-blue-700",
};

const normalizeStatus = (status) => String(status || "PENDING").toUpperCase();

const formatStatusLabel = (status) => {
	const normalized = normalizeStatus(status);
	if (normalized === "CANCELLED") return "Rejected";
	return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

const formatDateForTable = (dateValue) => {
	if (!dateValue) return "N/A";
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return "N/A";
	return date.toISOString().slice(0, 10);
};

const normalizeAppointment = (appointment) => ({
	id: appointment._id || appointment.id || "",
	patientName: appointment.patientName || "Unknown Patient",
	patientId: appointment.patientId || "N/A",
	requestedDate: formatDateForTable(appointment.appointmentDate || appointment.requestedDate),
	requestedTime: appointment.timeSlot || appointment.requestedTime || "N/A",
	appointmentType: appointment.type || appointment.appointmentType || "General Consultation",
	reason: appointment.reason || "No reason provided",
	status: normalizeStatus(appointment.status),
});

export default function Appointments() {
	// --- State management ---
	const [appointments, setAppointments] = useState([]);
	const [doctor, setDoctor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("17:00");
	const [hoursMessage, setHoursMessage] = useState("");
	const [savingHours, setSavingHours] = useState(false);
	
	const [sortField, setSortField] = useState("appointmentDate");
	const [sortDirection, setSortDirection] = useState("asc");
	const [searchQuery, setSearchQuery] = useState("");

	const getAuthToken = () => localStorage.getItem("token");

	const getRequestConfig = () => {
		const token = getAuthToken();
		return {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
	};

	const fetchDoctorAppointments = async () => {
		const token = getAuthToken();
		if (!token) {
			setAppointments([]);
			setErrorMessage("Login token not found. Please login again.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const response = await axios.get(`${API_BASE_URL}/appointments/doctor`, getRequestConfig());
			const rawAppointments = Array.isArray(response.data)
				? response.data
				: Array.isArray(response.data?.data)
					? response.data.data
					: [];

			setAppointments(rawAppointments.map(normalizeAppointment));
			setErrorMessage("");
		} catch (error) {
			setAppointments([]);
			setErrorMessage(error.response?.data?.message || "Could not load appointment requests from backend.");
		} finally {
			setLoading(false);
		}
	};

	const updateAppointmentStatus = async (appointmentId, status) => {
		try {
			await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}/status`, { status }, getRequestConfig());
			await fetchDoctorAppointments();
		} catch (error) {
			setErrorMessage(error.response?.data?.message || "Failed to update appointment status.");
		}
	};

	useEffect(() => {
		fetchDoctorAppointments();
	}, []);

	// --- initialization ---
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			await Promise.all([fetchDoctorProfile(), fetchAppointments()]);
			setLoading(false);
		};
		fetchData();
	}, []);

	const fetchDoctorProfile = async () => {
		try {
			const token = localStorage.getItem("token");
			const userStr = localStorage.getItem("user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			const response = await axios.get(`${API_BASE_URL}/doctors/profile/user/${user.id || user._id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.data.success) {
				const doc = response.data.data;
				setDoctor(doc);
				if (doc.availableHours && doc.availableHours.includes("-")) {
					const [start, end] = doc.availableHours.split("-");
					setStartTime(start);
					setEndTime(end);
				}
			}
		} catch (error) {
			console.error("Error fetching doctor profile:", error);
		}
	};

	const fetchAppointments = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(`${API_BASE_URL}/appointments/doctor`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setAppointments(response.data || []);
		} catch (error) {
			console.error("Error fetching appointments:", error);
		}
	};

	const handleSaveAvailableHours = async () => {
		if (startTime === endTime) {
			setHoursMessage("Start time and End time cannot be the same.");
			return;
		}

		const hoursString = `${startTime}-${endTime}`;
		
		try {
			setSavingHours(true);
			setHoursMessage(""); // Clear previous messages
			const token = localStorage.getItem("token");
			const response = await axios.put(`${API_BASE_URL}/doctors/profile/${doctor._id}`, 
				{ availableHours: hoursString },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				setDoctor(response.data.data);
				setHoursMessage("Available hours and slots updated successfully!");
				setTimeout(() => setHoursMessage(""), 5000);
			}
		} catch (error) {
			console.error("Error updating available hours:", error);
			const errorMsg = error.response?.data?.message || "Failed to update hours. Please check the format.";
			setHoursMessage(`Error: ${errorMsg}`);
		} finally {
			setSavingHours(false);
		}
	};

	const handleStatusUpdate = async (id, status) => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.patch(`${API_BASE_URL}/appointments/${id}/status`, 
				{ status },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			
			if (response.status === 200) {
				// Refresh appointments
				fetchAppointments();
			}
		} catch (error) {
			console.error(`Error updating appointment to ${status}:`, error);
			alert("Failed to update appointment status.");
		}
	};

	// --- Table Logic ---
	const handleSort = (field) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const sortAppointments = (data) => {
		const sorted = [...data].sort((a, b) => {
			let compareA, compareB;

			switch (sortField) {
				case "patientName":
					compareA = a.patientName?.toLowerCase() || "";
					compareB = b.patientName?.toLowerCase() || "";
					break;
				case "status":
					compareA = a.status?.toLowerCase() || "";
					compareB = b.status?.toLowerCase() || "";
					break;
				case "appointmentDate":
					compareA = new Date(a.appointmentDate);
					compareB = new Date(b.appointmentDate);
					break;
				case "timeSlot":
				default:
					compareA = a.timeSlot || "";
					compareB = b.timeSlot || "";
					break;
			}

			if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
			if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	};

	const filterAppointments = (data) => {
	const sortedAppointments = sortAppointments(appointments);
	const SortIcon = ({ columnKey }) => {
		if (sortField !== columnKey) {
			return <ArrowUpDown size={14} className="opacity-30" />;
		}
		return <ArrowUpDown size={14} className={sortDirection === "asc" ? "opacity-100" : "opacity-50 rotate-180"} />;
	};

	const filterAppointments = (appointments) => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		if (!normalizedQuery) return data;

		return data.filter((item) => {
			return (
				item.patientName?.toLowerCase().includes(normalizedQuery) ||
				item.appointmentId?.toLowerCase().includes(normalizedQuery) ||
				item.reason?.toLowerCase().includes(normalizedQuery) ||
				item.status?.toLowerCase().includes(normalizedQuery)
			);
		});
	};

	const processedAppointments = sortAppointments(filterAppointments(appointments));

	const totalRequests = appointments.length;
	const pendingRequests = appointments.filter((a) => a.status === "PENDING").length;
	const confirmedRequests = appointments.filter((a) => a.status === "CONFIRMED").length;

	const SortIcon = ({ columnKey }) => {
		if (sortField !== columnKey) return <ArrowUpDown size={14} className="opacity-30" />;
		return <ArrowUpDown size={14} className={sortDirection === "asc" ? "opacity-100" : "opacity-50 rotate-180"} />;
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-50">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="w-10 h-10 animate-spin text-blue-600" />
					<p className="text-slate-500 font-medium">Loading appointments...</p>
				</div>
			</div>
		);
	}
	const totalRequests = appointments.length;
	const pendingRequests = appointments.filter((appointment) => appointment.status === "PENDING").length;
	const confirmedRequests = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;

	return (
		<div className="p-8 bg-slate-50 min-h-screen">
			{/* Header */}
			<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-slate-800 tracking-tight">Appointments</h1>
					<p className="mt-1 text-sm text-slate-500 font-medium flex items-center gap-2">
						<Clock3 size={14} />
						Manage patient requests and your daily availability
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${doctor?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
						<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
							{doctor?.isAvailable ? 'Active' : 'Offline'}
						</span>
					</div>
				</div>
				{errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				{/* Availability Editor Card */}
				<div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-3 mb-4">
							<div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
								<History size={20} />
							</div>
							<div>
								<h2 className="text-lg font-bold text-slate-800">Set Availability</h2>
								<p className="text-xs text-slate-500">Configure your daily working hours and time slots</p>
							</div>
						</div>
						
						<div className="flex flex-col md:flex-row items-center gap-3 mt-6">
							<div className="flex items-center gap-2 flex-1 w-full">
								<div className="relative flex-1">
									<Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
									<select
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none"
									>
										{TIME_OPTIONS.map(time => (
											<option key={time} value={time}>{time}</option>
										))}
									</select>
								</div>
								
								<span className="text-slate-400 font-bold text-xs uppercase tracking-widest">To</span>

								<div className="relative flex-1">
									<Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
									<select
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
										className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none"
									>
										{TIME_OPTIONS.map(time => (
											<option key={time} value={time}>{time}</option>
										))}
									</select>
								</div>
							</div>
							<button
								onClick={handleSaveAvailableHours}
								disabled={savingHours}
								className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:bg-blue-300 shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
							>
								{savingHours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
								Apply Hours
							</button>
						</div>
						{hoursMessage && (
							<p className={`mt-3 text-xs font-semibold flex items-center gap-1 ${hoursMessage.includes("Failed") ? "text-rose-500" : "text-emerald-600"}`}>
								<AlertCircle size={14} />
								{hoursMessage}
							</p>
						)}
					</div>

					<div className="mt-6 pt-6 border-t border-slate-100">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Time Slots</h3>
							<span className="text-[10px] text-slate-400 font-medium italic underline underline-offset-4 decoration-blue-200">Refreshed Daily at 00:00 AM</span>
						</div>
						<div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
							{doctor?.availableSlots?.length > 0 ? (
								doctor.availableSlots.map((slot, idx) => (
									<span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100/50 hover:bg-blue-100 transition-colors">
										{slot}
									</span>
								))
							) : (
								<p className="text-xs text-slate-400 italic">No available slots. Set your hours above to generate slots.</p>
							)}
						</div>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
								<Calendar size={24} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Requests</p>
								<h3 className="text-2xl font-black text-slate-800">{totalRequests}</h3>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md border-l-4 border-l-amber-400">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
								<Clock3 size={24} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending Approval</p>
								<h3 className="text-2xl font-black text-slate-800">{pendingRequests}</h3>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md border-l-4 border-l-emerald-400">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
								<CheckCircle size={24} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirmed</p>
								<h3 className="text-2xl font-black text-slate-800">{confirmedRequests}</h3>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
				{/* Table Header / Filters */}
				<div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
							<User size={20} />
						</div>
						<div>
							<h2 className="text-lg font-bold text-slate-800">Appointment Queue</h2>
							<p className="text-xs text-slate-500 font-medium italic">Manage upcoming patient visits</p>
						</div>
					</div>

					<div className="relative flex-1 max-w-md">
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search patient, ID, or status..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
						/>
						{searchQuery && (
							<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={16} /></button>
						)}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[1000px]">
						<thead>
							<tr className="bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
								<th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("patientName")}>
									<div className="flex items-center gap-2">Patient <SortIcon columnKey="patientName" /></div>
								</th>
								<th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("appointmentDate")}>
								<div className="flex items-center gap-2">Schedule <SortIcon columnKey="appointmentDate" /></div>
								</th>
								<th className="px-6 py-4">Status</th>
								<th className="px-6 py-4">Reason & Details</th>
								<th className="px-6 py-4 text-center">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{processedAppointments.length > 0 ? (
								processedAppointments.map((appointment) => (
									<tr key={appointment._id} className="hover:bg-slate-50/50 transition-all group">
										<td className="px-6 py-5">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
													{appointment.patientName?.charAt(0)}
												</div>
												<div>
													<p className="text-sm font-bold text-slate-800">{appointment.patientName}</p>
													<p className="text-[10px] text-slate-500 font-mono tracking-tighter">ID: {appointment.appointmentId || appointment._id.slice(-8).toUpperCase()}</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-5">
											<div>
												<p className="text-sm font-bold text-slate-700">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
												<p className="text-xs text-blue-600 font-black">{appointment.timeSlot}</p>
											</div>
										</td>
										<td className="px-6 py-5">
											<span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[appointment.status] || "bg-slate-100"}`}>
												{appointment.status}
											</span>
										</td>
										<td className="px-6 py-5 max-w-[300px]">
											<div className="flex items-start gap-2">
												<MessageSquare size={16} className="mt-0.5 text-slate-300 shrink-0" />
												<div>
													<p className="text-xs text-slate-600 line-clamp-2">{appointment.reason || "General Consultation"}</p>
													<p className="text-[10px] text-slate-400 mt-1 italic capitalize">{appointment.type?.toLowerCase().replace('_', ' ')}</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-5">
											<div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
												{appointment.status === 'PENDING' && (
													<>
														<button 
															onClick={() => handleStatusUpdate(appointment._id, 'CONFIRMED')}
															className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
															title="Confirm"
														>
															<CheckCircle size={18} />
														</button>
														<button 
															onClick={() => handleStatusUpdate(appointment._id, 'CANCELLED')}
															className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
															title="Reject"
														>
															<XCircle size={18} />
														</button>
													</>
												)}
												{appointment.status === 'CONFIRMED' && (
													<button 
														onClick={() => handleStatusUpdate(appointment._id, 'COMPLETED')}
														className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 text-xs font-bold uppercase tracking-widest"
													>
														Mark Complete
													</button>
												)}
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center gap-2 py-8">
											<Search size={40} className="text-slate-200" />
											<p className="text-slate-400 font-medium italic">No appointments found matching your criteria</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[1000px]">
					<thead className="bg-slate-50">
						<tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
							<th className="px-6 py-3">Patient</th>
							<th className="px-6 py-3">Requested Date</th>
							<th className="px-6 py-3">Requested Time</th>
							<th className="px-6 py-3">Type</th>
							<th className="px-6 py-3">Reason</th>
							<th className="px-6 py-3">Status</th>
							<th className="px-6 py-3 text-center">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{loading ? (
							<tr>
								<td colSpan="7" className="px-6 py-10 text-center text-sm text-slate-500">
									Loading appointment requests...
								</td>
							</tr>
						) : (
							filteredAppointments.map((appointment) => (
							<tr key={appointment.id} className="hover:bg-slate-50/60 transition-colors">
								<td className="px-6 py-4">
									<div>
										<p className="font-semibold text-slate-800">{appointment.patientName}</p>
										<p className="text-xs text-slate-500">Requested by patient</p>
									</div>
								</td>
								<td className="px-6 py-4 text-sm text-slate-600">{appointment.requestedDate}</td>
								<td className="px-6 py-4 text-sm text-slate-600">{appointment.requestedTime}</td>
								<td className="px-6 py-4 text-sm text-slate-600">{appointment.appointmentType}</td>
								<td className="px-6 py-4 text-sm text-slate-600 max-w-[280px]">
									<div className="flex items-start gap-2">
										<MessageSquare size={16} className="mt-0.5 text-slate-400 shrink-0" />
										<span>{appointment.reason}</span>
									</div>
								</td>
								<td className="px-6 py-4">
									<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status] || "bg-slate-100 text-slate-700"}`}>
										{formatStatusLabel(appointment.status)}
									</span>
								</td>
								<td className="px-6 py-4">
									<div className="flex justify-center gap-2">
										<button
											onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}
											disabled={appointment.status !== "PENDING"}
											className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Accept
										</button>
										<button
											onClick={() => updateAppointmentStatus(appointment.id, "CANCELLED")}
											disabled={appointment.status !== "PENDING"}
											className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Reject
										</button>
									</div>
								</td>
							</tr>
							))
						)}
						{!loading && filteredAppointments.length === 0 && (
							<tr>
								<td colSpan="7" className="px-6 py-10 text-center text-sm text-slate-500">
									No appointment requests found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			</div>
		</div>
	);
}
