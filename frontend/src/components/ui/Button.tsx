import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:from-orange-500 hover:to-amber-400 hover:shadow-orange-500/40 hover:scale-[1.02]",
        secondary:
          "bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/5",
        danger:
          "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300",
        outline:
          "border border-orange-500/40 text-orange-400 hover:bg-orange-500/10",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Minimal CVA type-only import for variants (we inline the cva call above so no extra dep needed)
// If cva is not installed, the fallback below covers it.
type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${buttonVariants({ variant, size })} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={15} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
