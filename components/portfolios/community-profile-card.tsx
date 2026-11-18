"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Image as ImageIcon, MapPin, MoveUpRight } from "lucide-react";
import type { CommunityProfile } from "@/lib/types/public";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  PHOTOGRAPHER: "Photographer",
};

export function CommunityProfileCard({ profile }: { profile: CommunityProfile }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const name = profile.full_name?.trim() || "PSR community member";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/portfolios/profile/${profile.id}`}
      aria-label={`View ${name}'s profile`}
      className="group block min-w-0 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <article className="h-full overflow-hidden rounded-[22px] border line-border bg-surface shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-orange/20 via-surface-2 to-surface-3 sm:h-32">
          <div aria-hidden="true" className="absolute -right-8 -top-16 h-48 w-48 rounded-full border border-orange/15" />
          <div aria-hidden="true" className="absolute -right-2 -top-10 h-36 w-36 rounded-full border border-orange/15" />
          <div className="absolute inset-x-5 bottom-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            <Camera size={13} className="text-orange" />
            PSR community
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-11 mb-4 flex items-end justify-between gap-3">
            {profile.avatar_url && !avatarFailed ? (
              <img
                src={profile.avatar_url}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setAvatarFailed(true)}
                className="h-[88px] w-[88px] rounded-full border-4 border-surface bg-surface-2 object-cover shadow-lg"
              />
            ) : (
              <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-surface bg-orange/15 text-2xl font-bold text-orange shadow-lg">
                {initials || "P"}
              </span>
            )}
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border line-border bg-surface-2 px-3 py-1.5 text-[10px] font-semibold text-muted transition group-hover:border-orange/30 group-hover:text-orange">
              View profile <MoveUpRight size={12} />
            </span>
          </div>

          <h2 className="break-words text-lg font-bold leading-snug text-text [overflow-wrap:anywhere] sm:text-xl">{name}</h2>
          {profile.title && <p className="mt-1 break-words text-sm font-medium text-orange [overflow-wrap:anywhere]">{profile.title}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.roles.map((role) => (
              <span key={role} className="rounded-full border border-orange/20 bg-orange/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-orange">
                {ROLE_LABELS[role] ?? role}
              </span>
            ))}
          </div>

          {profile.bio ? (
            <p className="mt-4 line-clamp-3 min-h-[4.5rem] break-words text-sm leading-6 text-muted">{profile.bio}</p>
          ) : (
            <p className="mt-4 min-h-[4.5rem] text-sm leading-6 text-muted">A PSR community profile. Open to see more details and shared work.</p>
          )}

          {profile.location && (
            <p className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-muted">
              <MapPin size={13} className="shrink-0 text-orange" />
              <span className="break-words [overflow-wrap:anywhere]">{profile.location}</span>
            </p>
          )}

          <div className="mt-5 flex items-center gap-5 border-t line-border pt-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><ImageIcon size={14} className="text-orange" />{profile.photo_count} photos</span>
            <span>{profile.portfolio_count} portfolios</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
