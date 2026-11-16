"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
  created_at: string | Date;
}

const roles = ["ADMIN", "PHOTOGRAPHER", "MEMBER", "CLIENT"];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data, loading, error } = useApi<AdminUser[] | null>("/api/admin/users");
  const [displayUsers, setDisplayUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayUsers(data ?? []);
  }, [data]);

  const changeRole = useCallback(
    async (id: string, roleName: string, action: "ASSIGN" | "REVOKE") => {
      setBusy((prev) => new Set([...prev, id]));
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, roleName, action }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || json.data?.message || "Unable to update role.");
        setDisplayUsers((list) => list.map((u) => u.id !== id ? u : { ...u, roles: action === "ASSIGN" ? [...new Set([...u.roles, roleName])] : u.roles.filter((r) => r !== roleName) }));
        setNotice(`Role ${action.toLowerCase()}d.`);
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      if (!isActive && !window.confirm("Deactivate this account? The user will no longer be able to sign in.")) return;
      setBusy((prev) => new Set([...prev, id]));
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, isActive }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || json.data?.message || "Unable to update status.");
        setDisplayUsers((list) => list.map((u) => u.id === id ? { ...u, is_active: isActive } : u));
        setNotice(`User ${isActive ? "activated" : "deactivated"}.`);
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  const users = loading ? [] : displayUsers;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[32px] tracking-tight font-bold">Users</h1>
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
      <EmptyState title="Unable to load users" description={error} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-tight font-bold">Users</h1>
        <p className="text-muted text-sm">{users.length} user{users.length !== 1 ? "s" : ""}</p>
      </div>

      {notice && <div className="form-notice">{notice}</div>}

      <div className="space-y-4">
        {users.length === 0 ? <EmptyState title="No users found" description="Registered accounts will appear here." /> : users.map((u) => (
          <div key={u.id} className="p-4 rounded-sm border line-border bg-surface">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-bold">{u.full_name}</h3>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => changeRole(u.id, role, u.roles.includes(role) ? "REVOKE" : "ASSIGN")}
                    disabled={busy.has(u.id) || (u.id === currentUser?.id && role === "ADMIN" && u.roles.includes("ADMIN"))}
                    className={`text-[10px] uppercase tracking-wider font-bold border rounded px-2 py-1 ${
                      u.roles.includes(role) ? "text-orange bg-orange/10 border border-orange/20" : "text-muted border-line-border"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => toggleActive(u.id, !u.is_active)}
              disabled={busy.has(u.id) || (u.id === currentUser?.id && u.is_active)}
              className="button button-outline text-xs w-full"
            >
              {u.is_active ? "Deactivate" : "Activate"} user
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
