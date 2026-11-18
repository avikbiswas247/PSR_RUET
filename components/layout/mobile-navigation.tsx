"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getRoleHomeLabel, getRoleHomePath } from "@/lib/auth/role-home";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/portfolios", label: "Portfolios" },
  { href: "/events", label: "Events" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/membership", label: "Join PSR" },
];

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MobileNavigation({
  isOpen,
  onClose,
  className,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const active = (href: string) => href === "/" ? pathname === "/" : (href === "/portfolios" ? pathname.startsWith("/portfolios") || pathname.startsWith("/photographers") : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <div
      id="mobile-links"
      className={`mobile-links ${isOpen ? "open" : ""} ${className || ""}`}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={active(item.href) ? "active" : ""}
          aria-current={active(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
      {user ? (
        <Link href={getRoleHomePath(user.roles)} onClick={onClose} className="mobile-account-link">
          {getRoleHomeLabel(user.roles)}
        </Link>
      ) : (
        <>
          <Link href="/sign-in" onClick={onClose} className="mobile-auth-link mobile-auth-link-secondary">Sign in</Link>
          <Link href="/register" onClick={onClose} className="mobile-auth-link mobile-auth-link-primary">Create account</Link>
        </>
      )}
    </div>
  );
}

export function MobileMenuButton({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      type="button"
      className="mobile-menu"
      onClick={onToggle}
      aria-label="Open navigation"
      aria-expanded={false}
    >
      ☰
    </button>
  );
}
