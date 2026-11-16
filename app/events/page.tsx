"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { EventGrid } from "@/components/events/event-grid";
import { PublicEvent } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";

export default function EventsPage() {
  const { data, loading, error } = useApi<PublicEvent[]>("/api/events");
  const { user } = useAuth();

  const isCreator = user?.roles?.includes("PHOTOGRAPHER") || user?.roles?.includes("ADMIN");

  return (
    <PageContainer className="section-pad">
      <SkipToContent />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Events", href: "/events" },
        ]}
      />
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 break-words text-[clamp(2.5rem,8vw,3.5rem)] font-bold leading-tight tracking-tight">Events</h1>
          <p className="max-w-[560px] text-base text-muted sm:text-lg">
            Photo walks, creative sessions, exhibitions and conversations. The best
            moments are often the ones we make together.
          </p>
        </div>
        {isCreator && (
          <Link href="/admin/events" className="button button-primary">
            Create event
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-sm border border-orange/30 bg-orange/5 text-orange text-sm">
          {error}
        </div>
      )}
      <EventGrid events={loading ? [] : (data ?? [])} loading={loading} />
    </PageContainer>
  );
}
