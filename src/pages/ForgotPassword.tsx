import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/ui/Toast.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Card from "../components/ui/Card.tsx";
import { motion } from "motion/react";
import { Mail, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetLink, setDevResetLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      showToast("Please enter your work email address.", "warning");
      return;
    }

    setLoading(true);
    setDevResetLink("");
    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      showToast(res.data.message || "Reset link dispatched!", "success");
      
      // In development/sandbox environments, capture the returned reset URL for instant testing
      if (res.data.resetUrl) {
        setDevResetLink(res.data.resetUrl);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to process forgot password request.";
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
      id="forgot-password-page-wrapper"
    >
      {/* Decorative ambient glowing grids */}
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
              <KeyRound className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Forgot Password</h1>
            <p className="text-xs text-slate-500 mt-2">
              Enter your registered work email to receive password restoration credentials.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4" id="forgot-password-form">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-semibold rounded-xl"
                loading={loading}
                id="forgot-password-submit-btn"
              >
                Send Reset Credentials
              </Button>
            </form>
          ) : (
            <div className="space-y-5 text-center" id="forgot-password-success-pane">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-left flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Instructions Dispatched</h4>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-normal">
                    We've sent password restoration links to <strong className="font-semibold">{email}</strong>. Check your spam box if it doesn't arrive within 2 minutes.
                  </p>
                </div>
              </div>

              {devResetLink && (
                <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Dev Sandbox Shortcut</h5>
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-normal">
                    Development Mode-A password reset link has been generated for local development.Use the link below to continue testing:
                  </p>
                  <a
                    href={devResetLink}
                    className="mt-2.5 block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors border border-indigo-500/20"
                    id="dev-reset-shortcut-btn"
                  >
                    Go to Password Reset Page
                  </a>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={() => setSubmitted(false)}
              >
                Try Another Email Address
              </Button>
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
