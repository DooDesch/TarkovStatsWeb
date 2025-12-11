"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "glass" | "outline" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const variants = {
  default: "bg-zinc-900/80 border border-zinc-800",
  glass: "bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50",
  outline: "bg-transparent border border-zinc-700",
  gradient: "bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800",
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "rounded-xl",
        variants[variant],
        paddings[padding],
        hover && "transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={clsx("text-lg font-semibold text-zinc-100", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={clsx("text-sm text-zinc-400", className)}>{children}</p>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mt-4 pt-4 border-t border-zinc-800", className)}>
      {children}
    </div>
  );
}
