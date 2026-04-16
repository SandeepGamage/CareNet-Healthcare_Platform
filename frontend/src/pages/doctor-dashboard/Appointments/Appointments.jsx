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
	History,
	Video,
	MapPin,
	Activity,
	FileText,
	AlertTriangle,
	ArrowRight
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export default function Appointments() {
	// --- State ---
	const [appointments, setAppointments] = useState([]);
	const [doctor, setDoctor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("17:00");
	const [hoursMessage, setHoursMessage] = useState("");
	const [savingHours, setSavingHours] = useState(false);
	
	const [sortField, setSortField] = useState("appointmentDate");
	const [sortDirection, setSortDirection] = useState("asc");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectionInput, setShowRejectionInput] = useState(false);

	// --- Initialization ---
	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			await Promise.all([fetchDoctorProfile(), fetchAppointments()]);
		} catch (error) {
			console.error("Initialization error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchDoctorProfile = async () => {
		try {
			const token = localStorage.getItem("token");
			// Using /me endpoint is more secure and doesn't rely on local user state
			const response = await axios.get(`${API_BASE_URL}/doctors/profile/me`, {
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
			// Backend usually returns the array directly or in response.data.data
			const data = response.data?.success ? response.data.data : response.data;
			setAppointments(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching appointments:", error);
		}
	};

	const handleSaveAvailableHours = async () => {
		if (startTime >= endTime) {
			setHoursMessage("Start time must be strictly earlier than End time.");
			return;
		}

		const hoursString = `${startTime}-${endTime}`;
		
		try {
			setSavingHours(true);
			setHoursMessage("");
			const token = localStorage.getItem("token");
			// Use the dedicated PATCH /me/available-hours endpoint
			const response = await axios.patch(`${API_BASE_URL}/doctors/profile/me/available-hours`, 
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

	const handleStatusUpdate = async (id, status, cancelReason = "") => {
		try {
			setIsActionLoading(true);
			const token = localStorage.getItem("token");
			const response = await axios.patch(`${API_BASE_URL}/appointments/${id}/status`, 
				{ status, cancelReason },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			
			if (response.status === 200 || response.data?.success) {
				await fetchAppointments();
				// If we updated the currently selected one, close modal or update it
				if (selectedAppointment && selectedAppointment._id === id) {
					// For completion/cancellation, closing is often cleaner
					if (status === 'COMPLETED' || status === 'CANCELLED') {
						setSelectedAppointment(null);
						setShowRejectionInput(false);
						setRejectionReason("");
					} else {
						// For acceptance, just update status
						setSelectedAppointment({ ...selectedAppointment, status });
					}
				}
			}
		} catch (error) {
			console.error(`Error updating appointment to ${status}:`, error);
			const msg = error.response?.data?.message || `Failed to update appointment status to ${status}.`;
			alert(msg);
		} finally {
			setIsActionLoading(false);
		}
	};

	// --- Filtering & Sorting ---
	const handleSort = (field) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const getSortedData = (data) => {
		return [...data].sort((a, b) => {
			let valA, valB;
			switch (sortField) {
				case "patientName":
					valA = a.patientName?.toLowerCase() || "";
					valB = b.patientName?.toLowerCase() || "";
					break;
				case "status":
					valA = a.status?.toLowerCase() || "";
					valB = b.status?.toLowerCase() || "";
					break;
				case "appointmentDate":
					valA = new Date(a.appointmentDate).getTime();
					valB = new Date(b.appointmentDate).getTime();
					break;
				case "timeSlot":
				default:
					valA = a.timeSlot || "";
					valB = b.timeSlot || "";
					break;
			}
			if (valA < valB) return sortDirection === "asc" ? -1 : 1;
			if (valA > valB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
	};

	const filteredAppointments = appointments.filter((item) => {
		const query = searchQuery.toLowerCase().trim();
		const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
		
		if (!matchesStatus) return false;
		if (!query) return true;
		
		return (
			item.patientName?.toLowerCase().includes(query) ||
			item.appointmentId?.toLowerCase().includes(query) ||
			item.reason?.toLowerCase().includes(query) ||
			item.status?.toLowerCase().includes(query)
		);
	});

	const processedAppointments = getSortedData(filteredAppointments);

	const totalRequests = appointments.length;
	const pendingRequests = appointments.filter(a => a.status === "PENDING").length;
	const confirmedRequests = appointments.filter(a => a.status === "CONFIRMED").length;

	const SortIcon = ({ columnKey }) => {
		if (sortField !== columnKey) return <ArrowUpDown size={14} className="opacity-30" />;
		return <ArrowUpDown size={14} className={sortDirection === "asc" ? "opacity-100" : "opacity-50 rotate-180"} />;
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-50">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="w-10 h-10 animate-spin text-blue-600" />
					<p className="text-slate-500 font-medium">Loading appointments dashboard...</p>
				</div>
			</div>
		);
	}

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
								className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:bg-blue-300 shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
							>
								{savingHours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
								Apply Hours
							</button>
						</div>
						{hoursMessage && (
							<p className={`mt-3 text-xs font-semibold flex items-center gap-1 ${hoursMessage.includes("successfully") ? "text-emerald-600" : "text-rose-500"}`}>
								{hoursMessage.includes("successfully") ? <Check size={14} /> : <AlertCircle size={14} />}
								{hoursMessage}
							</p>
						)}
					</div>

					<div className="mt-6 pt-6 border-t border-slate-100">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Time Slots</h3>
							<span className="text-[10px] text-slate-400 font-medium italic underline underline-offset-4 decoration-blue-200">Refreshed Daily at 00:00 AM</span>
						</div>
						<div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
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

			{/* Queue Table */}
			<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

					<div className="flex flex-col md:flex-row items-center gap-4 flex-1">
						<div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
							{["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
								<button
									key={status}
									onClick={() => setStatusFilter(status)}
									className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
										statusFilter === status 
											? "bg-white text-blue-600 shadow-sm" 
											: "text-slate-500 hover:text-slate-700"
									}`}
								>
									{status}
								</button>
							))}
						</div>

						<div className="relative flex-1 max-w-md ml-auto">
							<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								type="text"
								placeholder="Search patient, ID, or reason..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
							/>
							{searchQuery && (
								<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={16} /></button>
							)}
						</div>
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
									<tr 
										key={appointment._id} 
										onClick={() => setSelectedAppointment(appointment)}
										className="hover:bg-slate-50/50 transition-all group cursor-pointer"
									>
										<td className="px-6 py-5">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
													{appointment.patientName?.charAt(0)}
												</div>
												<div>
													<p className="text-sm font-bold text-slate-800">{appointment.patientName}</p>
													<p className="text-[10px] text-slate-500 font-mono">ID: {appointment.appointmentId || appointment._id?.slice(-8).toUpperCase()}</p>
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
										<td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
											<div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
												{appointment.status === 'PENDING' && (
													<>
														<button 
															onClick={(e) => {
																e.stopPropagation();
																handleStatusUpdate(appointment._id, 'CONFIRMED');
															}}
															className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 shadow-sm transition-all active:scale-90"
															title="Accept"
														>
															<CheckCircle size={18} />
														</button>
														<button 
															onClick={(e) => {
																e.stopPropagation();
																setSelectedAppointment(appointment);
																setShowRejectionInput(true);
															}}
															className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 shadow-sm transition-all active:scale-90"
															title="Reject"
														>
															<XCircle size={18} />
														</button>
													</>
												)}
												{appointment.status === 'CONFIRMED' && (
													<button 
														onClick={(e) => {
															e.stopPropagation();
															handleStatusUpdate(appointment._id, 'COMPLETED');
														}}
														className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
													>
														Complete
													</button>
												)}
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-12 text-center">
										<div className="flex flex-col items-center gap-2">
											<Search size={40} className="text-slate-200" />
											<p className="text-slate-400 font-medium italic">No appointments found matching your criteria</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Appointment Details Modal */}
			{selectedAppointment && (
				<div 
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
					onClick={() => {
						if (!isActionLoading) {
							setSelectedAppointment(null);
							setShowRejectionInput(false);
							setRejectionReason("");
						}
					}}
				>
					<div 
						className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="relative h-40 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
							<button 
								onClick={() => {
									setSelectedAppointment(null);
									setShowRejectionInput(false);
									setRejectionReason("");
								}}
								className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
							>
								<X size={20} />
							</button>
							
							<div className="flex items-center gap-6 mt-4">
								<div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-blue-600 font-black text-3xl border-[6px] border-white/20 transition-transform hover:scale-105 duration-300">
									{selectedAppointment.patientName?.charAt(0)}
								</div>
								<div className="text-white">
									<h2 className="text-2xl font-black tracking-tight">{selectedAppointment.patientName}</h2>
									<div className="flex flex-col gap-1 mt-1">
										<p className="text-blue-100 text-xs font-bold opacity-80 flex items-center gap-2">
											<Activity size={12} className="text-blue-300" />
											ID: {selectedAppointment.appointmentId || selectedAppointment._id?.slice(-8).toUpperCase()}
										</p>
										<p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Patient Portal Linked</p>
									</div>
								</div>
							</div>
						</div>

						{/* Modal Content */}
						<div className="px-8 pt-10 pb-8">
							{!showRejectionInput ? (
								<>
									<div className="grid grid-cols-2 gap-8 mb-10">
										<div className="space-y-2">
											<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Schedule</p>
											<div className="flex items-center gap-3 text-slate-700 font-bold">
												<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
													<Calendar size={16} />
												</div>
												<span className="text-sm">{new Date(selectedAppointment.appointmentDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
											</div>
										</div>
										<div className="space-y-2">
											<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Slot</p>
											<div className="flex items-center gap-3 text-slate-700 font-bold">
												<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
													<Clock3 size={16} />
												</div>
												<span className="text-sm tracking-tight">{selectedAppointment.timeSlot}</span>
											</div>
										</div>
										<div className="space-y-2">
											<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</p>
											<div className="flex items-center gap-2">
												<span className={`inline-flex rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${statusStyles[selectedAppointment.status] || "bg-slate-100"}`}>
													{selectedAppointment.status}
												</span>
											</div>
										</div>
										<div className="space-y-2">
											<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Symptom Type</p>
											<div className="flex items-center gap-3 text-slate-700 font-bold">
												<div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedAppointment.type === 'TELEMEDICINE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
													{selectedAppointment.type === 'TELEMEDICINE' ? <Video size={16} /> : <MapPin size={16} />}
												</div>
												<span className="text-sm capitalize">{selectedAppointment.type?.toLowerCase().replace('_', ' ')}</span>
											</div>
										</div>
									</div>

									<div className="mb-10">
										<div className="flex items-center gap-2 mb-3">
											<FileText size={14} className="text-slate-400" />
											<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reason & Clinical Notes</p>
										</div>
										<div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100/80 relative group overflow-hidden">
											<div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
											<p className="italic text-slate-600 text-sm leading-relaxed relative z-10">
												"{selectedAppointment.reason || "The patient is seeking a general health consultation and routine checkup for preventive care."}"
											</p>
										</div>
									</div>

									{/* Quick Actions */}
									<div className="flex gap-4">
										{selectedAppointment.status === 'PENDING' && (
											<>
												<button 
													disabled={isActionLoading}
													onClick={() => handleStatusUpdate(selectedAppointment._id, 'CONFIRMED')}
													className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
												>
													{isActionLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
													Accept Request
												</button>
												<button 
													disabled={isActionLoading}
													onClick={() => setShowRejectionInput(true)}
													className="px-6 h-14 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all border border-rose-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
												>
													<XCircle size={20} />
													Reject
												</button>
											</>
										)}
										{selectedAppointment.status === 'CONFIRMED' && (
											<button 
												disabled={isActionLoading}
												onClick={() => handleStatusUpdate(selectedAppointment._id, 'COMPLETED')}
												className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
											>
												{isActionLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
												Mark as Completed
											</button>
										)}
										{(selectedAppointment.status === 'CANCELLED' || selectedAppointment.status === 'COMPLETED') && (
											<button 
												onClick={() => setSelectedAppointment(null)}
												className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
											>
												Close Profile
											</button>
										)}
									</div>
								</>
							) : (
								<div className="animate-in slide-in-from-right-4 duration-300">
									<div className="flex items-center gap-3 mb-6">
										<button 
											onClick={() => setShowRejectionInput(false)}
											className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
										>
											<ArrowRight size={20} className="rotate-180" />
										</button>
										<h3 className="text-lg font-black text-slate-800 tracking-tight">Reject Appointment</h3>
									</div>

									<div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
										<AlertTriangle className="text-amber-600 shrink-0" size={20} />
										<p className="text-[11px] text-amber-700 font-bold leading-relaxed">
											Please provide a reason for the rejection. This message will be sent to the patient to help them understand the decision.
										</p>
									</div>

									<textarea
										placeholder="e.g. Unforeseen schedule conflict, please choose another slot..."
										value={rejectionReason}
										onChange={(e) => setRejectionReason(e.target.value)}
										className="w-full h-32 rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all mb-6 placeholder:text-slate-300"
									/>

									<div className="flex gap-4">
										<button 
											disabled={isActionLoading || !rejectionReason.trim()}
											onClick={() => handleStatusUpdate(selectedAppointment._id, 'CANCELLED', rejectionReason)}
											className="flex-1 h-14 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:active:scale-100"
										>
											{isActionLoading ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
											Confirm Rejection
										</button>
										<button 
											onClick={() => setShowRejectionInput(false)}
											disabled={isActionLoading}
											className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
										>
											Cancel
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
