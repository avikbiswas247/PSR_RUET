"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { getRoleHomeLabel, getRoleHomePath } from "@/lib/auth/role-home";
import { Menu, X } from "lucide-react";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/photographers") return pathname.startsWith("/photographers") || pathname.startsWith("/portfolios");
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SiteHeaderProps {
  className?: string;
  scrolled?: boolean;
}

export function SiteHeader({
  className,
  scrolled = false,
}: SiteHeaderProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <header className={`site-header ${scrolled ? "scrolled" : ""} ${className || ""}`}>
        <Link href="/" className="wordmark" aria-label="PSR home">
          <BrandLogo height={48} preload />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-link ${isActivePath(pathname, "/") ? "active" : ""}`} aria-current={isActivePath(pathname, "/") ? "page" : undefined}>Home</Link>
          <Link href="/photographers" className={`nav-link ${isActivePath(pathname, "/photographers") ? "active" : ""}`} aria-current={isActivePath(pathname, "/photographers") ? "page" : undefined}>Portfolios</Link>
          <Link href="/events" className={`nav-link ${isActivePath(pathname, "/events") ? "active" : ""}`} aria-current={isActivePath(pathname, "/events") ? "page" : undefined}>Events</Link>
          <Link href="/exhibitions" className={`nav-link ${isActivePath(pathname, "/exhibitions") ? "active" : ""}`} aria-current={isActivePath(pathname, "/exhibitions") ? "page" : undefined}>Exhibitions</Link>
          <Link href="/membership" className={`nav-link ${isActivePath(pathname, "/membership") ? "active" : ""}`} aria-current={isActivePath(pathname, "/membership") ? "page" : undefined}>Join PSR</Link>
        </nav>
        <div className="header-actions">
          <button type="button" className="mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-links">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
        <MobileNavigation isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </header>
    );
  }

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""} ${className || ""}`}>
      <Link href="/" className="wordmark" aria-label="PSR home">
        <BrandLogo height={48} preload />
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/" className={`nav-link ${isActivePath(pathname, "/") ? "active" : ""}`} aria-current={isActivePath(pathname, "/") ? "page" : undefined}>Home</Link>
        <Link href="/photographers" className={`nav-link ${isActivePath(pathname, "/photographers") ? "active" : ""}`} aria-current={isActivePath(pathname, "/photographers") ? "page" : undefined}>Portfolios</Link>
        <Link href="/events" className={`nav-link ${isActivePath(pathname, "/events") ? "active" : ""}`} aria-current={isActivePath(pathname, "/events") ? "page" : undefined}>Events</Link>
        <Link href="/exhibitions" className={`nav-link ${isActivePath(pathname, "/exhibitions") ? "active" : ""}`} aria-current={isActivePath(pathname, "/exhibitions") ? "page" : undefined}>Exhibitions</Link>
        <Link href="/membership" className={`nav-link ${isActivePath(pathname, "/membership") ? "active" : ""}`} aria-current={isActivePath(pathname, "/membership") ? "page" : undefined}>Join PSR</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <button type="button" className="mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-links">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        {user ? (
          <Link
            href={getRoleHomePath(user.roles)}
            className="button button-small button-outline"
          >
            {getRoleHomeLabel(user.roles)} <span>↗</span>
          </Link>
        ) : (
          <>
            <Link href="/sign-in" className="button button-small button-outline auth-nav-signin" aria-label="Sign in">
              Sign in <span>↗</span>
            </Link>
            <Link href="/register" className="button button-small auth-button" aria-label="Create account">
              Create account <span>↗</span>
            </Link>
          </>
        )}
      </div>
      <MobileNavigation isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
