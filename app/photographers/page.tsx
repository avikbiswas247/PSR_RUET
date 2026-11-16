"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { PhotographerGrid } from "@/components/photographers/photographer-grid";
import { PublicPhotographer } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";

export default function PhotographersPage() {
  const { data, loading, error } = useApi<PublicPhotographer[]>(
    "/api/photographers"
  );

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Photographers", href: "/photographers" },
        ]}
      />
      <h1 className="mb-6 break-words text-[clamp(2.5rem,8vw,3.5rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
        Photographers
      </h1>
      <p className="mb-10 max-w-[560px] text-base text-muted sm:text-lg">
        Discover the visual storytellers of PSR. Each member brings a
        unique perspective to the frame.
      </p>
      {error && (
        <div className="mb-8 p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange-deep text-sm">
          {error}
        </div>
      )}
      <PhotographerGrid
        photographers={loading ? [] : (data ?? [])}
      />
    </PageContainer>
  );
}
