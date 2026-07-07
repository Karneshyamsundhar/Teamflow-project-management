import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../components/ui/Toast.tsx";
import axios from "axios";
import { motion } from "motion/react";
import { 
  User as UserIcon, 
  Phone, 
  Building, 
  Mail, 
  Shield, 
  Calendar, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  KeyRound
} from "lucide-react";

// Predefined professional avatar gradients
const AVATAR_GRADIENTS = [
  "from-rose-500 to-orange-500",
  "from-indigo-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-yellow-500",
  "from-violet-600 to-fuchsia-600",
  "from-slate-700 to-slate-900"
];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast("All password fields are required.", "warning");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters long.", "warning");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast("New passwords do not match.", "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await axios.post("/api/auth/change-password", {
        currentPassword,
        newPassword
      });
      showToast(res.data.message || "Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to update security password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Load initial profile data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      
      // Load extended attributes from user-specific local storage to remain database-schema compatible
      const extStr = localStorage.getItem(`teamflow_profile_ext_${user.id}`);
      if (extStr) {
        try {
          const ext = JSON.parse(extStr);
          setPhone(ext.phone || "");
          setDepartment(ext.department || "");
          setAvatarIndex(Number(ext.avatarIndex) || 0);
        } catch (e) {
          console.error("Error loading extended profile data", e);
        }
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update name on backend database
      await axios.put("/api/auth/profile", { name: name.trim() });
      
      // 2. Save phone, department, and avatar gradient index to user-specific localStorage
      const extData = {
        phone: phone.trim(),
        department: department.trim(),
        avatarIndex
      };
      localStorage.setItem(`teamflow_profile_ext_${user.id}`, JSON.stringify(extData));
      
      // Save global default avatar selection so changes reflect immediately in the header
      localStorage.setItem(`teamflow_avatar_index_${user.id}`, String(avatarIndex));

      // 3. Refresh AuthContext state
      await refreshProfile();
      
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
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

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "July 7, 2026";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4" id="profile-page-root">
      {/* Header and subtitle */}
      <div id="profile-header">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight dark:text-white">Profile Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your identity, department alignment, and workspace avatar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="profile-container-grid">
        {/* Left column: Visual identity avatar card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center flex flex-col items-center relative overflow-hidden"
            id="avatar-visual-card"
          >
            {/* Background design accents */}
            <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-r ${AVATAR_GRADIENTS[avatarIndex]} opacity-10`} />

            {/* Avatar display */}
            <div className="relative mt-4">
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-tr ${AVATAR_GRADIENTS[avatarIndex]} text-white text-3xl font-extrabold flex items-center justify-center shadow-lg shadow-slate-200/50 relative border-4 border-white`}>
                {getInitials(name || user.name)}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 text-slate-500">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{name || user.name}</h3>
              <p className="text-xs font-semibold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full inline-block mt-1">
                {user.roleName}
              </p>
            </div>

            {/* Quick stats list */}
            <div className="w-full border-t border-slate-50 mt-6 pt-5 space-y-3.5 text-left text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Unique Identity:</span>
                <span className="font-mono text-slate-700">#TF-0{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Auth Email:</span>
                <span className="text-slate-700 truncate max-w-[150px]" title={user.email}>{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Joined System:</span>
                <span className="text-slate-700 font-medium">{formattedDate}</span>
              </div>
            </div>
          </motion.div>

          {/* Avatar customizer palette */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs"
            id="avatar-customizer-box"
          >
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Workspace Avatar Aura</h4>
            <div className="grid grid-cols-4 gap-2.5" id="gradients-selector-grid">
              {AVATAR_GRADIENTS.map((gradient, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarIndex(idx)}
                  className={`h-11 rounded-xl bg-gradient-to-tr ${gradient} border-2 transition-all cursor-pointer relative ${
                    avatarIndex === idx ? "border-slate-800 scale-105 shadow-md shadow-slate-100" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Select theme color option ${idx + 1}`}
                >
                  {avatarIndex === idx && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-4 h-4 drop-shadow-xs" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column: Edit Details Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs"
            id="profile-details-form-card"
          >
            <h3 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-50 pb-3 mb-5">Personal Details</h3>

            <form onSubmit={handleSave} className="space-y-5" id="profile-edit-form">
              {/* Full name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="profile-fullname">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="profile-fullname"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {/* Work email (read-only) */}
              <div className="space-y-1.5 opacity-80">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Work Email (Security Restricted)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100/70 border border-slate-100 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="profile-department">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="profile-department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                      placeholder="e.g. SRE / Operations Core"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="profile-phone">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="profile-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                  </div>
                </div>
              </div>

              {/* Scope & Role Level info box */}
              <div className="bg-slate-50 rounded-xl p-4 flex gap-3 border border-slate-100" id="access-level-banner">
                <Shield className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Security Credentials Verified</p>
                  <p className="text-slate-500 mt-1">
                    Your role is enrolled as <span className="font-semibold text-indigo-600">{user.roleName}</span>, permitting access to standard and administrative workspace logs.
                  </p>
                </div>
              </div>

              {/* Save changes button */}
              <div className="border-t border-slate-50 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  id="save-profile-btn"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving Workspace..." : "Save Workspace Changes"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Change Password Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs mt-6"
            id="change-password-card"
          >
            <h3 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-50 pb-3 mb-5">Security Credentials</h3>

            <form onSubmit={handleChangePassword} className="space-y-5" id="change-password-form">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="current-password">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="confirm-new-password"
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
              </div>

              {/* Change password button */}
              <div className="border-t border-slate-50 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  id="update-password-btn"
                >
                  <Lock className="w-4 h-4" />
                  {isChangingPassword ? "Updating Password..." : "Update Workspace Password"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
