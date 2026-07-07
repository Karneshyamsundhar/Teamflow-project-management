import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Compass, Home, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button.tsx";

export default function NotFound() {
  return (
    <div 
      className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans"
      id="not-found-page"
    >
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-md z-10 space-y-6"
      >
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <Compass className="w-12 h-12 text-white animate-spin-slow" style={{ animationDuration: "12s" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight font-display">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Workspace Page Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The requested pipeline, task board, or setting screen does not exist or has been archived.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="outline" 
            size="md" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button 
              variant="primary" 
              size="md" 
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
