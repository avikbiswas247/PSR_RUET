"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { ExhibitionGrid } from "@/components/exhibitions/exhibition-grid";
import { PublicExhibition } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

export default function ExhibitionsPage() {
  const { data, loading, error } = useApi<PublicExhibition[]>(
    "/api/exhibitions"
  );

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Exhibitions", href: "/exhibitions" },
        ]}
      />
      <h1 className="mb-6 break-words text-[clamp(2.5rem,8vw,3.5rem)] font-bold leading-tight tracking-tight">
        Exhibitions
      </h1>
      <p className="mb-10 max-w-[560px] text-base text-muted sm:text-lg">
        Curated photographic exhibitions showcasing the work of PSR members.
        Different eyes, different stories — one shared passion.
      </p>
      {error && (
        <div className="mb-8 p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      )}
      <ExhibitionGrid
        exhibitions={loading ? [] : (data ?? [])}
        loading={loading}
      />
    </PageContainer>
  );
}
