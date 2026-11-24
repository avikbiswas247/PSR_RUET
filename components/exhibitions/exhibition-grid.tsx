"use client";

import { PublicExhibition } from "@/lib/types/public";
import { ExhibitionCard } from "./exhibition-card";
import { EmptyState } from "@/components/ui/empty-state";

interface ExhibitionGridProps {
  exhibitions: PublicExhibition[];
  loading?: boolean;
}

export function ExhibitionGrid({ exhibitions, loading = false }: ExhibitionGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="exhibition-card border line-border rounded-sm overflow-hidden">
            <div className="exhibition-card-media">
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

  if (exhibitions.length === 0) {
    return (
      <EmptyState
        title="No exhibitions yet"
        description="Check back soon for curated photographic exhibitions."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {exhibitions.map((e) => (
        <ExhibitionCard key={e.id} {...e} />
      ))}
    </div>
  );
}
