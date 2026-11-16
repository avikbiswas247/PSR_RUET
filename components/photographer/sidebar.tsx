"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/layout/brand-logo";

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

  const href = typeof window !== "undefined" ? window.location.pathname : "";
  const clientActive = items.find((i) => href === i.href)?.key ?? active;

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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
              clientActive === item.key
                ? "bg-orange/10 text-orange font-bold border-r-2 border-orange"
                : "text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t line-border mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm text-sm text-muted hover:text-text hover:bg-surface-2 transition-colors"
        >
          <span aria-hidden="true">\u2718</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
