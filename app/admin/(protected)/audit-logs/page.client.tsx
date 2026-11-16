"use client";

import { AdminTable } from "@/components/admin/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface AuditLog {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string | Date;
}

export default function AdminAuditLogsPage() {
  const { data, loading, error } = useApi<AuditLog[] | null>("/api/admin/audit-logs");
  const logs = loading ? [] : (data ?? []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Audit Logs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-sm border line-border bg-surface">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load audit logs" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Audit Logs</h1>
        <p className="text-muted text-sm">{logs.length} log{logs.length !== 1 ? "s" : ""}</p>
      </div>

      <p className="text-sm text-muted mb-4">
        Read-only audit trail of privileged admin mutations.
      </p>

      <AdminTable
        columns={[
          { key: "action", label: "Action" },
          { key: "target_type", label: "Target Type", render: (v) => String(v || "—") },
          { key: "target_id", label: "Target ID", render: (v) => String(v || "—") },
          { key: "metadata", label: "Metadata", render: (v) => JSON.stringify(v).slice(0, 60) + (JSON.stringify(v).length > 60 ? "…" : "") },
          { key: "created_at", label: "Created", render: (v) => new Date(String(v)).toLocaleString() },
        ]}
        data={logs}
        loading={loading}
        emptyTitle="No audit logs"
        emptyDescription="No admin actions have been logged yet."
        emptyIcon="\u2699\uFE0F"
      />
    </div>
  );
}
