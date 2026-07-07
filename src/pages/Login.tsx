import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../components/ui/Toast.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Card from "../components/ui/Card.tsx";
import { 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Activity,
  ArrowRight,
  Server,
  Eye,
  EyeOff,
  Lock,
  Mail,
  HelpCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showRegisterNotice, setShowRegisterNotice] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotSending, setIsForgotSending] = useState(false);

  // Load "Remember Me" email if saved previously
  useEffect(() => {
    const savedEmail = localStorage.getItem("teamflow_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token, user } = res.data;
      
      // Save email if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem("teamflow_remembered_email", email);
      } else {
        localStorage.removeItem("teamflow_remembered_email");
      }

      login(token, user);
      showToast(`Welcome back, ${user.name}!`, "success");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      const isNewUser = err.response?.data?.isNewUser || false;
      const msg = err.response?.data?.error || "Invalid credentials, please try again.";
      if (isNewUser) {
        setShowRegisterNotice(true);
        showToast("Account not found. Please create a new account.", "warning");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Please enter your work email", "warning");
      return;
    }
    setIsForgotSending(true);
    setTimeout(() => {
      showToast("Verification link sent! Please check your inbox.", "success");
      setIsForgotSending(false);
      setShowForgotPassword(false);
      setForgotEmail("");
    }, 1200);
  };

  // Quick sandbox login helper
  const quickLogin = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("password123");
    setShowRegisterNotice(false);
    showToast(`Pre-populated ${presetEmail.split("@")[0]} credentials! Click Sign In to execute.`, "info");
  };

  const containerVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.06,
        ease: "easeOut"
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" } 
    }
  };

  return (
    <div 
      id="login-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans"
    >
      {/* LEFT PANEL: Ambient Showcase & Mock Monitor (Hidden on mobile) */}
      <div 
        id="login-showcase-pane"
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between relative overflow-hidden select-none"
      >
        {/* Dynamic Glowing Blurred Blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-700/15 rounded-full blur-3xl animate-pulse" />

        {/* Brand & Logo */}
        <div className="flex items-center gap-3 z-10 animate-fade-in" id="showcase-brand-header">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            TF
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">TeamFlow</h3>
            <p className="text-[10px] text-indigo-300 font-semibold tracking-wider font-mono">CORE PLATFORM</p>
          </div>
        </div>

        {/* Interactive Workspace Monitor Mock */}
        <div className="z-10 my-auto max-w-md" id="showcase-monitor-mock">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Orchestrate workforce objectives with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">surgical precision</span>.
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Unify incident logging, task registers, and dynamic snapshot generation under a high-fidelity workspace dashboard.
          </p>

          {/* Interactive Live-Feel Dashboard widgets stack */}
          <div className="flex flex-col gap-4 bg-slate-950/45 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl" id="mock-monitor-canvas">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Live Engine Pulse
              </span>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping mr-1" />
                SYSTEM ONLINE
              </div>
            </div>

            {/* Task Row */}
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/40 rounded-xl p-3" id="mock-task-row">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Apollo Q3 Compliance Audit</h4>
                  <p className="text-[10px] text-slate-500">Task assigned to Alice (Admin)</p>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded uppercase font-mono">
                Completed
              </span>
            </div>

            {/* Incident Row */}
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/40 rounded-xl p-3" id="mock-incident-row">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Database Replication Spikes</h4>
                  <p className="text-[10px] text-slate-500">Incident logged near milestone</p>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded uppercase font-mono animate-pulse">
                High Priority
              </span>
            </div>

            {/* Compiled Snapshot Animation */}
            <div className="bg-slate-900/30 border border-slate-800/30 rounded-xl p-3 flex flex-col gap-2" id="mock-compilation-row">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  Generating Snapshot Ledger
                </span>
                <span className="text-indigo-400 font-mono font-bold">In Progress</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footnotes */}
        <div className="z-10 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/40 pt-6" id="showcase-footer">
          <span>Roster Platform &copy; 2026</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            V1.4.2 Production
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Sleek Login Form */}
      <div 
        id="login-form-pane"
        className="w-full md:w-1/2 bg-slate-50/50 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <motion.div 
          className="w-full max-w-md flex flex-col gap-6"
          id="login-inner-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Brand header on mobile (hidden on md+) */}
          <motion.div 
            className="flex flex-col items-center text-center md:hidden" 
            id="login-brand-header-mobile"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 mb-3">
              TF
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">TeamFlow</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Full-Spectrum Project Management & Incident Engine
            </p>
          </motion.div>

          {/* Desktop welcome header */}
          <motion.div 
            className="hidden md:block text-left" 
            id="login-brand-header-desktop"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter credentials below to enter your workspace ledger
            </p>
          </motion.div>

          {/* Login Form Card */}
          <motion.div variants={itemVariants} id="login-form-card-wrapper">
            <Card id="login-form-card" className="border border-slate-100/80 shadow-2xl shadow-indigo-100/50 bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden p-6 sm:p-7">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
                Identity Credentials
              </h2>

              {showRegisterNotice && (
                <div className="mb-4 p-3.5 bg-indigo-50/75 border border-indigo-100 rounded-xl flex flex-col gap-2 animate-fade-in" id="login-new-user-alert">
                  <p className="text-xs text-indigo-800 font-semibold leading-relaxed">
                    We couldn't find an account for <span className="font-bold">{email}</span>. Please register to create an account!
                  </p>
                  <Link 
                    to="/register" 
                    state={{ email }}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-center transition-colors self-start shadow-sm shadow-indigo-200"
                  >
                    Create a New Account
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
                {/* Email address field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="login-email">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      disabled={loading}
                      placeholder="e.g. alice@teamflow.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setShowRegisterNotice(false);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="login-password">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me checkbox */}
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600">Remember my email</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 font-bold tracking-wide cursor-pointer"
                  loading={loading}
                  disabled={loading}
                  id="submit-login-btn"
                >
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="relative flex py-4 items-center" id="divider-element">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-300 font-bold uppercase tracking-wider">Gateway Access</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <p className="text-xs text-center text-slate-500">
                Don't have an account?{" "}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors underline decoration-2 decoration-indigo-200 hover:decoration-indigo-500 underline-offset-4">
                  Create an account
                </Link>
              </p>
            </Card>
          </motion.div>

          {/* Sandbox Evaluation Presets */}
          <motion.div 
            id="evaluation-presets-panel"
            className="bg-slate-100/50 backdrop-blur-xs border border-slate-200/45 rounded-2xl p-4"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-slate-600 animate-pulse" />
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                Instant Sandbox Access
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              Skip typing! Choose a profile below to automatically fill credential tokens:
            </p>
            <div className="grid grid-cols-3 gap-2" id="preset-buttons-container">
              <button
                type="button"
                onClick={() => quickLogin("alice@teamflow.com")}
                className="px-2 py-2 bg-white hover:bg-indigo-50/50 border border-slate-200/60 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer shadow-xs group"
                id="preset-alice-btn"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 leading-none">Alice</span>
                <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("marcus@teamflow.com")}
                className="px-2 py-2 bg-white hover:bg-emerald-50/50 border border-slate-200/60 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer shadow-xs group"
                id="preset-marcus-btn"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 leading-none">Marcus</span>
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("devin@teamflow.com")}
                className="px-2 py-2 bg-white hover:bg-amber-50/50 border border-slate-200/60 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer shadow-xs group"
                id="preset-devin-btn"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 leading-none">Devin</span>
                <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide">Dev</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-800">Reset Your Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Enter your registered work email below. We'll generate a password recovery token and send you a link to reset your password.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="forgot-email">
                    Work Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. alice@teamflow.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium animate-fade-in"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotSending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isForgotSending ? "Sending link..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
