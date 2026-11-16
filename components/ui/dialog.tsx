"use client";

import * as React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  closeLabel?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  closeLabel = "Close",
}: DialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      contentRef.current?.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/78 backdrop-blur-[12px] -webkit-backdrop-blur-[12px] grid place-items-center p-6 overflow-auto"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        tabIndex={-1}
        className="relative w-full max-w-[500px] max-h-[calc(100svh-48px)] overflow-auto bg-surface border line-border radius p-11 shadow animate-[modal-rise_0.45s_cubic-bezier(0.23,1,0.32,1)_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-5 top-4 p-1 text-muted hover:text-orange"
          onClick={() => onOpenChange(false)}
          aria-label={closeLabel}
        >
          ×
        </button>
        {title && (
          <h2 id="dialog-title" className="text-[36px] tracking-tight font-bold mb-2 leading-1.2">
            {title}
          </h2>
        )}
        {description && (
          <p id="dialog-description" className="text-sm text-muted leading-1.7 mb-6">
            {description}
          </p>
        )}
        <div className="pt-2">{children}</div>
      </div>
    </>
  );
}
