
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicPhotographer } from "@/lib/types/public";
import { PhotographerCard } from "./photographer-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface PhotographerSearchGridProps {
  initialPhotographers?: PublicPhotographer[];
  initialLoading?: boolean;
  className?: string;
  showBookButton?: boolean;
}

export function PhotographerSearchGrid({
  initialPhotographers = [],
  initialLoading = false,
  className,
  showBookButton = true,
}: PhotographerSearchGridProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [device, setDevice] = useState("");
  const [location, setLocation] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce text search to avoid an API request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const query = `/api/photographers?search=${encodeURIComponent(
    debouncedSearch
  )}&genre=${encodeURIComponent(genre)}&device=${encodeURIComponent(
    device
  )}&location=${encodeURIComponent(location)}`;

  const { data, loading, error } =
    useApi<PublicPhotographer[] | null>(query);

  const photographers = data ?? initialPhotographers;
  const hasFilters = Boolean(search || genre || device || location);

  const handleClear = () => {
    setSearch("");
    setGenre("");
    setDevice("");
    setLocation("");
    setDebouncedSearch("");
  };

  if (loading || initialLoading) {
    return (
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-line-border bg-surface p-5 animate-pulse"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="skeleton circle !w-16 !h-16" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h2 w-3/4" />
                  <div className="skeleton line w-1/2" />
                </div>
              </div>

              <div className="skeleton line w-full mb-3" />
              <div className="skeleton line w-2/3 mb-6" />

              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="skeleton h-20 rounded-md" />
                <div className="skeleton h-20 rounded-md" />
                <div className="skeleton h-20 rounded-md" />
              </div>

              <div className="skeleton h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={`w-full ${className || ""}`}>
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Search and filters */}
        <div className="rounded-2xl border border-line-border bg-surface p-5 shadow-sm sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Discover Photographers
              </h2>
              <p className="mt-1 text-sm text-muted">
                Find creative talent and book your next photography session.
              </p>
            </div>

            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="self-start sm:self-auto"
              >
                Clear filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Input
              label="Search photographers"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, bio, specialty..."
            />

            <Input
              label="Photography genre"
              name="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Street, Portrait..."
            />

            <Input
              label="Camera / Device"
              name="device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="Canon, Sony..."
            />

            <Input
              label="Location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country..."
            />
          </div>
        </div>

        {/* Photographer results */}
        <div>
          <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold leading-tight text-text">
              Photographers
            </h3>

            <span className="shrink-0 text-sm text-muted">
              {photographers.length} results
            </span>
          </div>

          {photographers.length === 0 ? (
            <div className="rounded-2xl border border-line-border py-16 text-center">
              <EmptyState
                title="No photographers found"
                description={
                  hasFilters
                    ? "Try adjusting your search or filters."
                    : "No photographers are currently available."
                }
                icon="✋"
              />

              {hasFilters && (
                <button
                  onClick={handleClear}
                  className="mt-4 text-sm font-semibold text-orange hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 items-stretch">
              {photographers.map((photographer) => (
                <div
                  key={photographer.id}
                  className="min-w-0 w-full h-full"
                >
                  <PhotographerCard
                    id={photographer.id}
                    full_name={photographer.full_name}
                    title={photographer.title}
                    location={photographer.location}
                    is_available={photographer.is_available}
                    roles={photographer.roles}
                    avatar_url={photographer.avatar_url}
                    device={photographer.device}
                    photography_genre={photographer.photography_genre}
                    bio={photographer.bio}
                    showBookButton={showBookButton}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API error */}
        {error && (
          <div className="p-4 rounded-xl border border-orange/30 bg-orange/5 text-orange-deep text-sm">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
