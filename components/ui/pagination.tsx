"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  className?: string;
}

export function Pagination({
  total,
  limit,
  offset,
  className,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (pageCount <= 1) return null;

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String((page - 1) * limit));
    params.set("limit", String(limit));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <nav
      className={`pagination flex items-center justify-between gap-4 mt-12 ${className || ""}`}
      aria-label="Pagination"
    >
      <button
        onClick={() => setPage(currentPage - 1)}
        disabled={!hasPrev}
        className="px-4 py-2 border line-border rounded-sm text-sm disabled:opacity-50 disabled:pointer-events-none"
      >
        Previous
      </button>
      <span className="text-sm text-muted">
        Page {currentPage} of {pageCount}
      </span>
      <button
        onClick={() => setPage(currentPage + 1)}
        disabled={!hasNext}
        className="px-4 py-2 border line-border rounded-sm text-sm disabled:opacity-50 disabled:pointer-events-none"
      >
        Next
      </button>
    </nav>
  );
}
