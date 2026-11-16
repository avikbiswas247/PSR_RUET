"use client";

import React from "react";

interface CameraIllustrationProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "w-48 h-32",
  md: "w-64 h-40",
  lg: "w-80 h-48",
};

export function CameraIllustration({
  className,
  size = "md",
  animate = true,
}: CameraIllustrationProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <figure
      className={`camera-illustration relative ${sizeClasses[size]} ${className || ""}`}
      aria-label="Retro mirrorless camera illustration"
    >
      {/* Body */}
      <div
        className={`camera-body ${shouldAnimate ? "animate-float" : ""}`}
        aria-hidden="true"
      >
        {/* Top plate */}
        <div className="camera-top" />
        {/* Viewfinder */}
        <div className="camera-viewfinder" />
        {/* Shutter button */}
        <button
          type="button"
          className={`camera-shutter ${shouldAnimate ? "animate-shutter" : ""}`}
          aria-label="Shutter"
          disabled
        />
        {/* Front lens housing */}
        <div className="camera-lens-group">
          {/* Focus ring */}
          <div
            className={`camera-focus-ring ${
              shouldAnimate ? "animate-focus-ring" : ""
            }`}
            aria-hidden="true"
          />
          {/* Lens elements */}
          <div className="camera-lens-inner" />
          <div className="camera-lens-aperture">
            {/* Aperture blades */}
            <div className="aperture-blade" />
            <div className="aperture-blade" />
            <div className="aperture-blade" />
            <div className="aperture-blade" />
            <div className="aperture-blade" />
            <div className="aperture-blade" />
          </div>
        </div>
        {/* Grip */}
        <div className="camera-grip" />
        {/* Orange focus indicator */}
        <div
          className="camera-focus-indicator"
          aria-hidden="true"
        />
        {/* Viewfinder framing marks */}
        <div className="camera-framing-marks" aria-hidden="true" />
      </div>
      <figcaption className="sr-only">
        Original retro mirrorless camera illustration with subtle aperture,
        focus-ring, and shutter animation.
      </figcaption>
    </figure>
  );
}
