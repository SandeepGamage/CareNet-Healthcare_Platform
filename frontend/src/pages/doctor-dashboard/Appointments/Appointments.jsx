import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, CheckCircle, XCircle, Clock3, User, MessageSquare, ArrowUpDown, Search, X } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

const statusStyles = {
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
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [sortField, setSortField] = useState("requestedDate");
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

	const handleSort = (field) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const sortAppointments = (appointments) => {
		const sorted = [...appointments].sort((a, b) => {
			let compareA, compareB;

			switch (sortField) {
				case "patientName":
					compareA = a.patientName.toLowerCase();
					compareB = b.patientName.toLowerCase();
					break;
				case "patientId":
					compareA = a.patientId.toLowerCase();
					compareB = b.patientId.toLowerCase();
					break;
				case "appointmentType":
					compareA = a.appointmentType.toLowerCase();
					compareB = b.appointmentType.toLowerCase();
					break;
				case "status":
					compareA = a.status.toLowerCase();
					compareB = b.status.toLowerCase();
					break;
				case "requestedDate":
					compareA = new Date(a.requestedDate);
					compareB = new Date(b.requestedDate);
					break;
				case "requestedTime":
				default:
					compareA = a.requestedTime;
					compareB = b.requestedTime;
					break;
			}

			if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
			if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	};

	const sortedAppointments = sortAppointments(appointments);
	const SortIcon = ({ columnKey }) => {
		if (sortField !== columnKey) {
			return <ArrowUpDown size={14} className="opacity-30" />;
		}
		return <ArrowUpDown size={14} className={sortDirection === "asc" ? "opacity-100" : "opacity-50 rotate-180"} />;
	};

	const filterAppointments = (appointments) => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		if (!normalizedQuery) {
			return appointments;
		}

		return appointments.filter((appointment) => {
			return (
				appointment.patientName.toLowerCase().includes(normalizedQuery) ||
				appointment.patientId.toLowerCase().includes(normalizedQuery) ||
				appointment.appointmentType.toLowerCase().includes(normalizedQuery) ||
				appointment.reason.toLowerCase().includes(normalizedQuery) ||
				appointment.status.toLowerCase().includes(normalizedQuery)
			);
		});
	};

	const filteredAppointments = filterAppointments(sortedAppointments);

	const totalRequests = appointments.length;
	const pendingRequests = appointments.filter((appointment) => appointment.status === "PENDING").length;
	const confirmedRequests = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;

	return (
		<div className="p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
				<p className="mt-1 text-sm text-slate-600">Requested appointments sent by patients</p>
				{errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
							<Calendar size={20} />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Requests</p>
							<h3 className="text-xl font-bold text-slate-800">{totalRequests}</h3>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
							<Clock3 size={20} />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
							<h3 className="text-xl font-bold text-slate-800">{pendingRequests}</h3>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
							<CheckCircle size={20} />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed</p>
							<h3 className="text-xl font-bold text-slate-800">{confirmedRequests}</h3>
						</div>
					</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-100 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
							<User size={18} />
						</div>
						<div>
							<h2 className="text-lg font-bold text-slate-800">Requested Appointments</h2>
							<p className="text-xs text-slate-500">Review and manage the patient requests below</p>
						</div>
					</div>
				</div>

				<div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
				<div className="flex items-center justify-between gap-4 mb-4">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort by:</span>
						<div className="flex gap-2 flex-wrap">
							<button
								onClick={() => handleSort("patientName")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "patientName"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								Patient <SortIcon columnKey="patientName" />
							</button>
							<button
								onClick={() => handleSort("requestedDate")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "requestedDate"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								Date <SortIcon columnKey="requestedDate" />
							</button>
							<button
								onClick={() => handleSort("requestedTime")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "requestedTime"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								Time <SortIcon columnKey="requestedTime" />
							</button>
							<button
								onClick={() => handleSort("status")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "status"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								Status <SortIcon columnKey="status" />
							</button>
							<button
								onClick={() => handleSort("appointmentType")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "appointmentType"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								Type <SortIcon columnKey="appointmentType" />
							</button>
							<button
								onClick={() => handleSort("patientId")}
								className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
									sortField === "patientId"
										? "bg-blue-100 text-blue-700"
										: "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
								}`}
							>
								ID <SortIcon columnKey="patientId" />
							</button>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="relative flex-1 max-w-md">
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search by patient name, ID, type, reason, or status..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
							>
								<X size={16} />
							</button>
						)}
					</div>
				</div>
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
