import { useState } from "react";

const navLinks = [
  {
    label: "Overview",
    active: true,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    label: "Appointments",
    active: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    label: "My Reports",
    active: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    label: "Prescriptions",
    active: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    ),
  },
];

const appointments = [
  {
    initials: "DM",
    name: "Dr. Daniel Miller",
    role: "M.D. Cardiologist",
    dept: "Cardiology",
    date: "Oct 14, 2024",
    time: "09:30 AM",
    status: "Confirmed",
    statusStyle: "bg-green-500/10 text-green-400 border border-green-500/20",
  },
  {
    initials: "SW",
    name: "Dr. Sarah Wilson",
    role: "Dermatologist",
    dept: "Dermatology",
    date: "Oct 18, 2024",
    time: "11:00 AM",
    status: "Pending",
    statusStyle: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  {
    initials: "RJ",
    name: "Dr. Robert James",
    role: "Neurologist",
    dept: "Neurology",
    date: "Nov 02, 2024",
    time: "02:15 PM",
    status: "Rescheduled",
    statusStyle: "bg-slate-800 text-slate-400 border border-slate-700",
  },
];

const vitals = [
  { label: "Heart Rate", value: "72 bpm", color: "text-red-400" },
  { label: "Blood Pressure", value: "120/80", color: "text-blue-400" },
  { label: "Body Weight", value: "74.5 kg", color: "text-purple-400" },
  { label: "Blood Sugar", value: "98 mg/dL", color: "text-yellow-400" },
];

export default function PatientDashboard() {
  const [activeNav, setActiveNav] = useState("Overview");

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 border-r border-slate-800 p-6 gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CareNet
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-grow">
          {navLinks.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left
                ${activeNav === label
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {icon}
              </svg>
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          <img
            src={`https://i.pravatar.cc/100?u=alex`}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-grow">
            <p className="text-sm font-semibold">Alex Johnson</p>
            <p className="text-xs text-slate-500">Patient ID: #8291</p>
          </div>
          <button className="text-slate-500 hover:text-red-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Good morning, Alex! 👋</h1>
            <p className="text-slate-400 mt-1 text-sm">Here's an overview of your health today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Next Appointment",
              value: "Oct 14, 2024",
              sub: "09:30 AM",
              bg: "bg-blue-500/10",
              textColor: "text-blue-400",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
            },
            {
              label: "Health Score",
              value: "92 / 100",
              sub: "Excellent",
              bg: "bg-green-500/10",
              textColor: "text-green-400",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
            {
              label: "Prescriptions",
              value: "3 Active",
              sub: "Refill in 5 days",
              bg: "bg-red-500/10",
              textColor: "text-red-400",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
            },
            {
              label: "Wallet Balance",
              value: "$240.50",
              sub: "View history →",
              bg: "bg-purple-500/10",
              textColor: "text-purple-400",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
          ].map(({ label, value, sub, bg, textColor, icon }) => (
            <div
              key={label}
              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
            >
              <div className={`w-11 h-11 ${bg} ${textColor} rounded-xl flex items-center justify-center mb-4`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
              <h3 className="text-xl font-bold mt-1">{value}</h3>
              <p className={`text-xs mt-1 ${textColor}`}>{sub}</p>
            </div>
          ))}
        </section>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments Table */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold border-l-4 border-indigo-500 pl-3">Upcoming Consultations</h2>
              <button className="text-xs font-medium text-indigo-400 hover:underline">See All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50 text-left">
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Date & Time</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {appointments.map((appt) => (
                    <tr key={appt.name} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold border border-slate-600">
                            {appt.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{appt.name}</p>
                            <p className="text-xs text-slate-500">{appt.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">{appt.dept}</td>
                      <td className="py-4">
                        <p className="font-medium text-slate-200">{appt.date}</p>
                        <p className="text-xs text-slate-500">{appt.time}</p>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${appt.statusStyle}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Health Snapshot */}
          <div className="flex flex-col gap-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold border-l-4 border-emerald-500 pl-3">Health Snapshot</h2>
            <div className="space-y-3">
              {vitals.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-colors"
                >
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  <span className="text-sm font-bold text-slate-100">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                </svg>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Daily Tip</span>
              </div>
              <p className="text-xs text-slate-400 italic leading-relaxed">
                "Stay hydrated and take a 30-minute walk today to maintain your heart health."
              </p>
            </div>

            <button className="mt-auto w-full py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-sm font-semibold transition-all">
              Sync Device Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
