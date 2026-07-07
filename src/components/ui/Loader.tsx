import { motion } from "motion/react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "gray";
  fullPage?: boolean;
}

export default function Loader({ size = "md", color = "primary", fullPage = false }: LoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    primary: "border-indigo-600 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-300 border-t-transparent",
  };

  const spinner = (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className={`rounded-full border-solid ${sizeClasses[size]} ${colorClasses[color]}`}
      id="ui-loader-spinner"
    />
  );

  if (fullPage) {
    return (
      <div 
        id="ui-loader-fullscreen-container"
        className="fixed inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <span className="text-sm font-medium text-slate-500 animate-pulse">Loading TeamFlow...</span>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center" id="ui-loader-container">{spinner}</div>;
}
