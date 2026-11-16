"use client";

import { use } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicEvent } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";
import { notFound } from "next/navigation";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data, loading, error } = useApi<PublicEvent>(
    `/api/events/${eventId}`
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

  const event = data;

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Events", href: "/events" },
          {
            label: event?.title || "Event",
            href: `/events/${eventId}`,
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
          <div className="event-card-media h-64">
            {event.cover_image_url ? (
              <img
                src={event.cover_image_url}
                alt={`${event.title || "Event"} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/20 via-surface-2 to-surface-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                PSR Photography Event
              </div>
            )}
          </div>
          {!loading && (
            <>
              <h1 className="mt-6 mb-2 break-words text-[clamp(2rem,7vw,3rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
                {event.title || "Untitled Event"}
              </h1>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="text-orange">\u260E</span>
                  <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    <div className="text-sm font-bold">Date</div>
                    <div className="text-muted text-sm">
                      {event.start_at ? new Date(event.start_at).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }) : "TBD"}
                    </div>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="text-orange">\u270D\uFE0F</span>
                    <div>
                      <div className="text-sm font-bold">Location</div>
                      <div className="break-words text-sm text-muted [overflow-wrap:anywhere]">{event.location}</div>
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
            {event?.description || "No description available."}
          </p>
          {event?.registration_enabled ? (
            <EmptyState
              title="Registration coming soon"
              description="Event registration will be available here."
              icon="\u270B\uFE0F"
            />
          ) : (
            <EmptyState
              title="Registration not available"
              description="Registration is not enabled for this event."
              icon="\u26D4\uFE0F"
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
