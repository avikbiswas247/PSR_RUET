"use client";

import { PublicEvent } from "@/lib/types/public";
import { EventCard } from "./event-card";
import { EmptyState } from "@/components/ui/empty-state";

interface EventGridProps {
  events: PublicEvent[];
  loading?: boolean;
}

export function EventGrid({ events, loading = false }: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="event-card border line-border rounded-sm overflow-hidden">
            <div className="event-card-media">
              <div className="skeleton" style={{ height: "200px", width: "100%" }} />
            </div>
            <div className="p-4">
              <div className="skeleton h2 mb-3" />
              <div className="skeleton line" style={{ width: "60%" }} />
              <div className="skeleton line mt-2" style={{ width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events yet"
        description="Check back soon for photo walks, exhibitions, and creative sessions."
        icon="\u2733\uFE0F"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((e) => (
        <EventCard key={e.id} {...e} />
      ))}
    </div>
  );
}
