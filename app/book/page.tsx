"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { PhotographerSearchGrid } from "@/components/photographers/photographer-search-grid";
import { PublicPhotographer } from "@/lib/types/public";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";

export default function BookPage() {
  const { user } = useAuth();
  const { data, loading, error } = useApi<PublicPhotographer[] | null>(
    "/api/photographers"
  );

  const photographers = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="section-pad max-w-[900px] mx-auto">
        <h1 className="text-[40px] tracking-tight font-bold mb-8">Book a Photographer</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h-[64px] w-full rounded-sm mb-4" />
              <div className="skeleton h-5 mb-2 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-pad max-w-[900px] mx-auto">
        <h1 className="text-[40px] tracking-tight font-bold mb-8">Book a Photographer</h1>
        <div className="p-6 rounded-lg border border-orange/30 bg-orange/5 text-orange text-sm text-center">
          {error}
        </div>
      </div>
    );
  }

  const canBook = !!user && !user.roles?.includes("PHOTOGRAPHER");

  return (
    <div className="section-pad max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[40px] tracking-tight font-bold mb-2">Book a Photographer</h1>
          <p className="text-lg text-gray-400">
            Choose a photographer and book your session at a time that works for you.
          </p>
        </div>
        <p className="text-sm text-gray-400">
          {photographers.length} photographer{photographers.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <PhotographerSearchGrid
            initialPhotographers={photographers}
            initialLoading={loading}
            showBookButton={canBook}
          />
        </div>

        {!canBook && (
          <div className="lg:col-span-1">
            <div className="p-6 rounded-sm border line-border bg-surface sticky top-6">
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">How it works</h2>
              <ul className="space-y-4 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <span className="text-orange font-bold mt-0.5">1</span>
                  <p>Browse photographers and view their portfolios.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange font-bold mt-0.5">2</span>
                  <p>Click &quot;Book a Session&quot; on a photographer you like.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange font-bold mt-0.5">3</span>
                  <p>Select a date, time, and session type.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange font-bold mt-0.5">4</span>
                  <p>Submit your request and wait for confirmation.</p>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {photographers.length === 0 && !loading && (
        <div className="max-w-[900px] mx-auto text-center">
          <EmptyState
            title="No photographers available"
            description="No photographers are currently available for booking. Check back soon."
          />
        </div>
      )}
    </div>
  );
}
