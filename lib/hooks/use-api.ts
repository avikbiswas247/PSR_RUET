"use client";

import * as React from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string): ApiState<T> {
  const [state, setState] = React.useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchData() {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          const errData: unknown = await res.json().catch(() => ({}));
          const payload = errData && typeof errData === "object"
            ? errData as { message?: unknown; error?: { message?: unknown } }
            : {};
          const message = typeof payload.error?.message === "string"
            ? payload.error.message
            : typeof payload.message === "string"
              ? payload.message
              : `Request failed with status ${res.status}`;
          throw new Error(message);
        }
        const json = await res.json();
        if (!cancelled) {
          setState({ data: json.data ?? null, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load data.";
          setState({ data: null, loading: false, error: message });
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return state;
}
