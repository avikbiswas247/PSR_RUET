"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";

export function SiteFooter({ className }: { className?: string }) {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className={`site-footer ${className || ""}`}>
      <Link href="/" className="wordmark" aria-label="PSR home">
        <BrandLogo height={48} />
      </Link>
      <span>PSR</span>
      <span>MADE OF LIGHT & STORIES © {year}</span>
    </footer>
  );
}
