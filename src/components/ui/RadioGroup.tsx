"use client";

import { createContext, useContext, ReactNode, useId } from "react";
import { clsx } from "clsx";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroup() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx)
    throw new Error("Radio components must be used within <RadioGroup>");
  return ctx;
}

export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({
  value,
  onChange,
  children,
  className,
}: RadioGroupProps) {
  const name = useId();
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange }}>
      <div className={className}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  value: string;
  children: ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Radio({
  value,
  children,
  description,
  disabled = false,
  className,
}: RadioProps) {
  const { name, value: selected, onChange } = useRadioGroup();
  const id = useId();
  const checked = selected === value;

  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
        checked
          ? "border-amber-500 bg-amber-500/10"
          : "border-zinc-800 hover:border-zinc-600",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          "mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border",
          "border-zinc-600 bg-zinc-900/80",
          "peer-checked:border-amber-500 peer-checked:bg-amber-500/80",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/60"
        )}
      >
        <span
          className={clsx(
            "h-2 w-2 rounded-full bg-transparent transition-opacity",
            checked ? "opacity-100 bg-zinc-50" : "opacity-0"
          )}
        />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-zinc-100">{children}</span>
        {description && (
          <span className="text-xs text-zinc-500">{description}</span>
        )}
      </div>
    </label>
  );
}
