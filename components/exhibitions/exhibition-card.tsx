"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

interface ExhibitionCardProps {
  id: string;
  title: string | null;
  description: string | null;
  cover_image_url: string | null;
  venue: string | null;
  start_date: string | Date | null;
  status: string;
}

export function ExhibitionCard({
  id,
  title,
  description,
  cover_image_url,
  venue,
  start_date,
  status,
}: ExhibitionCardProps) {
  const start = start_date ? new Date(start_date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "";
  return (
    <article className="exhibition-card min-w-0 overflow-hidden rounded-sm border line-border">
      <div className="exhibition-card-media">
        {cover_image_url ? (
          <img
            src={cover_image_url}
            alt={`${title || "Exhibition"} cover`}
            loading="lazy"
            className="h-[200px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center bg-gradient-to-br from-orange/20 via-surface-2 to-surface-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            PSR Photo Exhibition
          </div>
        )}
      </div>
      <div className="p-4">
        <span className="text-[10px] uppercase tracking-wider font-bold text-orange mb-2 block">
          {status === "PUBLISHED" ? "Published exhibition" : "Draft"}
        </span>
        <Link
          href={`/exhibitions/${id}`}
          className="mb-1 block break-words text-lg font-bold leading-snug hover:text-orange [overflow-wrap:anywhere]"
        >
          {title || "Untitled Exhibition"}
        </Link>
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <CalendarDays size={13} className="shrink-0 text-orange" aria-hidden="true" />
          <span className="shrink-0">{start}</span>
          {venue && (
            <>
              <MapPin size={13} className="shrink-0 text-orange" aria-hidden="true" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{venue}</span>
            </>
          )}
        </div>
        {description && (
          <p className="mb-4 break-words text-sm text-muted line-clamp-2">{description}</p>
        )}
      </div>
    </article>
  );
}
