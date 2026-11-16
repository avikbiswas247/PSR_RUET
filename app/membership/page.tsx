"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FormEvent, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";

export default function MembershipPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submitMembership = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      setNotice("");
      const f = new FormData(e.currentTarget);
      const payload = Object.fromEntries(f.entries());
      try {
        const r = await fetch("/api/memberships/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || j.error?.message || "Application could not be submitted.");
        setNotice("Your application has been received. We&rsquo;ll be in touch soon.");
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Please try again.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516035069371-29a1b2440316?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,116,23,0.15),transparent)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-full mx-auto px-6 py-12">
        <header className="flex items-center justify-center gap-3 mb-8">
          <Link href="/" className="wordmark justify-center" aria-label="PSR home">
            <BrandLogo height={54} preload />
          </Link>
        </header>

        <main className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[56px] tracking-tight font-bold mb-6 leading-[1.1] text-white">
            Join PSR
          </h1>
          <p className="text-lg text-gray-300 mb-10 max-w-[520px]">
            A community where every frame tells a story. Bring your curiosity,
            your lens, and your perspective&mdash;we&rsquo;ll provide the rest.
          </p>

          <form onSubmit={submitMembership} className="bg-surface border border-line-border rounded-2xl p-8 shadow-2xl mb-12">
            <h2 className="text-[28px] tracking-tight font-bold mb-2 text-white">Apply for membership</h2>
            <p className="text-sm text-gray-400 mb-8">
              We review applications carefully. Submission does not automatically grant membership&mdash;it&rsquo;s the first step in our conversation.
            </p>

            <Input
              label="Full name"
              name="fullName"
              required
              defaultValue={user?.full_name || user?.fullName || ""}
              placeholder="Your full name"
              className="mb-6"
            />
            <Input
              label="Email address"
              type="email"
              name="email"
              required
              defaultValue={user?.email || ""}
              placeholder="you@example.com"
              className="mb-6"
            />
            <Input
              label="Phone number (optional)"
              name="phone"
              placeholder="+880 1XXXXXXXXX"
              className="mb-6"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <Input label="Department" name="department" placeholder="Your department" className="mb-0" />
              <Input label="Academic year" name="academicYear" placeholder="e.g. 2024&ndash;25" className="mb-0" />
            </div>
            <Textarea
              label="Why would you like to join? (optional)"
              name="motivation"
              rows={4}
              placeholder="Tell us what photography means to you&hellip;"
              className="mb-8"
            />

            {notice && (
              <div className="mb-6 p-4 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
                {notice}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="button-gradient w-full py-4 text-lg font-bold tracking-wider"
              disabled={busy}
            >
              {busy ? "Sending&hellip;" : "Submit application"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Already have an account?
              <Link href="/sign-in" className="auth-switch-link">
                Sign in
              </Link>
              , then apply.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
