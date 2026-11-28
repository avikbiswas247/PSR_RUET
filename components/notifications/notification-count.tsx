"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

const NotificationCountContext = createContext<{ userId: string | null; count: number }>({ userId: null, count: 0 });

export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<{ userId: string | null; count: number }>({ userId: null, count: 0 });

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | null = null;
    let inFlight = false;
    let disposed = false;

    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };

    const loadCount = async () => {
      if (disposed || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      request = new AbortController();
      try {
        const response = await fetch("/api/notifications?unreadCount=true", { signal: request.signal, credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const payload = await response.json() as { data?: { unreadCount?: number } };
          const next = payload.data?.unreadCount;
          if (typeof next === "number" && Number.isFinite(next)) setState({ userId: user.id, count: next });
        }
      } catch {
        // Keep the last known count during temporary network errors.
      } finally {
        inFlight = false;
        request = null;
        if (!disposed && document.visibilityState === "visible") timer = setTimeout(loadCount, 30_000);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimer();
      } else {
        clearTimer();
        void loadCount();
      }
    };

    void loadCount();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      clearTimer();
      request?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user?.id]);

  return <NotificationCountContext.Provider value={state}>{children}</NotificationCountContext.Provider>;
}

export function NotificationCountBadge() {
  const { user } = useAuth();
  const state = useContext(NotificationCountContext);
  const count = state.userId === user?.id ? state.count : 0;
  if (count < 1) return null;
  return <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-orange px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#14110f]">{count > 99 ? "99+" : count}</span>;
}

type NavItem = { href: string; label: string; key: string; icon: string };

export function WorkspaceMobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return <nav aria-label="Workspace navigation" className="flex min-w-0 gap-1 overflow-x-auto lg:hidden">
    {items.map((item) => {
      const active = pathname === item.href || (item.href !== "/account" && item.href !== "/photographer" && pathname.startsWith(`${item.href}/`));
      return <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm px-3 text-xs font-semibold ${active ? "bg-orange/10 text-orange" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
        <span aria-hidden="true">{item.icon}</span>{item.label}{item.href.endsWith("/notifications") && <NotificationCountBadge />}
      </Link>;
    })}
  </nav>;
}
