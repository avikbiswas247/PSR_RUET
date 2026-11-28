"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NotificationCountBadge } from "@/components/notifications/notification-count";

type SidebarItem = { href: string; label: string; key: string; icon: string };

export function PhotographerSidebar({
  active,
  items,
}: {
  active: string;
  items: SidebarItem[];
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const clientActive = items.find(
    (item) => pathname === item.href || (item.href !== "/photographer" && pathname.startsWith(`${item.href}/`))
  )?.key ?? active;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="account-sidebar hidden lg:block border-r line-border bg-surface w-64 h-full sticky top-0">
      <div className="p-6 border-b line-border">
        <Link href="/" className="wordmark">
          <BrandLogo height={46} />
        </Link>
        <p className="text-xs text-muted mt-3">{user?.full_name || user?.fullName || user?.email}</p>
        <p className="text-[10px] uppercase tracking-wider text-orange font-bold mt-1">
          Photographer
        </p>
      </div>
      <nav className="p-4 space-y-1" aria-label="Photographer navigation">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={clientActive === item.key ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
              clientActive === item.key
                ? "bg-orange/10 text-orange font-bold border-r-2 border-orange"
                : "text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.href.endsWith("/notifications") && <NotificationCountBadge />}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t line-border mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm text-sm text-muted hover:text-text hover:bg-surface-2 transition-colors"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
