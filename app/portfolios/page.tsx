"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { CommunityProfileGrid } from "@/components/portfolios/community-profile-grid";
import { CommunityProfile } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

export default function PortfoliosPage() {
  const {
    data: profiles,
    loading: profilesLoading,
    error: profilesError,
  } = useApi<CommunityProfile[]>("/api/portfolios/profiles?limit=100");

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
      <p className="mb-10 max-w-[640px] text-base text-muted sm:text-lg">
        Discover PSR&rsquo;s members, photographers, and administrators through their community profiles.
      </p>
      <section>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange">The people behind PSR</p>
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">Community profiles</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Browse member, photographer, and admin profiles. Client-only accounts are kept private.
          </p>
        </div>
        {profilesError && (
          <div role="alert" className="mb-6 rounded-xl border border-orange/25 bg-orange/5 p-4 text-sm text-orange-deep">
            {profilesError}
          </div>
        )}
        <CommunityProfileGrid profiles={profilesLoading ? [] : (profiles ?? [])} loading={profilesLoading} />
      </section>

    </PageContainer>
  );
}
