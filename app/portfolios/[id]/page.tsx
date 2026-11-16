"use client";

import { use } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicPortfolio } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";
import { notFound } from "next/navigation";

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useApi<PublicPortfolio>(
    `/api/portfolios/${id}`
  );

  if (loading) {
    return (
      <PageContainer className="section-pad">
        <SkipToContent />
        <div className="skeleton h2 mb-6" />
        <div className="skeleton line" style={{ width: "40%" }} />
      </PageContainer>
    );
  }
  if (error) {
    return (
      <PageContainer className="section-pad">
        <SkipToContent />
        <div className="p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      </PageContainer>
    );
  }
  if (!data) notFound();

  const portfolio = data;

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Portfolios", href: "/portfolios" },
          {
            label: portfolio?.title || "Portfolio",
            href: `/portfolios/${id}`,
          },
        ]}
      />
      {error && (
        <div className="mb-8 p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="min-w-0 lg:col-span-4">
          <div className="portfolio-card-media h-64">
            <div className="skeleton" style={{ height: "100%", width: "100%" }} />
          </div>
          {!loading && (
            <>
              <h1 className="mt-6 mb-2 break-words text-[clamp(2rem,7vw,3rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
                {portfolio.title || "Untitled Portfolio"}
              </h1>
              {portfolio.description && (
                <p className="mb-6 break-words text-lg text-muted [overflow-wrap:anywhere]">{portfolio.description}</p>
              )}
            </>
          )}
        </div>
        <div className="min-w-0 lg:col-span-8">
          <EmptyState
            title="No photos in this portfolio"
            description="This portfolio doesn't have any photos yet."
            icon="\u270D\uFE0F"
          />
        </div>
      </div>
    </PageContainer>
  );
}
