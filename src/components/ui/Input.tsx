import React, { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full flex flex-col gap-1.5" id={`container-${inputId}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl shadow-xs placeholder-slate-400/80 focus:outline-none focus:ring-2 transition-all duration-200
              ${
                error
                  ? "border-rose-400 focus:ring-rose-100 focus:border-rose-500 text-rose-900"
                  : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
              }
              disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600 animate-slide-down" id={`err-${inputId}`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400" id={`help-${inputId}`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
