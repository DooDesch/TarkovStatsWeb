"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  children?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-500 text-zinc-900 hover:bg-amber-400 active:bg-amber-600 shadow-lg shadow-amber-500/20",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
  danger:
    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-500/20",
  outline:
    "bg-transparent text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2.5",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon: Icon,
      iconPosition = "left",
      loading = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
          variants[variant],
          sizes[size],
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className={clsx("animate-spin", iconSizes[size])} />
        ) : (
          Icon &&
          iconPosition === "left" && (
            <Icon className={iconSizes[size]} />
          )
        )}
        {children}
        {!loading && Icon && iconPosition === "right" && (
          <Icon className={iconSizes[size]} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
