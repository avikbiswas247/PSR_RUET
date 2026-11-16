"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { AccountSidebar } from "@/components/account/sidebar";

const sidebarItems = [
  { href: "/account", label: "Dashboard", key: "dashboard", icon: "\u260E" },
  { href: "/account/profile", label: "My Profile", key: "my-profile", icon: "\u270D\uFE0F" },
  { href: "/account/bookings", label: "My Bookings", key: "my-bookings", icon: "\u270B\uFE0F" },
  { href: "/account/notifications", label: "Notifications", key: "notifications", icon: "\u2709\uFE0F" },
  { href: "/account/settings", label: "Settings", key: "settings", icon: "\u2699\uFE0F" },
];

export default function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="section-pad flex h-[60vh] items-center justify-center"><div className="skeleton h2 w-1/3" /></main>;
  if (!user) return <main className="section-pad mx-auto max-w-[480px] py-20 text-center"><h1 className="mb-4 text-[40px] font-bold tracking-tight">Account</h1><p className="mb-8 text-muted">Please sign in to access your account.</p><Link href="/sign-in" className="button button-primary">Sign in</Link></main>;
  return <div className="account-shell flex h-screen flex-col overflow-hidden lg:flex-row"><AccountSidebar active={sidebarItems[0].key} items={sidebarItems} /><div className="min-h-0 flex-1 overflow-y-auto bg-bg"><header className="sticky top-0 z-10 flex items-center justify-between border-b line-border bg-bg/80 px-6 py-4 backdrop-blur-sm"><div /></header><main className="section-pad">{children}</main></div></div>;
}
