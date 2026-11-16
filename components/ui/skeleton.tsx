"use client";

import * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "circle" | "line" | "h2" | "block";
  className?: string;
}

export function Skeleton({
  variant = "block",
  className,
  ...props
}: SkeletonProps) {
  const base = "skeleton animate-pulse rounded";
  const variantClasses = {
    circle: "w-9 h-9 rounded-full",
    line: "h-[18px] w-full",
    h2: "h-[28px] w-3/5",
    block: "h-[14px] w-full",
  };
  return (
    <div
      className={`${base} ${variantClasses[variant]} ${className || ""}`}
      {...props}
    />
  );
}
