"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { PortfolioGrid } from "@/components/portfolios/portfolio-grid";
import { PhotographerGrid } from "@/components/photographers/photographer-grid";
import { PublicPhotographer, PublicPortfolio } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

export default function PortfoliosPage() {
  const { data, loading, error } = useApi<PublicPortfolio[]>(
    "/api/portfolios"
  );
  const {
    data: photographers,
    loading: photographersLoading,
    error: photographersError,
  } = useApi<PublicPhotographer[]>("/api/photographers?limit=100");

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
      <section className="mb-16">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange">The people behind the frames</p>
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">Photographer profiles</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Meet PSR&rsquo;s photographers and explore their work. Profile photos and details come from each photographer&rsquo;s account.
          </p>
        </div>
        {photographersError && (
          <div role="alert" className="mb-6 rounded-xl border border-orange/25 bg-orange/5 p-4 text-sm text-orange-deep">
            {photographersError}
          </div>
        )}
        {!photographersLoading && !photographersError && (photographers?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border line-border bg-surface-2/60 p-6 sm:p-8">
            <h3 className="font-semibold text-text">No public photographer profiles yet</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Active photographers appear here after verifying their email and completing a public profile.
            </p>
            <Link href="/sign-in" className="mt-5 inline-flex items-center justify-center rounded-lg bg-orange px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#14110f] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2">
              Sign in to verify your account
            </Link>
          </div>
        ) : (
          <PhotographerGrid
            photographers={photographersLoading ? [] : (photographers ?? [])}
            loading={photographersLoading}
          />
        )}
      </section>

      <section>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange">Curated collections</p>
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">Portfolios</h2>
        </div>
        <PortfolioGrid
          portfolios={loading ? [] : (data ?? [])}
          loading={loading}
        />
      </section>
    </PageContainer>
  );
}
