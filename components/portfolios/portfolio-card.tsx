"use client";

import Link from "next/link";
import { useState } from "react";

interface PortfolioCardProps {
  id: string;
  photographer_id?: string;
  title: string | null;
  slug?: string;
  description: string | null;
  is_public: boolean;
  photographer_name?: string | null;
  photographer_avatar_url?: string | null;
}

export function PortfolioCard({
  id,
  title,
  description,
  is_public,
  photographer_name,
  photographer_avatar_url,
}: PortfolioCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initials = (photographer_name || "Photographer").trim().slice(0, 1).toUpperCase();
  return (
    <article className="portfolio-card group min-w-0 overflow-hidden rounded-xl border border-line-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="portfolio-card-media relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-surface-2 via-surface to-surface-3">
        <div aria-hidden="true" className="absolute h-40 w-40 rounded-full border border-orange/15" />
        <div aria-hidden="true" className="absolute h-52 w-52 rounded-full border border-line-border" />
        {photographer_avatar_url && !avatarFailed ? (
          <img src={photographer_avatar_url} alt={photographer_name || "Photographer"} loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} className="relative h-28 w-28 rounded-full border-4 border-surface object-cover shadow-lg transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-surface bg-orange/10 text-3xl font-semibold text-orange shadow-lg">{initials}</span>
        )}
      </div>
      <div className="min-w-0 p-5">
        <Link
          href={`/portfolios/${id}`}
          className="mb-1 block break-words text-lg font-bold leading-snug hover:text-orange [overflow-wrap:anywhere]"
        >
          {title || "Untitled Portfolio"}
        </Link>
        {photographer_name && <p className="mb-3 text-xs text-muted">By {photographer_name}</p>}
        {description && (
          <p className="mb-3 break-words text-sm text-muted line-clamp-2">{description}</p>
        )}
        <span
          className={`text-[10px] uppercase tracking-wider font-bold border rounded-sm px-2 py-1 ${
            is_public
              ? "text-orange border-orange/30 bg-orange/5"
              : "text-muted border-line-border"
          }`}
        >
          {is_public ? "Public" : "Private"}
        </span>
      </div>
    </article>
  );
}
