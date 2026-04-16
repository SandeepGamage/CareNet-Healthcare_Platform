import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, Settings, User, HeartPulse, ChevronDown, Brain, Activity, Home, Info } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function Navbar({ onMenuClick, title, userProfile, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const socketRef = useRef(null);

  // Sync with localStorage if userProfile isn't passed
  useEffect(() => {
    if (!userProfile) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setLocalUser(JSON.parse(storedUser));
      }
    }
  }, [userProfile]);

  // ─── Socket.io Connection ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to the gateway (port 3001) which proxies /socket.io to notification-service
    const socket = io('http://localhost:3001', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('Connected to notification socket'));
    
    socket.on('new-notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Optional: Browser Notification API or Toast could be triggered here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ─── Fetch Notifications ───────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Using API Gateway path
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications/in-app`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.log('Notification fetch failed:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/notifications/in-app/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Default user fallbacks if not provided properly
  const user = userProfile || localUser;

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Appointments', href: '/book-appointment', icon: Activity },
    { name: 'Symptom Checker', href: '/ai-symptom', icon: Brain },
    { name: 'About Us', href: '/about', icon: Info },
  ];

  const handleNavClick = (href) => {
    if (location.pathname === '/' && href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(href);
  };

  // Determine whether a nav link is active.
  const isLinkActive = (href) => {
    if (!href) return false;
    // Handle hash links like '/#features' or '#features'
    if (href.startsWith('/#') || href.startsWith('#')) {
      const targetHash = href.startsWith('/') ? href.substring(1) : href; // '/#features' -> '#features'
      return location.pathname === '/' && location.hash === targetHash;
    }
    // Exact pathname match for normal routes
    return location.pathname === href;
  };

  // Navigate to the appropriate dashboard/profile based on user role
  const goToProfileDashboard = () => {
    try {
      const role = (user && user.role && String(user.role).toLowerCase()) || '';
      if (role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (role === 'patient') {
        navigate('/patient-dashboard');
      } else {
        navigate('/profile');
      }
    } finally {
      setShowProfileDropdown(false);
    }
  };

  // If no other nav link is active, treat Home ('/') as active by default
  const anyOtherActive = navLinks.some(l => l.href !== '/' && isLinkActive(l.href));

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-full h-[64px] px-4 sm:px-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all duration-300 hover:bg-white/80">
          {/* Left Area: Logo + Title */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all active:scale-95"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Branding */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-blue-200 transition-all group-hover:-rotate-6">
                <HeartPulse className="text-white w-5 h-5" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">
                  Care<span className="text-teal-600">Net</span>
                </span>
                {title && typeof title === 'string' && (
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{title}</span>
                )}
              </div>
            </div>

            {/* If title is a component (e.g. breadcrumbs) */}
            {title && typeof title !== 'string' && (
              <div className="hidden md:flex items-center h-8 ml-2 pl-4 border-l border-slate-200">
                {title}
              </div>
            )}
          </div>

          {/* Center Area: Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 pointer-events-auto">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link.name}>
                {(() => {
                  const active = isLinkActive(link.href) || (link.href === '/' && !anyOtherActive);
                  const hasIcon = !!link.icon;
                  return (
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          hasIcon ? 'flex items-center gap-1.5' : ''
                        } ${
                          active ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md' : 'text-teal-600 hover:bg-teal-50'
                        }`}
                    >
                      {hasIcon && (
                        <link.icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-teal-600'}`} />
                      )}
                      {link.name}
                    </button>
                  );
                })()}
                {idx < navLinks.length - 1 && (
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Right Area: Notification + Profile or Login */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setShowNotifDropdown(!showNotifDropdown);
                      setShowProfileDropdown(false);
                    }}
                    className={`p-2.5 rounded-full transition-all relative focus:outline-none active:scale-95 ${
                      showNotifDropdown 
                        ? 'bg-teal-50 text-teal-600' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 flex h-4 w-4 transform translate-x-1/2 -translate-y-1/2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 text-[10px] font-bold text-white items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-[-60px] sm:right-0 mt-4 w-80 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                        <button 
                          onClick={handleMarkAllRead}
                          className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 text-white text-[11px] font-bold hover:from-teal-700 hover:to-blue-700 transition-all uppercase tracking-wider"
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-8 text-center flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                              <Bell className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {notifications.map(n => (
                              <div
                                key={n._id}
                                className={`p-4 hover:bg-teal-50/30 cursor-pointer transition-colors border-l-4 ${
                                  !n.isRead ? 'border-teal-500 bg-teal-50/10' : 'border-transparent bg-white'
                                }`}
                              >
                                <p className="text-xs font-bold text-slate-800 mb-1">{n.title}</p>
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">{n.message}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Element */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(!showProfileDropdown);
                      setShowNotifDropdown(false);
                    }}
                    className={`flex items-center gap-2 p-1 rounded-full transition-all border outline-none active:scale-95 ${
                      showProfileDropdown 
                        ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=0D9488&color=fff&bold=true`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 pr-2">
                      <span className="text-xs font-bold whitespace-nowrap">{(user.name || 'User').split(' ')[0]}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="p-5 border-b border-slate-50 bg-gradient-to-r from-teal-50 to-blue-50">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{user.email}</p>
                        <div className="mt-3 inline-flex px-2 py-0.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{user.role || 'Patient'}</span>
                        </div>
                      </div>
                      
                      <div className="p-2">
                        <button
                          onClick={goToProfileDashboard}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all"
                        >
                          <User className="w-4 h-4 text-slate-400 transition-colors" />
                          My Dashboard
                        </button>
                      </div>

                      <div className="p-2 border-t border-slate-50 bg-slate-50/30">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 rounded-2xl hover:bg-rose-50 transition-all transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-bold rounded-full hover:from-teal-700 hover:to-blue-700 transition-all shadow-md active:scale-95"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
