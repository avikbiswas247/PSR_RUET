"use client";

import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const id = props.id || "input";
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-3 text-text border line-border rounded-sm transition-colors focus:border-orange focus:ring-1 focus:ring-orange/25 outline-none disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-orange-deep">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: TextareaProps) {
  const id = props.id || "textarea";
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full px-4 py-3 text-text border line-border rounded-sm transition-colors focus:border-orange focus:ring-1 focus:ring-orange/25 outline-none resize-y disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-orange-deep">{error}</p>
      )}
    </div>
  );
}
