import { type HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "orange"
  | "green"
  | "red"
  | "blue"
  | "purple"
  | "yellow"
  | "slate";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-slate-300 border-white/10",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  slate: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  orange: "bg-orange-400",
  green: "bg-emerald-400",
  red: "bg-red-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  yellow: "bg-yellow-400",
  slate: "bg-slate-400",
};

/** Helper to map TeamStatus / RoundStatus to a variant */
export function statusToVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: "yellow",
    APPROVED: "green",
    DISQUALIFIED: "red",
    SUBMISSION_OPEN: "blue",
    CALIBRATION: "purple",
    EVALUATION: "orange",
    COMPLETED: "green",
  };
  return map[status] ?? "default";
}

function Badge({ variant = "default", dot = false, className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
