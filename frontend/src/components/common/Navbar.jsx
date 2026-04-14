import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Settings, User } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function Navbar({ onMenuClick, title, userProfile, children }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const socketRef = useRef(null);

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
      const res = await axios.get('${import.meta.env.VITE_API_BASE_URL}/notifications/in-app', {
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
      await axios.patch('${import.meta.env.VITE_API_BASE_URL}/notifications/in-app/read-all', {}, {
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
  const user = userProfile || {
    name: 'User',
    email: 'user@example.com',
    avatar: 'https://ui-avatars.com/api/?name=User&background=random'
  };

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all">
      {/* Left Area: Hamburger + Title */}
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
            title="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        {title && (
          <div className="hidden sm:flex items-center">
            {typeof title === 'string' ? (
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            ) : (
              title
            )}
          </div>
        )}
      </div>

      {/* Center Area (Optional Tabs/Search) */}
      <div className="flex-1 flex justify-center px-4">
        {children}
      </div>

      {/* Right Area: Notification + Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
              if (!showNotifDropdown && unreadCount > 0) {
                // Optionally mark as read when opening? Or keep explicit.
              }
            }}
            className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all relative focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
              <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-medium rounded-full">
                  {unreadCount} New
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">You're all caught up!</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map(n => (
                      <div 
                        key={n._id} 
                        className={`p-4 hover:bg-blue-50/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30' : 'bg-white'}`}
                      >
                        <div className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-gray-400 mt-2 font-medium">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div 
                onClick={handleMarkAllRead}
                className="p-3 border-t border-gray-50 text-center bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-blue-600">Mark all as read</span>
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
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-50 transition-all border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px] shadow-sm">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                alt="Profile" 
                className="w-full h-full rounded-full border-2 border-white object-cover bg-white"
              />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user.name?.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 font-medium">{user.role || 'User'}</p>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
              <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate mt-1 font-medium">{user.email}</p>
                {user.id && (
                  <div className="mt-3 inline-flex px-2.5 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-xs font-mono text-gray-600">ID: {user.id}</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="p-2 border-t border-gray-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
