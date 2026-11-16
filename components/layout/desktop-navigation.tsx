import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/photographers", label: "Portfolios" },
  { href: "/events", label: "Events" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/membership", label: "Join PSR" },
];

interface DesktopNavigationProps {
  className?: string;
  activeHref?: string;
}

export function DesktopNavigation({
  className,
  activeHref,
}: DesktopNavigationProps) {
  const pathname = usePathname();
  const current = activeHref ?? pathname;
  const isActive = (href: string) => href === "/" ? current === "/" : (href === "/photographers" ? current.startsWith("/photographers") || current.startsWith("/portfolios") : current === href || current.startsWith(`${href}/`));
  return (
    <nav
      className={`desktop-nav ${className || ""}`}
      aria-label="Main navigation"
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${isActive(item.href) ? "active" : ""}`}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
