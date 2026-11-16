"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { PortfolioGrid } from "@/components/portfolios/portfolio-grid";
import { PublicPortfolio } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

export default function PortfoliosPage() {
  const { data, loading, error } = useApi<PublicPortfolio[]>(
    "/api/portfolios"
  );

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Portfolios", href: "/portfolios" },
        ]}
      />
      <h1 className="mb-6 break-words text-[clamp(2.5rem,8vw,3.5rem)] font-bold leading-tight tracking-tight">
        Portfolios
      </h1>
      <p className="mb-10 max-w-[560px] text-base text-muted sm:text-lg">
        Explore curated collections of work from PSR members. Each portfolio
        is a point of view, a story told through frames.
      </p>
      {error && (
        <div className="mb-8 p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      )}
      <PortfolioGrid
        portfolios={loading ? [] : (data ?? [])}
        loading={loading}
      />
    </PageContainer>
  );
}
