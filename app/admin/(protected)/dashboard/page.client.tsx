"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Image,
  ImageIcon,
  CalendarCheck,
  CalendarDays,
  GalleryVerticalEnd,
  Star,
  Activity,
  LayoutDashboard,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface StatCard {
  label: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  href: string;
}

interface ActivityItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string | Date;
}

interface StatsResponse {
  totalUsers: number;
  activeUsers: number;
  activeMembers: number;
  pendingMembershipApplications: number;
  registeredPhotographers: number;
  pendingPhotoSubmissions: number;
  approvedPhotographs: number;
  publishedEvents: number;
  upcomingEvents: number;
  publishedExhibitions: number;
  activeBookings: number;
  pendingBookings: number;
  publishedAwards: number;
}

const STAT_ICONS: Record<string, React.ElementType> = {
  "Total Users": Users,
  "Active Users": CheckCircle2,
  "Active Members": UserCheck,
  "Pending Applications": Clock,
  Photographers: ImageIcon,
  "Pending Photos": AlertCircle,
  "Approved Photos": CheckCircle2,
  "Published Events": CalendarDays,
  "Upcoming Events": Clock,
  "Published Exhibitions": GalleryVerticalEnd,
  "Active Bookings": CalendarCheck,
  "Pending Bookings": Clock,
  "Published Awards": Star,
};

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!user) return;
      try {
        setError(null);
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/admin/dashboard/stats"),
          fetch("/api/admin/dashboard/activity"),
        ]);
        if (cancelled) return;
        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats(json.data ?? null);
        } else {
          setError("Failed to load statistics.");
        }
        if (activityRes.ok) {
          const json = await activityRes.json();
          setActivity(json.data ?? []);
        } else {
          setError("Failed to load recent activity.");
        }
      } catch {
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton h-5 w-48" />
        </div>
      </div>
    );
  }

  if (!user || !user.roles?.includes("ADMIN")) {
    return (
      <div className="p-6 lg:p-8 max-w-[720px] mx-auto text-center py-20">
        <div className="mx-auto text-orange mb-6" aria-hidden="true">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[24px] tracking-tight font-bold text-text mb-4">Admin Access Required</h1>
        <p className="text-muted text-lg mb-8">
          This area is restricted to administrators. Your account does not have administrator access.
        </p>
        <Link href="/admin/login" className="button button-primary">
          Sign in as administrator
        </Link>
      </div>
    );
  }

  const statCards: StatCard[] = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, subtitle: "Registered accounts", icon: Users, href: "/admin/users" },
    { label: "Active Users", value: stats?.activeUsers ?? 0, subtitle: "Can log in", icon: CheckCircle2, href: "/admin/users" },
    { label: "Active Members", value: stats?.activeMembers ?? 0, subtitle: "MEMBER role", icon: UserCheck, href: "/admin/users" },
    { label: "Pending Applications", value: stats?.pendingMembershipApplications ?? 0, subtitle: "Awaiting review", icon: Clock, href: "/admin/membership-applications" },
    { label: "Photographers", value: stats?.registeredPhotographers ?? 0, subtitle: "PHOTOGRAPHER role", icon: ImageIcon, href: "/admin/photographers" },
    { label: "Pending Photos", value: stats?.pendingPhotoSubmissions ?? 0, subtitle: "Awaiting moderation", icon: AlertCircle, href: "/admin/photos" },
    { label: "Approved Photos", value: stats?.approvedPhotographs ?? 0, subtitle: "Publicly visible", icon: CheckCircle2, href: "/admin/photos" },
    { label: "Published Events", value: stats?.publishedEvents ?? 0, subtitle: "Live events", icon: CalendarDays, href: "/admin/events" },
    { label: "Upcoming Events", value: stats?.upcomingEvents ?? 0, subtitle: "Starting soon", icon: Clock, href: "/admin/events" },
    { label: "Published Exhibitions", value: stats?.publishedExhibitions ?? 0, subtitle: "Live exhibitions", icon: GalleryVerticalEnd, href: "/admin/exhibitions" },
    { label: "Active Bookings", value: stats?.activeBookings ?? 0, subtitle: "Confirmed + pending", icon: CalendarCheck, href: "/admin/bookings" },
    { label: "Pending Bookings", value: stats?.pendingBookings ?? 0, subtitle: "Awaiting action", icon: Clock, href: "/admin/bookings" },
    { label: "Published Awards", value: stats?.publishedAwards ?? 0, subtitle: "Public awards", icon: Star, href: "/admin/awards" },
  ];

  const pendingActions = [
    {
      label: "Review Membership Applications",
      href: "/admin/membership-applications",
      icon: UserCheck,
      count: stats?.pendingMembershipApplications ?? 0,
      empty: "No pending applications.",
    },
    {
      label: "Moderate Photos",
      href: "/admin/photos",
      icon: Image,
      count: stats?.pendingPhotoSubmissions ?? 0,
      empty: "No photos pending review.",
    },
    {
      label: "Manage Users",
      href: "/admin/users",
      icon: Users,
      count: stats?.totalUsers ?? 0,
      empty: "No users found.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] tracking-tight font-bold text-text">Dashboard</h1>
          <p className="text-muted text-sm">
            Manage the PSR photography community, members, creative submissions, and activities.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-sm border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.label}
              href={s.href}
              className="p-6 rounded-sm border border-line-border bg-surface hover:bg-surface-2 transition-colors flex flex-col group"
            >
              <div className="w-8 h-8 rounded-sm bg-orange/10 text-orange flex items-center justify-center group-hover:bg-orange group-hover:text-[#14110f] transition-colors mb-4">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-[24px] font-bold text-text mb-1">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted">{s.label}</div>
              <div className="text-xs text-muted mt-auto">{s.subtitle}</div>
            </a>
          );
        })}
      </div>

      {/* Pending Actions */}
      <section className="rounded-sm border border-line-border bg-surface overflow-hidden">
        <div className="p-5 border-b border-line-border bg-surface-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Pending Actions</h2>
          <p className="text-xs text-muted">
            Items requiring your attention
          </p>
        </div>
        <div className="divide-y divide-line-border">
          {pendingActions.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="p-5 flex items-center justify-between hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-orange/10 text-orange flex items-center justify-center">
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">{item.label}</div>
                  <div className="text-xs text-muted">
                    {item.count === 0 ? item.empty : item.count + " item" + (item.count !== 1 ? "s" : "")}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted hover:text-orange">
                Open <ChevronRight className="w-3 h-3 ml-1" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-sm border border-line-border bg-surface overflow-hidden">
        <div className="p-5 border-b border-line-border bg-surface-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Recent Activity</h2>
            <p className="text-xs text-muted">Audit trail of administrative actions</p>
          </div>
          <Link href="/admin/audit-logs" className="text-xs text-muted hover:text-orange">
            View all <ChevronRight className="w-3 h-3 ml-1" aria-hidden="true" />
          </Link>
        </div>
        <div className="divide-y divide-line-border">
          {statsLoading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full skeleton" />
                  <div className="flex-1 space-y-1">
                    <div className="skeleton h-[16px] w-2/3" />
                    <div className="skeleton h-[14px] w-1/2" />
                    <div className="skeleton h-[14px] w-1/3 text-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3 text-muted">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-muted text-sm">No recent activity recorded.</p>
            </div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="p-4 flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange/10 text-orange flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text leading-tight">{item.action}</p>
                  <p className="text-xs text-muted truncate">
                    {item.actorName || item.actorEmail} &bull;{" "}
                    {new Date(String(item.createdAt)).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...pendingActions].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="p-6 rounded-sm border border-line-border bg-surface hover:bg-surface-2 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-sm bg-orange/10 text-orange flex items-center justify-center mb-3">
                <item.icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-text">{item.label}</div>
              <div className="text-xs text-muted">
                {item.count === 0 ? item.empty : item.count + " item" + (item.count !== 1 ? "s" : "")}
              </div>
            </div>
            <span className="text-xs text-muted hover:text-orange">
              Open <ChevronRight className="w-3 h-3 ml-1" aria-hidden="true" />
            </span>
          </a>
        ))}
      </section>
    </div>
  );
}
