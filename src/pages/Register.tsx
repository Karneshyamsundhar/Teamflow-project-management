import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../components/ui/Toast.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Card from "../components/ui/Card.tsx";
import { motion } from "motion/react";
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  ShieldAlert, 
  Briefcase, 
  ArrowRight, 
  Check, 
  Eye, 
  EyeOff,
  Sparkles,
  Award
} from "lucide-react";

export default function Register() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState("3"); // Default to Developer
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength states
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("Too Weak");
  const [strengthColor, setStrengthColor] = useState("bg-slate-200");

  useEffect(() => {
    // Password Strength Evaluator
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrengthScore(score);

    if (score <= 1) {
      setStrengthLabel("Too Weak");
      setStrengthColor("bg-rose-500");
    } else if (score === 2) {
      setStrengthLabel("Weak");
      setStrengthColor("bg-orange-500");
    } else if (score === 3) {
      setStrengthLabel("Medium");
      setStrengthColor("bg-yellow-500");
    } else if (score === 4) {
      setStrengthLabel("Strong");
      setStrengthColor("bg-emerald-500");
    } else {
      setStrengthLabel("Very Strong");
      setStrengthColor("bg-indigo-600");
    }
  }, [password]);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showToast("Please enter your full name", "warning");
      return;
    }
    if (!validateEmail(email)) {
      showToast("Please enter a valid work email address", "warning");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters long", "warning");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        roleId: parseInt(roleId, 10),
      });
      const { token, user } = res.data;
      login(token, user);
      showToast(`Account created successfully! Welcome, ${user.name}!`, "success");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || "Registration failed. Email might already be taken.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05,
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
      id="register-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] font-sans"
    >
      <motion.div 
        className="w-full max-w-lg flex flex-col gap-6" 
        id="register-inner-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand header */}
        <motion.div className="text-center" id="register-brand-header" variants={itemVariants}>
          <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-100 mb-4 animate-bounce">
            TF
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Join TeamFlow</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Register your workspace profile and select your project role
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div variants={itemVariants} id="register-form-card-wrapper">
          <Card id="register-form-card" className="border border-slate-100 shadow-2xl shadow-indigo-100/40 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-7">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
              Workspace Enrollment
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="register-name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium animate-fade-in"
                  />
                </div>
              </div>

              {/* Work Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="register-email">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder="e.g. john.doe@teamflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium animate-fade-in"
                  />
                </div>
                {email && !validateEmail(email) && (
                  <p className="text-[10px] font-semibold text-rose-500">Please enter a valid email structure</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="register-password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      placeholder="Min. 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium animate-fade-in"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength widget */}
                  {password && (
                    <div className="space-y-1.5 pt-1 animate-slide-down">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Strength:</span>
                        <span className="font-bold text-slate-600">{strengthLabel}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div 
                            key={s} 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              s <= strengthScore ? strengthColor : "bg-slate-100"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block" htmlFor="register-confirm-password">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      placeholder="Verify password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium animate-fade-in"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] font-semibold text-rose-500">Passwords do not match yet</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <div className="flex items-center gap-1 pt-1 text-[10px] text-emerald-600 font-semibold animate-slide-down">
                      <Check className="w-3 h-3" /> Passwords match!
                    </div>
                  )}
                </div>
              </div>

              {/* Role Selection Dropdown */}
              <div className="flex flex-col gap-1.5" id="register-role-field-container">
                <label htmlFor="register-role" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  System Workspace Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <select
                    id="register-role"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-semibold cursor-pointer"
                    required
                  >
                    <option value="3">Developer (Task tracking & incident reporting)</option>
                    <option value="2">Manager (Roster mapping & project assignment)</option>
                    <option value="1">Admin (Full system access & schema logs)</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5 font-bold tracking-wide cursor-pointer"
                loading={loading}
                disabled={loading || (password !== confirmPassword && confirmPassword.length > 0)}
                id="submit-register-btn"
              >
                Enroll and Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-xs text-center text-slate-500 mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors underline decoration-2 decoration-indigo-200 hover:decoration-indigo-500 underline-offset-4">
                Sign in instead
              </Link>
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
