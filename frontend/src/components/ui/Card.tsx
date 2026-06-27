import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle orange top-border glow accent */
  accent?: boolean;
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
}

function Card({ accent = false, padding = "md", className = "", children, ...props }: CardProps) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding];

  return (
    <div
      className={`
        rounded-2xl bg-white/[0.03] border border-white/[0.07]
        backdrop-blur-sm shadow-xl shadow-black/20
        ${accent ? "border-t-orange-500/30" : ""}
        ${paddingClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 mb-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  return (
    <h2
      className={`text-lg font-semibold text-white leading-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

function CardBody({ className = "", children, ...props }: CardBodyProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardBody };
export type { CardProps };
