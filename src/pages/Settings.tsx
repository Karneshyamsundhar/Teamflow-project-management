import { useState, useEffect } from "react";
import { useToast } from "../components/ui/Toast.tsx";
import { motion } from "motion/react";
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Monitor, 
  Globe, 
  Palette, 
  ShieldCheck, 
  Save 
} from "lucide-react";

const SYSTEM_THEMES = [
  { id: "classic", name: "Classic Slate", primary: "bg-slate-800", text: "text-slate-800", ring: "ring-slate-200" },
  { id: "indigo", name: "Indigo Blue", primary: "bg-indigo-600", text: "text-indigo-600", ring: "ring-indigo-200" },
  { id: "emerald", name: "Emerald Forest", primary: "bg-emerald-600", text: "text-emerald-600", ring: "ring-emerald-200" },
  { id: "rose", name: "Rose Crimson", primary: "bg-rose-600", text: "text-rose-600", ring: "ring-rose-200" },
];

const LANGUAGES = [
  { code: "en", name: "English (US)" },
  { code: "es", name: "Español (ES)" },
  { code: "de", name: "Deutsch (DE)" },
  { code: "fr", name: "Français (FR)" },
];

export default function Settings() {
  const { showToast } = useToast();
  
  // Theme & Appearance State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("teamflow_dark_mode") === "true";
  });
  
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("teamflow_theme_id") || "indigo";
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("teamflow_lang") || "en";
  });

  // Notifications state
  const [emailNotify, setEmailNotify] = useState(() => {
    return localStorage.getItem("teamflow_notify_email") !== "false";
  });
  const [inAppNotify, setInAppNotify] = useState(() => {
    return localStorage.getItem("teamflow_notify_inapp") !== "false";
  });
  const [securityNotify, setSecurityNotify] = useState(() => {
    return localStorage.getItem("teamflow_notify_security") !== "false";
  });

  const [isSaving, setIsSaving] = useState(false);

  // Apply visual changes on toggle
  useEffect(() => {
    // If the app supports dark-mode class, we can toggle it here
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Save all preference states to localStorage
      localStorage.setItem("teamflow_dark_mode", String(darkMode));
      localStorage.setItem("teamflow_theme_id", activeTheme);
      localStorage.setItem("teamflow_lang", language);
      localStorage.setItem("teamflow_notify_email", String(emailNotify));
      localStorage.setItem("teamflow_notify_inapp", String(inAppNotify));
      localStorage.setItem("teamflow_notify_security", String(securityNotify));
      
      // Dispatch custom event to let Navbar / Sidebar know the theme/dark-mode might have updated
      window.dispatchEvent(new Event("teamflow-settings-updated"));

      setTimeout(() => {
        showToast("Settings saved successfully", "success");
        setIsSaving(false);
      }, 500);
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings preferences", "error");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4" id="settings-page-root">
      {/* Header */}
      <div id="settings-header">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight dark:text-white">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your viewing mode, team theme accent, and notification alerts.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6" id="settings-main-form">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Theme & Mode config card */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Appearance & Theme selection */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6"
              id="settings-appearance-card"
            >
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Appearance & Accents</h3>
              </div>

              {/* Mode Toggler (Light vs Dark) */}
              <div className="flex items-center justify-between" id="dark-mode-toggle-section">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Contrast Color Mode</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle dark and light theme layouts for eye strain.</p>
                </div>
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setDarkMode(false)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      !darkMode 
                        ? "bg-white text-indigo-600 shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      darkMode 
                        ? "bg-slate-800 text-yellow-400 shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </button>
                </div>
              </div>

              {/* System Accents */}
              <div className="space-y-3.5" id="system-accents-section">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">TeamFlow Color Aura</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Pick the active accent color for links, indicators, and buttons.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SYSTEM_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setActiveTheme(theme.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        activeTheme === theme.id 
                          ? "border-slate-800 bg-slate-50 scale-102" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${theme.primary} mb-2 shadow-xs`} />
                      <span className="text-xs font-semibold text-slate-700">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Notification triggers section */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6"
              id="settings-notifications-card"
            >
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Notification Channels</h3>
              </div>

              <div className="space-y-4 divide-y divide-slate-50">
                {/* Email Notifications */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg h-9 w-9 flex items-center justify-center mt-0.5">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">Email Digest alerts</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Receive daily notifications and task completions in your inbox.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotify}
                    onChange={(e) => setEmailNotify(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {/* In-app push notifications */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-9 w-9 flex items-center justify-center mt-0.5">
                      <Monitor className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">Live In-App Popups</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Allow browser header popups for new incident occurrences.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppNotify}
                    onChange={(e) => setInAppNotify(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {/* Security notifications */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg h-9 w-9 flex items-center justify-center mt-0.5">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">Access & Security alerts</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Alert on login location modifications and password updates.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityNotify}
                    onChange={(e) => setSecurityNotify(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Region & Info card */}
          <div className="space-y-6">
            {/* Region / Language setting */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5"
              id="settings-locale-card"
            >
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Localization</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="settings-language">
                  System Language
                </label>
                <select
                  id="settings-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">This sets the date format structures and task timestamps.</p>
              </div>
            </motion.div>

            {/* Quick Actions / Save card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-tr from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between"
              id="settings-actions-card"
            >
              <div>
                <h3 className="text-sm font-bold tracking-tight">Persist Preferences</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                  Save your configurations to lock them to this browser workspace layout.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="save-settings-btn"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Persisting Settings..." : "Save Workspace Settings"}
              </button>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
