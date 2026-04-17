import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    Calendar,
    DollarSign,
    Download,
    Eye,
    FileText,
    HeartPulse,
    Home,
    Info,
    LogOut,
    Menu,
    Settings,
    Trash2,
    User,
    Users,
    Video,
    X,
} from "lucide-react";
// Render a local header instead of the shared Navbar
import PatientProfile from "./PatientProfile/PatientProfile";
import MedicalRecordsTab from "./MedicalRecords/MedicalRecordsTab";
import PrescriptionsTab from "./Prescriptions/PrescriptionsTab";
import TelemedicineTab from "../../components/telemedicine/TelemedicineTab";
import ViewAppointments from "./Appointments/viewAppointments";

// ── Mini Sparkline Chart ───────────────────────────────────────────────────────
function MiniChart({ data, color = "#3b82f6" }) {
    const w = 160, h = 50, pad = 6;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => ({
        x: pad + (i / (data.length - 1)) * (w - pad * 2),
        y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }));
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="50" style={{ marginTop: "12px" }}>
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`} fill="url(#grad)" />
        </svg>
    );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data }) {
    const r = 60, cx = 70, cy = 70, stroke = 22;
    const circ = 2 * Math.PI * r;
    const total = data.reduce((s, x) => s + x.value, 0);
    let offset = 0;

    return (
        <svg viewBox="0 0 140 140" width="140" height="140">
            {data.map(({ value, color }, i) => {
                const pct = value / total;
                const dash = pct * circ;
                const gap = circ - dash;
                const el = (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
                        strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
                        transform={`rotate(-90 ${cx} ${cy})`} />
                );
                offset += dash;
                return el;
            })}
            <circle cx={cx} cy={cy} r={r - stroke / 2 - 3} fill="white" />
        </svg>
    );
}

// ── Stat Card Component ────────────────────────────────────────────────────────
function StatCard({ label, value, change, changeType = "up", icon, color = "#3b82f6" }) {
    return (
        <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "28px",
            textAlign: "center",
        }}>
            <p style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, margin: "0 0 12px 0", letterSpacing: "0.5px" }}>
                {label}
            </p>
            <p style={{ fontSize: "42px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
                {value}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: changeType === "up" ? "#10b981" : "#ef4444" }}>
                    {changeType === "up" ? "↑" : "↓"} {change}
                </span>
            </div>
            {icon && <div style={{ fontSize: "32px", marginTop: "12px" }}>{icon}</div>}
        </div>
    );
}

// ── Data ───────────────────────────────────────────────────────────────────────
const appointments = [];

const healthMetrics = [
    { label: "Heart Rate", value: "--", unit: "bpm", icon: "❤️" },
    { label: "Blood Pressure", value: "--", unit: "mmHg", icon: "📊" },
    { label: "Temperature", value: "--", unit: "°F", icon: "🌡️" },
    { label: "Oxygen Level", value: "--", unit: "SpO2", icon: "🫁" },
];

const appointmentChartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const healthScoreData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export default function ModernPatientDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [appointmentsData, setAppointmentsData] = useState([]);
    const [paymentsData, setPaymentsData] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [userProfile, setUserProfile] = useState(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const u = JSON.parse(stored);
                return {
                    name: u.name || "User",
                    patientId: u.id ? `#${u.id.slice(-4).toUpperCase()}` : "#0000",
                    email: u.email || "",
                    phone: u.phone || "Not set",
                    avatar: u.profilePicture || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`
                };
            } catch (error) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
        return {
            name: "Alex Johnson",
            patientId: "#8291",
            email: "alex.johnson@example.com",
            phone: "+1 555-0198",
            avatar: "https://i.pravatar.cc/150?u=alex"
        };
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                // Using auth-service at port 3001
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json(); // data = { success: true, user }
                    const u = data.user;
                    setUserProfile(prev => ({
                        ...prev,
                        name: u.name || prev.name,
                        email: u.email || prev.email,
                        phone: u.phone || prev.phone,
                        avatar: u.profilePicture || prev.avatar,
                        patientId: u._id ? `#${u._id.slice(-4).toUpperCase()}` : prev.patientId
                    }));
                }
            } catch (err) {
                console.log("Profile backend unreachable");
            }
        };

        const fetchAppointments = async () => {
            try {
                const token = localStorage.getItem("token");
                // Using appointment-service at port 3004
                const response = await fetch("http://localhost:3004/api/appointments/my", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Assuming data is an array of appointments [ { _id, doctorName, specialty, ... } ]
                    const formatted = data.map(app => ({
                        id: app._id,
                        doctor: app.doctorName,
                        specialty: app.specialty,
                        date: new Date(app.appointmentDate).toLocaleDateString(),
                        time: app.timeSlot,
                        status: app.status,
                        statusColor: app.status === 'CONFIRMED' ? '#10b981' : (app.status === 'PENDING' ? '#f59e0b' : '#ef4444'),
                        avatar: `https://ui-avatars.com/api/?name=${app.doctorName}&background=random`,
                        type: app.type || "In-Person"
                    }));
                    setAppointmentsData(formatted);
                }
            } catch (err) {
                console.log("Appointment service unreachable");
            }
        };

        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:3005/api/payments/history", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setPaymentsData(data.data);
                    }
                }
            } catch (err) {
                console.log("Payment service unreachable");
            }
        };

        fetchProfile();
        fetchAppointments();
        fetchPayments();
    }, []);

    const handleDeletePayment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this payment record from your history? This action cannot be undone.")) return;
        
        try {
            setIsDeleting(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3005/api/payments/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPaymentsData(prev => prev.filter(p => p._id !== id));
            } else {
                alert("Failed to delete record.");
            }
        } catch (err) {
            alert("Error connecting to payment service.");
        } finally {
            setIsDeleting(false);
        }
    };

    const openViewModal = (payment) => {
        setSelectedPayment(payment);
        setIsViewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex font-sans">
            <aside className={`${sidebarOpen ? "w-72" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50`}>
                <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-md">
                        <HeartPulse className="text-white w-5 h-5" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                Care<span className="text-blue-600">Net</span>
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">Healthcare Platform</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {[
                        { id: "profile", icon: Users, label: "Profile" },
                        { id: "appointments", icon: Calendar, label: "Appointments" },
                        { id: "telemedicine", icon: Video, label: "Telemedicine" },
                        { id: "vitals", icon: Activity, label: "Medical Records" },
                        { id: "prescriptions", icon: FileText, label: "Prescriptions" },
                        { id: "payments", icon: DollarSign, label: "Payment History" },
                        { id: "settings", icon: Settings, label: "Settings" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                                activeTab === item.id
                                    ? "bg-linear-to-r from-teal-600 to-blue-600 text-white shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-slate-400"} />
                            {sidebarOpen && <span className="font-semibold text-[15px]">{item.label}</span>}
                            {activeTab === item.id && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                    ))}
                </nav>

                <div className="py-2 px-3 border-t border-slate-100 mb-2">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate("/login");
                        }}
                        className="w-full flex items-center gap-3 py-2.5 px-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="font-semibold text-[15px]">Logout</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title="Toggle Sidebar"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="text-xl font-bold text-slate-800">Welcome, {userProfile.name}</div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => navigate("/")}
                            title="Home"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-linear-to-r from-teal-600 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer"
                        >
                            <Home size={18} className="text-white" />
                            <span>Home</span>
                        </button>
                    </div>
                </div>

                <div style={{
                    padding: activeTab === "profile" ? "0" : "40px",
                    maxWidth: activeTab === "profile" ? "100%" : "1400px",
                    width: "100%",
                    overflow: "auto",
                }}>

                    {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
                    {activeTab === "overview" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            {/* Key Stats Grid */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "24px",
                                marginBottom: "40px",
                            }}>
                                <StatCard
                                    label="Next Appointment"
                                    value={appointmentsData.length > 0 ? appointmentsData[0].date : "None"}
                                    change={appointmentsData.length > 0 ? "Confirmed" : "No upcoming"}
                                    changeType="up"
                                    icon="📅"
                                />
                                <StatCard label="Health Score" value="--" change="Not enough data" changeType="up" icon="⭐" />
                                <StatCard label="Total Visits" value="0" change="New Patient" changeType="up" icon="🏥" />
                                <StatCard label="Medications" value="0" change="None active" changeType="up" icon="💊" />
                            </div>

                            {/* Charts Section */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                                gap: "24px",
                                marginBottom: "40px",
                            }}>
                                {/* Appointments Chart */}
                                <div style={{
                                    background: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "16px",
                                    padding: "28px",
                                }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>
                                        Monthly Appointments
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px 0" }}>
                                        No recent activity
                                    </p>
                                    <MiniChart data={appointmentChartData} color="#3b82f6" />
                                </div>

                                {/* Health Score Chart */}
                                <div style={{
                                    background: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "16px",
                                    padding: "28px",
                                }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>
                                        Health Score Trend
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px 0" }}>
                                        Insufficient data
                                    </p>
                                    <MiniChart data={healthScoreData} color="#10b981" />
                                </div>

                                {/* Appointment Type Distribution */}
                                <div style={{
                                    background: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "16px",
                                    padding: "28px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0", width: "100%" }}>
                                        Visit Types
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 20px 0", width: "100%" }}>
                                        This year
                                    </p>
                                    <DonutChart data={[
                                        { value: 100, color: "#e5e7eb" },
                                    ]} />
                                    <div style={{ marginTop: "20px", width: "100%" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                                            <span style={{ width: "12px", height: "12px", background: "#e5e7eb", borderRadius: "3px" }} />
                                            <span style={{ fontSize: "14px", color: "#6b7280" }}>No data recorded</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Vitals */}
                            <div style={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "28px",
                                marginBottom: "40px",
                            }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 24px 0" }}>
                                    Current Vitals
                                </h3>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: "16px",
                                }}>
                                    {healthMetrics.map((metric, i) => (
                                        <div key={i} style={{
                                            background: "#f9fafb",
                                            borderRadius: "12px",
                                            padding: "16px",
                                            textAlign: "center",
                                        }}>
                                            <p style={{ fontSize: "24px", margin: "0 0 8px 0" }}>{metric.icon}</p>
                                            <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                {metric.label}
                                            </p>
                                            <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>
                                                {metric.value}
                                            </p>
                                            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0 0" }}>
                                                {metric.unit}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── APPOINTMENTS TAB ──────────────────────────────────────────── */}
                    {activeTab === "appointments" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <ViewAppointments />
                        </div>
                    )}

                    {/* ── TELEMEDICINE TAB ─────────────────────────────────────────── */}
                    {activeTab === "telemedicine" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <TelemedicineTab role="patient" />
                        </div>
                    )}

                    {/* ── VITALS TAB ─────────────────────────────────────────────────── */}
                    {activeTab === "vitals" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <MedicalRecordsTab />
                        </div>
                    )}

                    {/* ── PRESCRIPTIONS TAB ─────────────────────────────────────────── */}
                    {activeTab === "prescriptions" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <PrescriptionsTab />
                        </div>
                    )}

                    {/* ── PAYMENTS TAB ─────────────────────────────────────────────────── */}
                    {activeTab === "payments" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <div style={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "28px",
                            }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 24px 0" }}>
                                    Payment History
                                </h3>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                        <thead>
                                            <tr style={{ background: "#f9fafb", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Doctor</th>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Amount</th>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Invoice</th>
                                                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentsData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                                                        No payment history available.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paymentsData.map((payment) => (
                                                    <tr key={payment._id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                        <td style={{ padding: "16px", fontSize: "14px", color: "#111827" }}>
                                                            {new Date(payment.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                                                            {payment.metadata?.doctorName || 'Consultation'}
                                                        </td>
                                                        <td style={{ padding: "16px", fontSize: "14px", color: "#111827", fontWeight: 500 }}>
                                                            {payment.currency} {payment.amount.toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: "16px" }}>
                                                            <span style={{
                                                                background: payment.status === 'succeeded' ? '#d1fae5' : payment.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                                                color: payment.status === 'succeeded' ? '#065f46' : payment.status === 'pending' ? '#92400e' : '#991b1b',
                                                                padding: "4px 8px",
                                                                borderRadius: "4px",
                                                                fontSize: "12px",
                                                                fontWeight: 600,
                                                                textTransform: "capitalize"
                                                            }}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "16px" }}>
                                                            {payment.status === 'succeeded' && payment.invoiceId ? (
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            const res = await fetch(`http://localhost:3005/api/payments/invoices/${payment._id}`, {
                                                                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                                                                            });
                                                                            if (!res.ok) throw new Error();
                                                                            const blob = await res.blob();
                                                                            const url = window.URL.createObjectURL(blob);
                                                                            const a = document.createElement('a');
                                                                            a.href = url;
                                                                            a.download = `Invoice_${payment._id}.pdf`;
                                                                            document.body.appendChild(a);
                                                                            a.click();
                                                                            a.remove();
                                                                            window.URL.revokeObjectURL(url);
                                                                        } catch (err) {
                                                                            alert('Failed to download invoice. It might not be generated yet.');
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        background: "transparent",
                                                                        border: "1px solid #3b82f6",
                                                                        color: "#3b82f6",
                                                                        padding: "6px 12px",
                                                                        borderRadius: "6px",
                                                                        fontSize: "12px",
                                                                        fontWeight: 600,
                                                                        cursor: "pointer",
                                                                        transition: "all 0.2s",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "4px"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = "#eff6ff";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "transparent";
                                                                    }}
                                                                >
                                                                    <Download size={14} /> Invoice
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#9ca3af" }}>-</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "16px", textAlign: "right" }}>
                                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                                <button
                                                                    onClick={() => openViewModal(payment)}
                                                                    style={{
                                                                        background: "#f3f4f6",
                                                                        border: "none",
                                                                        color: "#374151",
                                                                        padding: "8px",
                                                                        borderRadius: "8px",
                                                                        cursor: "pointer",
                                                                        transition: "all 0.2s"
                                                                    }}
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment._id)}
                                                                    disabled={isDeleting}
                                                                    style={{
                                                                        background: "#fee2e2",
                                                                        border: "none",
                                                                        color: "#ef4444",
                                                                        padding: "8px",
                                                                        borderRadius: "8px",
                                                                        cursor: "pointer",
                                                                        transition: "all 0.2s",
                                                                        opacity: isDeleting ? 0.5 : 1
                                                                    }}
                                                                    title="Delete Record"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ── TRANSACTION VIEW MODAL ─────────────────────────────────────── */}
                    {isViewModalOpen && selectedPayment && (
                        <div style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            backdropFilter: "blur(4px)"
                        }}>
                            <div style={{
                                background: "white",
                                borderRadius: "20px",
                                width: "90%",
                                maxWidth: "500px",
                                padding: "32px",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Transaction Details</h3>
                                    <button
                                        onClick={() => setIsViewModalOpen(false)}
                                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f9fafb", borderRadius: "12px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Date & Time</p>
                                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f9fafb", borderRadius: "12px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Consultation with</p>
                                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>{selectedPayment.metadata?.doctorName || 'General Consultation'}</p>
                                            <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>{selectedPayment.metadata?.specialty || '-'}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f9fafb", borderRadius: "12px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            <DollarSign size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Amount Paid</p>
                                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>{selectedPayment.currency} {selectedPayment.amount.toFixed(2)}</p>
                                        </div>
                                        <div style={{
                                            background: selectedPayment.status === 'succeeded' ? '#d1fae5' : '#fef3c7',
                                            color: selectedPayment.status === 'succeeded' ? '#065f46' : '#92400e',
                                            padding: "4px 10px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            textTransform: "uppercase"
                                        }}>
                                            {selectedPayment.status}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f9fafb", borderRadius: "12px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                            <Info size={20} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Reference ID</p>
                                            <p style={{ fontSize: "13px", fontFamily: "monospace", color: "#111827", margin: 0 }}>{selectedPayment._id}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    style={{
                                        width: "100%",
                                        marginTop: "24px",
                                        padding: "12px",
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── SETTINGS TAB ──────────────────────────────────────────────── */}
                    {activeTab === "settings" && (
                        <div style={{ animation: "fadeIn 0.3s ease-in" }}>
                            <div style={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "40px",
                                maxWidth: "800px"
                            }}>
                                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>Account Settings</h1>
                                <p style={{ color: "#6b7280", margin: "0 0 32px 0" }}>Manage your account security and preferences</p>

                                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "32px" }}>
                                    <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>Danger Zone</h2>
                                    <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0" }}>
                                        Once you deactivate your account, you will be logged out. You can reactive it at any time by simply logging in again with your email and password.
                                    </p>

                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Are you sure you want to deactivate your account?")) {
                                                try {
                                                    const res = await fetch("http://localhost:3006/api/auth/deactivate", {
                                                        method: "POST",
                                                        headers: {
                                                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                                                        }
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(data.message);
                                                        localStorage.clear();
                                                        window.location.href = "/login";
                                                    } else {
                                                        alert("Deactivation failed: " + data.message);
                                                    }
                                                } catch (err) {
                                                    alert("Error connecting to server.");
                                                }
                                            }
                                        }}
                                        style={{
                                            padding: "12px 24px",
                                            background: "#fee2e2",
                                            color: "#dc2626",
                                            border: "1px solid #fecaca",
                                            borderRadius: "10px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#fecaca"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "#fee2e2"}
                                    >
                                        Deactivate Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PROFILE TAB ──────────────────────────────────────────────── */}
                    {activeTab === "profile" && <PatientProfile />}
                </div>
                </main>
        </div>
    );
}
