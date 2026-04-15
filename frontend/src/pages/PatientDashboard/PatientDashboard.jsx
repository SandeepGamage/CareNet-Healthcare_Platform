import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PatientProfile from "./PatientProfile/PatientProfile";
import MedicalRecordsTab from "./MedicalRecords/MedicalRecordsTab";
import PrescriptionsTab from "./Prescriptions/PrescriptionsTab";

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
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedAppt, setExpandedAppt] = useState(null);
    const [payingAppt, setPayingAppt] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [appointmentsData, setAppointmentsData] = useState([]);
    const [paymentsData, setPaymentsData] = useState([]);

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

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
            fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
        }}>
            {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
            {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
            <Navbar
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "20px",
                        }}>
                            💙
                        </div>
                        <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>CareNet</span>
                    </div>
                }
                userProfile={{
                    name: userProfile.name,
                    email: userProfile.email,
                    avatar: userProfile.avatar,
                    role: 'Patient',
                    id: userProfile.patientId
                }}
            >
                <div style={{ display: "flex", gap: "8px" }}>
                    {["overview", "appointments", "vitals", "prescriptions", "payments", "profile"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "8px 16px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: activeTab === tab ? "#3b82f6" : "#6b7280",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                borderBottom: activeTab === tab ? "2px solid #3b82f6" : "none",
                                transition: "all 0.2s",
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </Navbar>

            {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
            <div style={{
                display: "flex",
                minHeight: "calc(100vh - 72px)",
            }}>
                {/* Sidebar */}
                <aside style={{
                    width: sidebarOpen ? "280px" : "0px",
                    background: "linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)",
                    color: "white",
                    padding: sidebarOpen ? "24px" : "0px",
                    borderRight: sidebarOpen ? "1px solid #2563eb" : "none",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    boxShadow: sidebarOpen ? "4px 0 16px rgba(37,99,235,0.25)" : "none",
                }}>
                    {/* Quick Links */}
                    {sidebarOpen && (
                        <div>
                            <p style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.6)",
                                margin: "0 0 16px 0",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}>
                                Menu
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
                                {[
                                    { icon: "📊", label: "Dashboard", tab: "overview" },
                                    { icon: "📅", label: "Appointments", tab: "appointments" },
                                    { icon: "📋", label: "Medical Records", tab: "vitals" },
                                    { icon: "💊", label: "Prescriptions", tab: "prescriptions" },
                                    { icon: "💳", label: "Payment History", tab: "payments" },
                                    { icon: "👤", label: "Profile", tab: "profile" },
                                    { icon: "⚙️", label: "Settings", tab: "settings" },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(item.tab)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            background: activeTab === item.tab ? "rgba(255, 255, 255, 0.2)" : "transparent",
                                            border: activeTab === item.tab ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
                                            borderRadius: "10px",
                                            color: "white",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!item.active) {
                                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!item.active) {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", marginBottom: "24px" }} />

                            {/* Support Section */}
                            <p style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#9ca3af",
                                margin: "0 0 16px 0",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}>
                                Support
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
                                {[
                                    { icon: "❓", label: "Help Center" },
                                    { icon: "💬", label: "Message Doctor" },
                                    { icon: "📲", label: "Download App" },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            background: "transparent",
                                            border: "1px solid transparent",
                                            borderRadius: "10px",
                                            color: "#d1d5db",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                            e.currentTarget.style.color = "white";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "#d1d5db";
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* User Profile at Bottom */}
                            <div style={{
                                marginTop: "auto",
                                paddingTop: "24px",
                                borderTop: "1px solid #374151",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                    }}>
                                    <img src={userProfile.avatar} alt="Profile" style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        objectFit: "cover",
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: "13px", fontWeight: 600, margin: "0", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {userProfile.name}
                                        </p>
                                        <p style={{ fontSize: "11px", margin: "2px 0 0 0", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {userProfile.email}
                                        </p>
                                        <p style={{ fontSize: "11px", margin: "2px 0 0 0", color: "rgba(255,255,255,0.4)" }}>
                                            {userProfile.phone}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.href = "/login";
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "10px 16px",
                                        marginTop: "12px",
                                        background: "transparent",
                                        border: "1px solid #4b5563",
                                        borderRadius: "8px",
                                        color: "#d1d5db",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                        e.currentTarget.style.borderColor = "#ef4444";
                                        e.currentTarget.style.color = "#fca5a5";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderColor = "#4b5563";
                                        e.currentTarget.style.color = "#d1d5db";
                                    }}>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <main style={{
                    flex: 1,
                    padding: "40px",
                    maxWidth: "1400px",
                    width: "100%",
                    overflow: "auto",
                }}>

                    {/* Header */}
                    <div style={{ marginBottom: "40px" }}>
                        <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
                            Welcome back, {userProfile.name.split(" ")[0]}
                        </h1>
                        <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
                            Here's your health summary for this week
                        </p>
                    </div>

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
                            <div style={{ marginBottom: "24px" }}>
                                <button
                                    onClick={() => navigate("/book-appointment")}
                                    style={{
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}>
                                    + Book New Appointment
                                </button>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                                gap: "24px",
                            }}>
                                {appointmentsData.length === 0 ? (
                                    <div style={{
                                        gridColumn: "1 / -1",
                                        padding: "80px 40px",
                                        textAlign: "center",
                                        background: "white",
                                        borderRadius: "20px",
                                        border: "2px dashed #e5e7eb",
                                        color: "#6b7280"
                                    }}>
                                        <p style={{ fontSize: "48px", margin: "0 0 24px 0" }}>📅</p>
                                        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>No upcoming appointments</h3>
                                        <p style={{ fontSize: "16px", margin: 0 }}>You don't have any appointments scheduled at the moment.</p>
                                    </div>
                                ) : (
                                    appointmentsData.map((appt) => (
                                        <div
                                            key={appt.id}
                                            onClick={() => {
                                                if (expandedAppt !== appt.id) {
                                                    setExpandedAppt(appt.id);
                                                    setPayingAppt(null);
                                                } else {
                                                    setExpandedAppt(null);
                                                }
                                            }}
                                            style={{
                                                background: "white",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "16px",
                                                padding: "24px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                boxShadow: expandedAppt === appt.id ? "0 10px 25px rgba(0,0,0,0.1)" : "none",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (expandedAppt !== appt.id) {
                                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (expandedAppt !== appt.id) {
                                                    e.currentTarget.style.boxShadow = "none";
                                                }
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                                                <img src={appt.avatar} alt={appt.doctor} style={{
                                                    width: "56px",
                                                    height: "56px",
                                                    borderRadius: "12px",
                                                    objectFit: "cover",
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>
                                                        {appt.doctor}
                                                    </h4>
                                                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                                                        {appt.specialty}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    background: appt.statusColor || "#3b82f6",
                                                    color: "white",
                                                    padding: "6px 12px",
                                                    borderRadius: "6px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                }}>
                                                    {appt.status}
                                                </span>
                                            </div>

                                            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                                    <div>
                                                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>Date</p>
                                                        <p style={{ fontSize: "14px", color: "#111827", fontWeight: 500, margin: 0 }}>{appt.date}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>Time</p>
                                                        <p style={{ fontSize: "14px", color: "#111827", fontWeight: 500, margin: 0 }}>{appt.time}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>Type</p>
                                                    <p style={{ fontSize: "14px", color: "#111827", fontWeight: 500, margin: 0 }}>{appt.type}</p>
                                                </div>
                                            </div>

                                            {expandedAppt === appt.id && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        marginTop: "16px",
                                                        paddingTop: "16px",
                                                        borderTop: "1px solid #f3f4f6",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "12px",
                                                    }}>
                                                    <div style={{ display: "flex", gap: "12px" }}>
                                                        <button style={{
                                                            flex: 1,
                                                            padding: "10px",
                                                            background: "#f3f4f6",
                                                            color: "#374151",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontSize: "14px",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}>
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
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
                                                                background: payment.status === 'success' ? '#d1fae5' : payment.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                                                color: payment.status === 'success' ? '#065f46' : payment.status === 'pending' ? '#92400e' : '#991b1b',
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
                                                            {payment.status === 'success' && payment.invoiceId ? (
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
                                                                        transition: "all 0.2s"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = "#eff6ff";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "transparent";
                                                                    }}
                                                                >
                                                                    ⬇ Download
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#9ca3af" }}>-</span>
                                                            )}
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
                </main>
            </div>
        </div>
    );
}
