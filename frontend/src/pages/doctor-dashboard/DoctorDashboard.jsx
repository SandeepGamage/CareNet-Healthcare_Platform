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
import Navbar from "../../components/common/Navbar";
import Dashboard from "./Dashboard/Dashboard";
import Appointments from "./Appointments/Appointments";
import Prescriptions from "./Prescriptions/Prescriptions";
import Profile from "./Profile/Profile";
import TelemedicineTab from "../../components/telemedicine/TelemedicineTab";

// ── Mock Data ────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem("userInfo")) || {
    name: 'Doctor',
    role: 'Doctor'
  };

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
            { id: "profile", icon: Users, label: "Profile" },
            { id: "appointments", icon: Calendar, label: "Appointments" },
            { id: "telemedicine", icon: Video, label: "Telemedicine" },
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
          title={<span className="text-xl font-bold text-slate-800">Welcome, {user.name}</span>}
          userProfile={user}
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

        {activeTab === "overview" && <Dashboard />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "appointments" && <Appointments />}
        {activeTab === "telemedicine" && <TelemedicineTab role="doctor" />}
        {activeTab === "prescriptions" && <Prescriptions />}
      </main>
    </div>
  );
}
