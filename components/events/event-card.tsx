"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string | null;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  start_at: string | Date | null;
  status: string;
}

export function EventCard({
  id,
  title,
  description,
  cover_image_url,
  location,
  start_at,
  status,
}: EventCardProps) {
  const start = start_at ? new Date(start_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "";
  return (
    <article className="event-card min-w-0 overflow-hidden rounded-sm border line-border">
      <div className="event-card-media">
        {cover_image_url ? (
          <img
            src={cover_image_url}
            alt={`${title || "Event"} cover`}
            loading="lazy"
            className="h-[200px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center bg-gradient-to-br from-orange/20 via-surface-2 to-surface-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            PSR Photography Event
          </div>
        )}
      </div>
      <div className="p-4">
        <span className="text-[10px] uppercase tracking-wider font-bold text-orange mb-2 block">
          {status === "PUBLISHED" ? "Published event" : "Draft"}
        </span>
        <Link
          href={`/events/${id}`}
          className="mb-1 block break-words text-lg font-bold leading-snug hover:text-orange [overflow-wrap:anywhere]"
        >
          {title || "Untitled Event"}
        </Link>
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <CalendarDays size={13} className="shrink-0 text-orange" aria-hidden="true" />
          <span className="shrink-0">{start}</span>
          {location && (
            <>
              <MapPin size={13} className="shrink-0 text-orange" aria-hidden="true" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{location}</span>
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
