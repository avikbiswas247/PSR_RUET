"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Image,
  ImageIcon,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GalleryVerticalEnd,
  Star,
  Bell,
  Settings,
  Activity,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/layout/brand-logo";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/membership-applications", label: "Membership Applications", icon: UserCheck },
      { href: "/admin/management", label: "Admin Management", icon: ShieldCheck },
    ],
  },
  {
    label: "Photography",
    items: [
      { href: "/admin/photographers", label: "Photographers", icon: ImageIcon },
      { href: "/admin/photos", label: "Photo Moderation", icon: Image },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/exhibitions", label: "Exhibitions", icon: GalleryVerticalEnd },
      { href: "/admin/participation", label: "Participation Forms", icon: ClipboardList },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/site-settings", label: "Homepage Manager", icon: Settings },
      { href: "/admin/awards", label: "Awards", icon: Star },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/audit-logs", label: "Activity Log", icon: Activity },
    ],
  },
];

type NavItem = { href: string; label: string; icon: React.ElementType };

export default function AdminLayout({
  children,
  isFounder,
}: {
  children: React.ReactNode;
  isFounder?: boolean;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const drawerClass = sidebarOpen
    ? "fixed inset-y-0 left-0 z-50 w-[280px] translate-x-0 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0"
    : "fixed inset-y-0 left-0 z-50 w-[280px] -translate-x-full transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0";

  const backdropClass = React.useMemo(() => {
    return sidebarOpen
      ? "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 opacity-100 pointer-events-auto lg:hidden"
      : "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 opacity-0 pointer-events-none lg:hidden";
  }, [sidebarOpen]);

  // Reset sidebar scroll to top on mount
  React.useEffect(() => {
    const nav = document.querySelector("[data-admin-sidebar-nav]");
    if (nav) {
      nav.scrollTop = 0;
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#090909]">
      {/* Sidebar */}
      <aside
        className={drawerClass}
        aria-label="Admin navigation"
      >
        <div className="flex h-full w-full flex-col border-r border-line-border bg-surface">
          {/* Brand */}
          <div className="p-5 border-b border-line-border">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo height={48} preload />
            </Link>
            {user && (
              <>
                <p className="text-xs text-muted mt-2">{user.full_name || user.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-orange font-bold mt-1">
                  Administrator{isFounder ? " \u00b7 Founder" : ""}
                </p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav data-admin-sidebar-nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <h3 className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted font-bold">
                  {group.label}
                </h3>
                {group.items.map((item) => {
                  const ActiveIcon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                        isActive
                          ? "bg-orange/10 text-orange font-bold border-r-2 border-orange"
                          : "text-muted hover:text-text hover:bg-surface-2"
                      }`}
                    >
                      <ActiveIcon className="w-4 h-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Account section anchored at bottom */}
          <div className="p-3 border-t border-line-border mt-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm text-sm text-muted hover:text-text hover:bg-surface-2 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 lg:hidden text-muted hover:text-text"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* Mobile backdrop */}
      <div
        className={backdropClass}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Main content */}
      <main className="relative min-h-screen min-w-0 flex-1">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 border-b border-line-border bg-[#090909]/80 backdrop-blur px-6 py-3 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="lg:hidden text-muted hover:text-text"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-[20px] tracking-tight font-bold text-text">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-[11px] text-muted uppercase tracking-wider font-bold hover:text-text">
                <ChevronRight className="w-3 h-3 mr-1" aria-hidden="true" />
                Visit website
              </Link>
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-[#14110f]">
                  {(user?.full_name || user?.email || "A").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user?.full_name || user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
