import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Search, 
  Bell, 
  LogOut,
  Activity,
  Video,
  FileText,
  Menu,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import ShowAppointments from "./doctor-dashboard-components/appointments/showAppointments";

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STATS = [
  { label: "Total Patients", value: "1,280", change: "+4.2%", icon: Users, color: "#3b82f6" },
  { label: "Pending Requests", value: "12", change: "+2.1%", icon: Clock, color: "#f59e0b" },
  { label: "Surgery Scheduled", value: "3", change: "Today", icon: CheckCircle, color: "#10b981" },
  { label: "Total Revenue", value: "$42,500", change: "+12.5%", icon: DollarSign, color: "#8b5cf6" },
];

const RECENT_APPOINTMENTS = [
  { id: 1, patient: "Ahamed Shaba", type: "First Consultation", date: "Oct 12, 2023", time: "09:00 AM", status: "PENDING", img: "AS" },
  { id: 2, patient: "Sandeep Gamage", type: "Follow-up", date: "Oct 12, 2023", time: "10:30 AM", status: "CONFIRMED", img: "SG" },
  { id: 3, patient: "M. Rizwan", type: "Heart Checkup", date: "Oct 12, 2023", time: "01:00 PM", status: "CONFIRMED", img: "MR" },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Activity size={24} />
          </div>
          {sidebarOpen && <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-tight">CareNet Pro</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: "overview", icon: Activity, label: "Dashboard" },
            { id: "appointments", icon: Calendar, label: "Schedule" },
            { id: "patients", icon: Users, label: "Patients" },
            { id: "prescriptions", icon: FileText, label: "Prescriptions" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
              {sidebarOpen && <span className="font-semibold text-[15px]">{item.label}</span>}
              {activeTab === item.id && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 mb-4">
          <button 
            onClick={() => { localStorage.clear(); navigate("/login"); }}
            className="w-full flex items-center gap-4 p-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-semibold text-[15px]">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={<span className="text-xl font-bold text-slate-800">Welcome, Dr. Ahamed Shaba</span>}
          userProfile={{
            name: 'Dr. Ahamed Shaba',
            email: 'doctor@carenet.com',
            role: 'Doctor'
          }}
        >
          <div className="hidden md:flex flex-1 justify-end pr-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Search patients..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>
        </Navbar>

        <div className="p-8">
          {activeTab === "overview" && (
            <>
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {MOCK_STATS.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={22} />
                  </div>
                  <span className="text-emerald-500 flex items-center gap-1 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <TrendingUp size={14} /> {stat.change}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Appointments */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Recent Appointments</h2>
                  <button className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {RECENT_APPOINTMENTS.map((apt) => (
                    <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {apt.img}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{apt.patient}</h4>
                          <p className="text-sm text-slate-500 font-medium">{apt.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-800">{apt.date}</p>
                          <p className="text-xs text-slate-400 font-medium">{apt.time}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                          apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {apt.status}
                        </span>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Mini Widgets */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Activity size={120} />
                </div>
                <h3 className="text-lg font-bold mb-6">Upcoming Webinar</h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex gap-4">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                      <Video size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">New Heart Rate Tech</p>
                      <p className="text-xs text-white/60">Starts in 12 mins</p>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm shadow-lg shadow-white/10 hover:bg-indigo-50 transition-all">
                    Register Now
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Clinic Info</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">CareNet Main Center</p>
                      <p className="text-xs text-slate-500">Colombo, Sri Lanka</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Mon - Fri</p>
                      <p className="text-xs text-slate-500">09:00 AM - 05:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {activeTab === "appointments" && (
            <ShowAppointments />
          )}
        </div>
      </main>
    </div>
  );
}
