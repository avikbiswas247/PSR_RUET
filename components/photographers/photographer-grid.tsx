"use client";

import { PublicPhotographer } from "@/lib/types/public";
import { PhotographerCard } from "./photographer-card";
import { EmptyState } from "@/components/ui/empty-state";

interface PhotographerGridProps {
  photographers: PublicPhotographer[];
  loading?: boolean;
}

export function PhotographerGrid({
  photographers,
  loading = false,
}: PhotographerGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="photographer-card border line-border rounded-sm overflow-hidden p-4">
            <div className="photographer-card-media">
              <div className="skeleton circle" />
            </div>
            <div className="mt-4">
              <div className="skeleton h2 mb-3" />
              <div className="skeleton line" style={{ width: "60%" }} />
              <div className="skeleton line mt-2" style={{ width: "40%" }} />
              <div className="flex gap-2 mt-3">
                <div className="skeleton line" style={{ width: "30%" }} />
                <div className="skeleton line" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (photographers.length === 0) {
    return (
      <EmptyState
        title="No photographers yet"
        description="Be the first to join the society and share your work."
        action={{
          label: "Join PSR",
          href: "/membership",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {photographers.map((p) => (
        <PhotographerCard
          key={p.id}
          id={p.id}
          full_name={p.full_name}
          title={p.title}
          location={p.location}
          is_available={p.is_available}
          roles={p.roles}
          avatar_url={p.avatar_url}
          device={p.device}
          photography_genre={p.photography_genre}
          bio={p.bio}
        />
      ))}
    </div>
  );
}
