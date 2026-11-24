"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  CircleAlert,
  Images,
  Settings2,
  Sparkles,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
}

function iconForTitle(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  if (/unable|error|unavailable|required|couldn.t find|not found/.test(normalized)) return CircleAlert;
  if (/event|calendar|booking|availability|registration/.test(normalized)) return CalendarDays;
  if (/exhibition|photo|portfolio|image|media|gallery/.test(normalized)) return Images;
  if (/notification|message/.test(normalized)) return Bell;
  if (/award|achievement/.test(normalized)) return Trophy;
  if (/setting|audit|log/.test(normalized)) return Settings2;
  if (/user|member|photographer|application|profile/.test(normalized)) return UsersRound;
  return Camera;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = "",
  compact = false,
}: EmptyStateProps) {
  const Icon = icon ?? iconForTitle(title);
  const isProblem = Icon === CircleAlert;

  return (
    <section
      role="status"
      className={`empty-state relative isolate mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-orange/15 bg-gradient-to-br from-surface via-surface-2/80 to-surface px-6 text-center shadow-sm ${compact ? "min-h-[260px] py-10" : "min-h-[320px] py-12 sm:min-h-[360px] sm:px-10 sm:py-14"} ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-orange/[0.07] blur-3xl" />
        <div className="absolute -bottom-36 -left-20 h-72 w-72 rounded-full bg-orange/[0.05] blur-3xl" />
        <div className="absolute right-[12%] top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-orange/[0.09]" />
        <div className="absolute right-[14%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-orange/[0.08]" />
      </div>

      <div className="relative flex h-[76px] w-[76px] items-center justify-center">
        <div aria-hidden="true" className="absolute inset-0 rotate-6 rounded-[24px] border border-orange/20 bg-orange/[0.06]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-orange/20 bg-surface text-orange shadow-lg shadow-orange/10">
          <Icon size={27} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-orange text-surface shadow-sm">
          <Sparkles size={12} strokeWidth={2.2} />
        </span>
      </div>

      <div className="relative z-10 mt-6 max-w-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">
          {isProblem ? "A quick check is needed" : "A little room for what’s next"}
        </p>
        <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">
            {description}
          </p>
        )}
        {action?.href && (
          <Link href={action.href} className="button button-primary mt-6 inline-flex items-center gap-2">
            {action.label}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
        {!action?.href && action?.onClick && (
          <button type="button" onClick={action.onClick} className="button button-primary mt-6 inline-flex items-center gap-2">
            {action.label}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
