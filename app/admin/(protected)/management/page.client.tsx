"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/lib/hooks/use-api";
import { AdminUser } from "@/lib/services/admin.service";
import { useAuth } from "@/components/providers/auth-provider";

export default function AdminManagementPage() {
  const { user: currentUser } = useAuth();
  const { data: admins, loading: adminsLoading } = useApi<AdminUser[] | null>(
    "/api/admin/users"
  );
  const { data: slotsData, loading: slotsLoading } = useApi<{ used: number; total: number } | null>(
    "/api/admin/auth/slots"
  );
  const { data: founderData } = useApi<{ isFounder: boolean } | null>("/api/admin/auth/is-founder");

  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [targetAdminId, setTargetAdminId] = useState("");

  const adminList = adminsLoading ? [] : (admins ?? []);
  const adminAdmins = adminList.filter((a) => a.roles.includes("ADMIN"));
  const slots = slotsData ?? { used: adminAdmins.length, total: 2 };
  const slotsUsed = slots.used;
  const slotsTotal = slots.total || 2;

  const transferFounder = async () => {
    if (!targetAdminId || !window.confirm("Transfer Founder Admin ownership to the selected administrator? This cannot be undone by you.")) return;
    setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/admin/auth/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: targetAdminId, reason: "Transferred by Founder Admin" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.data?.message || "Transfer failed.");
      setNotice("Founder Admin ownership transferred successfully.");
      window.location.reload();
    } catch (err) { setNotice(err instanceof Error ? err.message : "Transfer failed."); setBusy(false); }
  };

  const inviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Invitation failed.");
      setNotice("Invitation sent successfully.");
      setInviteEmail("");
      window.location.reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Invitation failed. Please try again.");
      setBusy(false);
    }
  };

  if (adminsLoading || slotsLoading) {
    return (
      <div className="section-pad max-w-[1200px] mx-auto">
        <h1 className="text-[32px] tracking-tight font-bold mb-8">Admin Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <div className="skeleton h2 mb-4" />
              <div className="skeleton line w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const canInvite = slotsUsed < slotsTotal;

  return (
    <div className="section-pad max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[32px] tracking-tight font-bold mb-1">Admin Management</h1>
          <p className="text-muted text-sm">
            Manage administrator accounts and invitations.
          </p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-muted hover:text-orange">
          Back to dashboard
        </Link>
      </div>

      {notice && <div role="status" className="mb-6 rounded-md border border-orange/20 bg-orange/5 p-4 text-sm text-orange">{notice}</div>}

      {/* Admin Slots */}
      <div className="mb-10 p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-white">Admin Slots</h2>
          <span className={`text-xs font-bold rounded-full px-3 py-1 ${
            slotsUsed >= slotsTotal
              ? "text-orange border border-orange/20 bg-orange/5"
              : "text-muted border border-[rgba(255,255,255,0.13)] bg-transparent"
          }`}>
            {slotsUsed}/{slotsTotal} used
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-full bg-[#181817] rounded-[10px] h-4 overflow-hidden">
            <div
              className="h-full bg-orange transition-all duration-500"
              style={{ width: `${Math.min((slotsUsed / slotsTotal) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-sm text-muted">
            {slotsUsed >= slotsTotal
              ? "Maximum administrator accounts reached."
              : `Can invite ${slotsTotal - slotsUsed} more administrator(s).`}
          </span>
        </div>
      </div>

      {/* Invite Second Admin */}
      {slotsUsed < slotsTotal && (
        <div className="mb-10 p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
          <h2 className="text-[18px] font-bold text-white mb-6">Invite Administrator</h2>
          <p className="text-muted text-sm mb-6">
            Invite a second administrator. The invitation is single-use, email-bound, and expires in 48 hours.
          </p>
          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("successfully")
                ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
                : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
            }`}>
              {notice}
            </div>
          )}
          <form onSubmit={inviteAdmin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="mb-0"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-lg font-bold tracking-wider"
              disabled={busy || !inviteEmail || !canInvite}
            >
              {busy ? "Sending invitation…" : "Send Invitation"}
            </Button>
          </form>
        </div>
      )}

      {/* Existing Admins */}
      <div>
        <h2 className="text-[18px] font-bold text-white mb-6">Administrator Accounts</h2>
        {adminAdmins.length === 0 ? (
          <div className="p-8 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#181817] text-center">
            <p className="text-muted">No administrator accounts found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {adminAdmins.map((admin) => (
              <div
                key={admin.id}
                className="p-6 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#111110] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#181817] flex items-center justify-center border border-[rgba(255,255,255,0.13)]">
                    <span className="text-xs font-bold text-white">
                      {(admin.full_name || "A").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{admin.full_name}</h3>
                    <p className="text-xs text-muted">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${
                    admin.is_active
                      ? "text-orange border border-orange/20 bg-orange/5"
                      : "text-muted border border-[rgba(255,255,255,0.13)] bg-transparent"
                  }`}>
                    {admin.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${
                    admin.email_verified_at
                      ? "text-green border border-green/20 bg-green/5"
                      : "text-muted border border-[rgba(255,255,255,0.13)] bg-transparent"
                  }`}>
                    {admin.email_verified_at ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {founderData?.isFounder && adminAdmins.some((a) => a.id !== currentUser?.id && a.is_active) && (
        <section className="mt-8 rounded-[14px] border border-orange/25 bg-[#111110] p-6">
          <h2 className="text-[18px] font-bold text-white">Transfer Founder Admin</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Transfer ownership to another active administrator. They become the only Founder Admin; your administrator account remains active.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <select value={targetAdminId} onChange={(e) => setTargetAdminId(e.target.value)} className="min-w-0 flex-1 rounded-md border border-line-border bg-[#181817] px-3 py-2.5 text-sm text-text">
              <option value="">Choose an active administrator</option>
              {adminAdmins.filter((a) => a.id !== currentUser?.id && a.is_active).map((a) => <option key={a.id} value={a.id}>{a.full_name} · {a.email}</option>)}
            </select>
            <Button type="button" variant="primary" disabled={busy || !targetAdminId} onClick={() => void transferFounder()}>Transfer ownership</Button>
          </div>
        </section>
      )}
    </div>
  );
}
