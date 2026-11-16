"use client";

import { PublicPortfolio } from "@/lib/types/public";
import { PortfolioCard } from "./portfolio-card";
import { EmptyState } from "@/components/ui/empty-state";

interface PortfolioGridProps {
  portfolios: PublicPortfolio[];
  loading?: boolean;
}

export function PortfolioGrid({
  portfolios,
  loading = false,
}: PortfolioGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="portfolio-card border line-border rounded-sm overflow-hidden">
            <div className="portfolio-card-media">
              <div className="skeleton" style={{ height: "240px", width: "100%" }} />
            </div>
            <div className="p-4">
              <div className="skeleton h2 mb-3" />
              <div className="skeleton line" style={{ width: "70%" }} />
              <div className="skeleton line mt-2" style={{ width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <EmptyState
        title="No portfolios yet"
        description="Be the first photographer to create a portfolio and share your work."
        action={{
          label: "Join PSR",
          href: "/membership",
        }}
        icon="\u270D\uFE0F"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolios.map((p) => (
        <PortfolioCard
          key={p.id}
          id={p.id}
          title={p.title}
          description={p.description}
          is_public={p.is_public}
          photographer_name={p.photographer_name}
          photographer_avatar_url={p.photographer_avatar_url}
        />
      ))}
    </div>
  );
}
