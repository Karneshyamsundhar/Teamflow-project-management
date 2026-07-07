import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Bell, LogOut, Check, CheckSquare, ShieldAlert, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../ui/Toast.tsx";
import { Notification } from "../../types.ts";

const AVATAR_GRADIENTS = [
  "from-rose-500 to-orange-500",
  "from-indigo-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-yellow-500",
  "from-violet-600 to-fuchsia-600",
  "from-slate-700 to-slate-900"
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track selected avatar gradient index
  const [avatarIndex, setAvatarIndex] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  // Sync avatar from local storage
  const syncAvatar = () => {
    if (user) {
      const savedIndex = localStorage.getItem(`teamflow_avatar_index_${user.id}`);
      if (savedIndex !== null) {
        setAvatarIndex(Number(savedIndex));
      } else {
        // Fallback to custom index based on user id
        setAvatarIndex(user.id % AVATAR_GRADIENTS.length);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    syncAvatar();

    // Poll notifications
    const timer = setInterval(fetchNotifications, 30000);
    
    // Listen for setting changes
    window.addEventListener("teamflow-settings-updated", syncAvatar);

    return () => {
      clearInterval(timer);
      window.removeEventListener("teamflow-settings-updated", syncAvatar);
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      showToast("Notification marked as read", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header 
      id="app-navbar"
      className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 shadow-xs select-none"
    >
      {/* Brand logo */}
      <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer group" id="navbar-brand-section">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-200 group-hover:scale-102 transition-transform">
          TF
        </div>
        <div>
          <span className="text-base font-bold text-slate-800 tracking-tight block">TeamFlow</span>
          <span className="text-[10px] font-mono font-medium text-indigo-600 uppercase tracking-widest block -mt-1">Incidents Engine</span>
        </div>
      </Link>

      {/* Control panel & User profile dropdown info */}
      <div className="flex items-center gap-4" id="navbar-actions-section">
        {/* Notifications Icon with Badge */}
        <div className="relative" ref={dropdownRef} id="notifications-dropdown-wrapper">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer relative"
            id="notifications-toggle-btn"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span 
                id="unread-badge-counter"
                className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-sm border border-white"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div 
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer inline-flex items-center gap-1"
                    id="mark-all-read-btn"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50" id="notifications-list">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 text-left transition-colors flex items-start gap-2.5 ${
                        n.isRead ? "bg-white" : "bg-indigo-50/20"
                      }`}
                      id={`notification-item-${n.id}`}
                    >
                      <div className="mt-1">
                        {n.type === "Incident Assigned" ? (
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${n.isRead ? "bg-slate-300" : "bg-indigo-600"}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-700 leading-tight">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                              title="Mark as read"
                              id={`mark-read-btn-${n.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User context information */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4" id="navbar-user-profile-widget">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 cursor-pointer group"
              title="View Profile Workspace"
            >
              <div className="text-right hidden sm:block">
                <span className="text-sm font-semibold text-slate-800 block leading-tight group-hover:text-indigo-600 transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full inline-block mt-1">
                  {user.roleName}
                </span>
              </div>
              
              {/* Colored Avatar */}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${AVATAR_GRADIENTS[avatarIndex]} text-white text-xs font-bold flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform border border-white`}>
                {getInitials(user.name)}
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Sign Out"
              id="sign-out-navbar-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
