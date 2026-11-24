"use client";

import { EmptyState } from "@/components/ui/empty-state";
import type { CommunityProfile } from "@/lib/types/public";
import { CommunityProfileCard } from "./community-profile-card";

export function CommunityProfileGrid({
  profiles,
  loading = false,
}: {
  profiles: CommunityProfile[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="overflow-hidden rounded-[22px] border line-border bg-surface">
            <div className="skeleton h-28 w-full sm:h-32" />
            <div className="p-5 sm:p-6">
              <div className="skeleton mb-4 h-20 w-20 rounded-full" />
              <div className="skeleton mb-3 h-5 w-2/3" />
              <div className="skeleton mb-5 h-12 w-full" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <EmptyState
        title="No community profiles yet"
        description="Active PSR member, photographer, and admin profiles will appear here. Client-only accounts stay private."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => <CommunityProfileCard key={profile.id} profile={profile} />)}
    </div>
  );
}
