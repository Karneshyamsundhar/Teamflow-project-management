import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/ui/Toast.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Card from "../components/ui/Card.tsx";
import { motion } from "motion/react";
import { Lock, ArrowLeft, CheckCircle2, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simple password strength metrics
  const getPasswordStrength = () => {
    if (!password) return { label: "No password", color: "bg-slate-200", width: "w-0", score: 0 };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: "Weak Security", color: "bg-rose-500", width: "w-1/3", score };
    if (score <= 4) return { label: "Medium Security", color: "bg-amber-500", width: "w-2/3", score };
    return { label: "Strong Enterprise Security", color: "bg-emerald-500", width: "w-full", score };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast("Missing restoration credentials. Please request a new link.", "error");
      return;
    }

    if (!password || password.length < 6) {
      showToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match. Please verify your typing.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      showToast(res.data.message || "Password updated successfully!", "success");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to update your password.";
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" }
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans"
      id="reset-password-page-wrapper"
    >
      {/* Glow balls background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <Card className="border-slate-100/80 shadow-xl p-8 bg-white/95 backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">New Password</h1>
            <p className="text-xs text-slate-500 mt-2">
              Setup a strong, unique enterprise security password to access your TeamFlow workspace.
            </p>
          </div>

          {!token ? (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-left flex gap-3 mb-4" id="missing-token-alert">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Invalid or Missing Reset Token</h4>
                <p className="text-[11px] text-rose-700 mt-1 leading-normal">
                  The password reset link is invalid or has expired. Please return to the Forgot Password page to generate a fresh URL.
                </p>
              </div>
            </div>
          ) : !success ? (
            <form onSubmit={handleSubmit} className="space-y-4" id="reset-password-form">
              {/* New Password */}
              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">New Password</label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password strength visualizer */}
              {password && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5" id="strength-meter-box">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Strength:</span>
                    <span className={strength.score <= 2 ? "text-rose-500" : strength.score <= 4 ? "text-amber-500" : "text-emerald-500"}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-semibold rounded-xl mt-2"
                loading={loading}
                id="reset-password-submit-btn"
              >
                Restore Workspace Account
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center" id="reset-password-success-pane">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-left flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Password Restored Successfully</h4>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-normal">
                    Your password has been securely updated. You are being redirected to the workspace sign-in screen...
                  </p>
                </div>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-full relative">
                <div className="absolute top-0 left-0 h-full bg-emerald-500 animate-[loading-bar_3s_linear]" />
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              id="back-to-login-link"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Workspace Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
