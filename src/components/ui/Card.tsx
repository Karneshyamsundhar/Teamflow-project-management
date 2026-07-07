import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  id?: string;
  hoverEffect?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  action,
  className = "",
  id = "ui-card-container",
  hoverEffect = false,
}: CardProps) {
  const hoverClass = hoverEffect
    ? "hover:-translate-y-1 hover:shadow-md hover:border-slate-200 premium-card-shadow-hover transition-all duration-300 ease-out cursor-pointer"
    : "premium-card-shadow";

  return (
    <div
      id={id}
      className={`bg-white border border-slate-100/80 rounded-2xl overflow-hidden transition-all duration-300 ${hoverClass} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-4 bg-slate-50/20" id="ui-card-header">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-800 leading-none">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1.5 text-xs text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0" id="ui-card-action">{action}</div>}
        </div>
      )}
      <div className="p-5" id="ui-card-body">{children}</div>
    </div>
  );
}
