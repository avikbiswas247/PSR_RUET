"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface PhotographerCardProps {
  id: string;
  full_name: string | null;
  title: string | null;
  location: string | null;
  is_available: boolean;
  roles: string[];
  avatar_url?: string | null;
  device?: string | null;
  photography_genre?: string | null;
  bio?: string | null;
  showBookButton?: boolean;
}

export function PhotographerCard({
  id,
  full_name,
  title,
  location,
  is_available,
  roles,
  avatar_url,
  device,
  photography_genre,
  bio,
  showBookButton = true,
}: PhotographerCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { user } = useAuth();
  const displayName = full_name || "Photographer";
  const canBook = !!user && !user.roles?.includes("PHOTOGRAPHER");
  const isClient = !!user && user.roles?.includes("CLIENT");

  return (
    <article className="photographer-card group min-w-0 overflow-hidden rounded-xl border border-line-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="photographer-card-media relative h-48 bg-surface-2 overflow-hidden">
        {avatar_url && !avatarFailed ? (
          <img
            src={avatar_url}
            alt={displayName}
            loading="lazy"
            decoding="async"
            onError={() => setAvatarFailed(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange/10 via-surface-2 to-surface-3 text-muted">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-orange/20 bg-surface/80 text-2xl font-semibold text-orange shadow-sm">{displayName.trim().slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        {is_available ? (
          <span className="absolute left-3 top-3 rounded-full border border-orange/25 bg-surface/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange shadow-sm backdrop-blur">
            Available
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full border border-line-border bg-surface/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted shadow-sm backdrop-blur">
            Unavailable
          </span>
        )}
      </div>
      <div className="min-w-0 p-5">
        <div className="mb-2 flex min-w-0 items-center justify-between">
          <Link
            href={`/photographers/${id}`}
            className="break-words text-lg font-bold leading-snug hover:text-orange [overflow-wrap:anywhere]"
          >
            {displayName}
          </Link>
        </div>
        {title && (
          <span className="mb-2 block break-words text-[10px] font-bold uppercase tracking-wider text-orange [overflow-wrap:anywhere]">
            {title}
          </span>
        )}
        {bio && (
          <p className="mb-3 break-words text-sm leading-relaxed text-muted line-clamp-2">{bio}</p>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {device && (
            <span className="max-w-full break-words rounded border border-line-border px-2 py-1 text-xs font-bold text-muted [overflow-wrap:anywhere]">
              {device}
            </span>
          )}
          {photography_genre && (
            <span className="max-w-full break-words rounded border border-orange/20 bg-orange/5 px-2 py-1 text-xs font-bold text-orange [overflow-wrap:anywhere]">
              {photography_genre}
            </span>
          )}
          {location && (
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted">
              <span aria-hidden="true">\u260E</span>
              <span className="break-words [overflow-wrap:anywhere]">{location}</span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {showBookButton && canBook && (
            <Link
              href={`/book/${id}`}
              className="flex-1 button button-primary text-sm py-2 text-center"
            >
              Book a Session
            </Link>
          )}
          {showBookButton && !canBook && !isClient && (
            <Link
              href="/sign-in"
              className="flex-1 button button-outline text-sm py-2 text-center"
            >
              Sign in to book
            </Link>
          )}
          {roles.length > 0 && (
            <span
              className="max-w-full break-words rounded-sm border border-line-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted [overflow-wrap:anywhere]"
            >
              {roles[0]}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
