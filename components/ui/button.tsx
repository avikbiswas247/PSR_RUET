"use client";

import * as React from "react";

type ButtonVariant = "primary" | "outline" | "quiet" | "small";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function buttonBase(variant: ButtonVariant, size: ButtonSize): string {
  const base =
    "inline-flex items-center justify-center gap-10 text-xs uppercase font-bold tracking-wider transition-all duration-300 rounded-sm disabled:opacity-60 disabled:pointer-events-none disabled:transform-none";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-orange text-[#14110f] hover:bg-[#ff8b3e] hover:shadow-[0_0_24px_rgba(255,116,23,0.35)]",
    outline:
      "border line-border bg-transparent text-text hover:border-orange hover:text-orange",
    quiet:
      "bg-transparent text-text pl-0 border-none hover:text-orange",
    small: "text-text",
  };
  const sizes: Record<ButtonSize, string> = {
    default: "px-3 py-1.5",
    sm: "px-2 py-0.5 gap-8",
    lg: "px-5 py-1.5",
  };
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonBase(variant, size)} ${className || ""}`}
      {...props}
    />
  );
}
