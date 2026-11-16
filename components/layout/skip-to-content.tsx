export function SkipToContent({ className }: { className?: string }) {
  return (
    <a
      href="#main-content"
      className={`skip-to-content sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-[60] focus:px-4 focus:py-2 focus:bg-orange focus:text-[#14110f] focus:rounded-sm ${className || ""}`}
    >
      Skip to main content
    </a>
  );
}
