import * as React from "react";
import { motion } from "motion/react";
import Loader from "./Loader.tsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs font-sans tracking-tight";

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm shadow-indigo-100 border border-indigo-700/30",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300 border border-slate-200/50",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm shadow-rose-100 border border-rose-700/30",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm shadow-emerald-100 border border-emerald-700/30",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-200",
    outline: "bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-indigo-500",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-4.5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <motion.button
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      id={`ui-btn-${variant}`}
      {...(props as any)}
    >
      {loading ? (
        <>
          <Loader size="sm" color={variant === "primary" || variant === "danger" || variant === "success" ? "white" : "primary"} />
          <span className="opacity-80">Please wait...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
