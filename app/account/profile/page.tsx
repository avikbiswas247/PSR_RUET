"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useApi } from "@/lib/hooks/use-api";

interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  roles?: string[];
}

export default function AccountProfilePage() {
  const { user } = useAuth();
  const { data: profileData, loading, error } = useApi<CurrentUser>("/api/users/me");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      setNotice("");
      const form = new FormData(e.currentTarget);
      const body: Record<string, unknown> = {};
      const fullName = form.get("fullName");
      const phone = form.get("phone");
      if (fullName) body.fullName = fullName;
      if (phone !== null && phone !== undefined) body.phone = phone;
      try {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Unable to update profile.");
        setNotice("Profile updated successfully.");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="section-pad max-w-[600px] mx-auto">
        <h1 className="text-[32px] tracking-tight font-bold mb-8">My Profile</h1>
        <div className="p-6 rounded-lg border line-border bg-surface">
          <div className="skeleton h-[64px] w-16 h-16 rounded-full mb-4" />
          <div className="skeleton h-5 mb-2 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-full mt-4" />
          <div className="skeleton h-4 w-3/4 mt-2" />
          <div className="skeleton h-[44px] w-full mt-4 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-pad max-w-[600px] mx-auto text-center">
        <h1 className="text-[32px] tracking-tight font-bold mb-4">Profile Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/sign-in" className="text-orange font-bold hover:underline">
          Sign in again
        </Link>
      </div>
    );
  }

  const profile = profileData;
  if (!profile) {
    return (
      <div className="section-pad max-w-[600px] mx-auto text-center">
        <h1 className="text-[32px] tracking-tight font-bold mb-4">No Profile Found</h1>
        <p className="text-gray-400 mb-6">Please sign in to view your profile.</p>
        <Link href="/sign-in" className="text-orange font-bold hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-[40px] tracking-tight font-bold">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="border line-border rounded-2xl bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <span className="text-2xl text-muted">{profile.full_name.slice(0, 1).toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold text-text">{profile.full_name}</h2>
          <p className="text-sm text-gray-400">{profile.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange/10 border border-orange/20 text-orange text-xs font-bold">
              <span>●</span> Member
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Full name"
              name="fullName"
              defaultValue={profile.full_name}
              placeholder="Your full name"
              className="mb-4"
            />
            <Input
              label="Phone number"
              name="phone"
              defaultValue={profile.phone || ""}
              placeholder="+880 1XXXXXXXXX"
              className="mb-6"
            />
          </div>

          {notice && (
            <div className="mb-6 p-4 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
              {notice}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full py-4 text-lg font-bold tracking-wider" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
