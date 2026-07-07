import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderKanban, 
  ShieldAlert, 
  FileText, 
  User, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";

export default function Sidebar() {
  const { user } = useAuth();
  
  // Persist collapsed state to localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("teamflow_sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("teamflow_sidebar_collapsed", String(newState));
    // Trigger custom resize event to let charts resize gracefully
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  };

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3] // Admin, Manager, Dev
    },
    {
      to: "/projects",
      label: "Projects",
      icon: <FolderKanban className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3]
    },
    {
      to: "/incidents",
      label: "Incidents",
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3]
    },
    {
      to: "/reports",
      label: "Reports",
      icon: <FileText className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3]
    },
    {
      to: "/profile",
      label: "Profile",
      icon: <User className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3]
    },
    {
      to: "/settings",
      label: "Settings",
      icon: <SettingsIcon className="w-5 h-5 shrink-0" />,
      roles: [1, 2, 3]
    }
  ];

  const filteredLinks = user 
    ? links.filter(l => l.roles.includes(user.roleId)) 
    : [];

  return (
    <aside 
      id="app-sidebar"
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-slate-900 text-slate-300 h-[calc(100vh-4rem)] flex flex-col justify-between p-4 border-r border-slate-800 transition-all duration-300 relative select-none shrink-0`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-4 -right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-full p-1 shadow-md transition-all duration-150 z-50 cursor-pointer hidden md:block"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        id="sidebar-collapse-toggle"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex flex-col gap-6" id="sidebar-main-section">
        {/* Navigation Category Label */}
        <div>
          <span className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 block mb-3 transition-opacity ${
            isCollapsed ? "opacity-0 text-center pl-0" : "opacity-100"
          }`}>
            {isCollapsed ? "•••" : "Main Workspace"}
          </span>
          <nav className="flex flex-col gap-1" id="sidebar-nav-links">
            {filteredLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                id={`sidebar-link-${link.label.toLowerCase()}`}
                title={isCollapsed ? link.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-800"
                      : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
                  } ${isCollapsed ? "justify-center px-0" : ""}`
                }
              >
                {link.icon}
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Roles/Permissions Guide Indicator inside Sidebar for clear visibility */}
        <div className="border-t border-slate-800 pt-4" id="sidebar-security-badge-container">
          {!isCollapsed ? (
            <>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 block mb-3">
                Your Access Scope
              </span>
              <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-800" id="sidebar-access-scope-box">
                <p className="text-xs font-semibold text-slate-200">
                  {user?.roleName === "Admin" && "🔑 Administrative Access"}
                  {user?.roleName === "Manager" && "💼 Manager Access"}
                  {user?.roleName === "Developer" && "💻 Developer Workspace"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  {user?.roleName === "Admin" && "Full administrative control over users, status logs, projects, and incidents."}
                  {user?.roleName === "Manager" && "Manage project rosters, assign work tasks, complete projects, and fetch reports."}
                  {user?.roleName === "Developer" && "View your project boards, modify assigned task states, and log project incidents."}
                </p>
              </div>
            </>
          ) : (
            <div className="flex justify-center" title={`${user?.roleName} Access Enabled`}>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-indigo-400 hover:text-white cursor-pointer transition-colors">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta Details */}
      <div className="text-center p-2 border-t border-slate-800/60" id="sidebar-footer">
        <span className="text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider block">
          {isCollapsed ? "TF" : "TeamFlow v1.0.0"}
        </span>
      </div>
    </aside>
  );
}
