import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Bell, 
  LogOut,
  Activity,
  HeartPulse,
  Home,
  Video,
  FileText,
  Menu,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
// Using a local header for the doctor dashboard instead of shared Navbar
import Appointments from "./Appointments/Appointments";
import Prescriptions from "./Prescriptions/Prescriptions";
import Profile from "./Profile/Profile";
import TelemedicineTab from "../../components/telemedicine/TelemedicineTab";
// ── Mock Data ────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: 'Doctor',
    role: 'Doctor'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex font-sans">
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-md">
            <HeartPulse className="text-white w-5 h-5" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900">Care<span className="text-blue-600">Net</span></span>
              <span className="text-xs text-slate-500 mt-0.5">Healthcare Platform</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
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
                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
              {sidebarOpen && <span className="font-semibold text-[15px]">{item.label}</span>}
              {activeTab === item.id && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="py-2 px-3 border-t border-slate-100 mb-2">
          <button 
            onClick={() => { localStorage.clear(); navigate("/login"); }}
            className="w-full flex items-center gap-3 py-2.5 px-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-semibold text-[15px]">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Local Header (dashboard-specific) */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
            >
              <Menu size={18} />
            </button>
            <div className="text-xl font-bold text-slate-800">Welcome Dr. {user.name}</div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              title="Home"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Home size={18} className="text-white" />
              <span>Home</span>
            </button>
          </div>
        </div>

        
        {activeTab === "profile" && <Profile />}
        {activeTab === "appointments" && <Appointments />}
        {activeTab === "telemedicine" && <TelemedicineTab role="doctor" />}
        {activeTab === "prescriptions" && <Prescriptions />}
      </main>
    </div>
  );
}
