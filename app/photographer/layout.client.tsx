"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { PhotographerSidebar } from "@/components/photographer/sidebar";

const sidebarItems = [
  { href: "/photographer", label: "Dashboard", key: "dashboard", icon: "\u260E" },
  { href: "/photographer/profile", label: "My Profile", key: "my-profile", icon: "\u270D\uFE0F" },
  { href: "/photographer/portfolio", label: "Portfolio", key: "portfolio", icon: "\u270D\uFE0F" },
  { href: "/photographer/photos", label: "Photos", key: "photos", icon: "\u270B\uFE0F" },
  { href: "/photographer/availability", label: "Availability", key: "availability", icon: "\u260E" },
  { href: "/photographer/bookings", label: "Bookings", key: "bookings", icon: "\u270B\uFE0F" },
  { href: "/photographer/messages", label: "Messages", key: "messages", icon: "\u2709\uFE0F" },
  { href: "/photographer/notifications", label: "Notifications", key: "notifications", icon: "\u2709\uFE0F" },
  { href: "/photographer/settings", label: "Settings", key: "settings", icon: "\u2699\uFE0F" },
];

export default function PhotographerLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="section-pad flex h-[60vh] items-center justify-center"><div className="skeleton h2 w-1/3" /></main>;
  if (!user || !user.roles?.includes("PHOTOGRAPHER")) return <main className="section-pad mx-auto max-w-[480px] py-20 text-center"><h1 className="mb-4 text-[40px] font-bold tracking-tight">Photographer Workspace</h1><p className="mb-8 text-muted">This workspace is for registered photographers. Sign in with a photographer account to continue.</p><Link href="/sign-in" className="button button-primary">Sign in</Link></main>;
  return <div className="account-shell flex h-screen flex-col overflow-hidden lg:flex-row"><PhotographerSidebar active={sidebarItems[0].key} items={sidebarItems} /><div className="min-h-0 flex-1 overflow-y-auto bg-bg"><header className="sticky top-0 z-10 flex items-center justify-between border-b line-border bg-bg/80 px-6 py-4 backdrop-blur-sm"><div /></header><main className="section-pad">{children}</main></div></div>;
}
