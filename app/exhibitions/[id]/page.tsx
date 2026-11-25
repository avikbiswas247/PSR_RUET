"use client";

import { use } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicExhibition } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { ParticipationEntryLink } from "@/components/events/participation-entry-link";

export default function ExhibitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useApi<PublicExhibition>(
    `/api/exhibitions/${id}`
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

  const exhibition = data;

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Exhibitions", href: "/exhibitions" },
          {
            label: exhibition?.title || "Exhibition",
            href: `/exhibitions/${id}`,
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
          <div className="exhibition-card-media h-64">
            {exhibition.cover_image_url ? (
              <img
                src={exhibition.cover_image_url}
                alt={`${exhibition.title || "Exhibition"} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/20 via-surface-2 to-surface-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                PSR Photo Exhibition
              </div>
            )}
          </div>
          {!loading && (
            <>
              <h1 className="mt-6 mb-2 break-words text-[clamp(2rem,7vw,3rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
                {exhibition.title || "Untitled Exhibition"}
              </h1>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
                  <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    <div className="text-sm font-bold">Venue</div>
                    <div className="break-words text-sm text-muted [overflow-wrap:anywhere]">
                      {exhibition.venue || "TBD"}
                    </div>
                  </div>
                </div>
                {exhibition.start_date && (
                  <div className="flex items-start gap-3">
                    <CalendarDays size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-bold">Date</div>
                    <div className="break-words text-sm text-muted [overflow-wrap:anywhere]">
                        {new Date(exhibition.start_date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="min-w-0 lg:col-span-8">
          <h2 className="text-[28px] tracking-tight font-bold mb-4">Description</h2>
          <p className="mb-6 break-words leading-relaxed text-muted [overflow-wrap:anywhere]">
            {exhibition?.description || "No description available."}
          </p>
          <EmptyState
            title="No exhibition items yet"
            description="This exhibition doesn't have any photos on display yet."
          />
          <ParticipationEntryLink type="exhibition" targetId={id} title={exhibition.title || "this exhibition"}/>
        </div>
      </div>
    </PageContainer>
  );
}
