import { useState } from "react";

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
const appointments = [
  {
    id: 1,
    doctor: "Dr. Daniel Miller",
    specialty: "Cardiologist",
    type: "In-Person",
    date: "Apr 14, 2026",
    time: "09:30 AM",
    status: "Confirmed",
    statusColor: "#10b981",
    avatar: "https://i.pravatar.cc/150?u=doctor1",
  },
  {
    id: 2,
    doctor: "Dr. Sarah Wilson",
    specialty: "Dermatologist",
    type: "Telemedicine",
    date: "Apr 18, 2026",
    time: "11:00 AM",
    status: "Pending",
    statusColor: "#f59e0b",
    avatar: "https://i.pravatar.cc/150?u=doctor2",
  },
  {
    id: 3,
    doctor: "Dr. Robert James",
    specialty: "Neurologist",
    type: "In-Person",
    date: "May 02, 2026",
    time: "02:15 PM",
    status: "Rescheduled",
    statusColor: "#8b5cf6",
    avatar: "https://i.pravatar.cc/150?u=doctor3",
  },
];

const healthMetrics = [
  { label: "Heart Rate", value: "72", unit: "bpm", icon: "❤️" },
  { label: "Blood Pressure", value: "120/80", unit: "mmHg", icon: "📊" },
  { label: "Temperature", value: "98.6", unit: "°F", icon: "🌡️" },
  { label: "Oxygen Level", value: "98%", unit: "SpO2", icon: "🫁" },
];

const appointmentChartData = [4, 6, 5, 8, 7, 9, 8, 10, 9, 11, 10, 12];
const healthScoreData = [80, 82, 79, 85, 86, 84, 88, 87, 90, 89, 91, 92];

export default function ModernPatientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedAppt, setExpandedAppt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    }}>
      {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
      <nav style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 40px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        {/* Left Side - Hamburger & Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111827",
            }}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            ☰
          </button>
          
          {/* Logo & Brand */}
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
        </div>

        {/* Center Nav */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["overview", "appointments", "vitals"].map((tab) => (
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

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "#ecfdf5",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#059669",
          }}>
            <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
            Online
          </div>
          <img src="https://i.pravatar.cc/150?u=alex" alt="Patient" style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "2px solid #3b82f6",
          }} />
        </div>
      </nav>

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
                  { icon: "📊", label: "Dashboard", active: true },
                  { icon: "📅", label: "Appointments" },
                  { icon: "📋", label: "Medical Records" },
                  { icon: "💊", label: "Prescriptions" },
                  { icon: "📈", label: "Health Insights" },
                  { icon: "📞", label: "Contacts" },
                  { icon: "⚙️", label: "Settings" },
                ].map((item, i) => (
                  <button
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background: item.active ? "rgba(255, 255, 255, 0.2)" : "transparent",
                      border: item.active ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
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
                  <img src="https://i.pravatar.cc/150?u=alex" alt="Profile" style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, margin: "0", color: "white" }}>
                      Alex Johnson
                    </p>
                    <p style={{ fontSize: "11px", margin: "2px 0 0 0", color: "#9ca3af" }}>
                      Patient #8291
                    </p>
                  </div>
                </div>
                <button style={{
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
            Welcome back, Alex
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
              <StatCard label="Next Appointment" value="in 3 days" change="Confirmed" changeType="up" icon="📅" />
              <StatCard label="Health Score" value="92" change="+1 from last week" changeType="up" icon="⭐" />
              <StatCard label="Total Visits" value="12" change="+2 this month" changeType="up" icon="🏥" />
              <StatCard label="Medications" value="5" change="All on schedule" changeType="up" icon="💊" />
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
                  Past 12 months trend
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
                  Improving steadily
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
                  { value: 65, color: "#3b82f6" },
                  { value: 35, color: "#f59e0b" },
                ]} />
                <div style={{ marginTop: "20px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    <span style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span style={{ fontSize: "14px", color: "#374151" }}>In-Person (65%)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "3px" }} />
                    <span style={{ fontSize: "14px", color: "#374151" }}>Telemedicine (35%)</span>
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
              <button style={{
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
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => setExpandedAppt(expandedAppt === appt.id ? null : appt.id)}
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
                      background: appt.statusColor,
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
                    <div style={{
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid #f3f4f6",
                      display: "flex",
                      gap: "12px",
                    }}>
                      <button style={{
                        flex: 1,
                        padding: "10px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}>
                        Reschedule
                      </button>
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
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VITALS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "vitals" && (
          <div style={{ animation: "fadeIn 0.3s ease-in" }}>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>📈</p>
              <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>
                Vitals Dashboard Coming Soon
              </h3>
              <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
                Connect your health devices to track vitals in real-time
              </p>
              <button style={{
                marginTop: "24px",
                padding: "12px 24px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}>
                Connect Device
              </button>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
