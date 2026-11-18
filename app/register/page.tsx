"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState<"CLIENT" | "PHOTOGRAPHER">("CLIENT");

  const isClient = role === "CLIENT";
  const isPhotographer = role === "PHOTOGRAPHER";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(e.currentTarget);
    const fullName = form.get("fullName") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    try {
      const result = await signUp(fullName, email, password, role);
      router.push(`/verify-email?userId=${encodeURIComponent(result.userId)}&email=${encodeURIComponent(result.email)}&sent=${result.verificationEmailSent ? "1" : "0"}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to create account.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12">
      <div className="max-w-[480px] w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="wordmark w-full justify-center" aria-label="PSR home">
            <BrandLogo height={54} preload />
          </Link>
          <h1 className="text-[56px] tracking-tight font-bold mb-4 leading-[1.1] text-text">
            Create account
          </h1>
          <p className="text-lg text-gray-400 mb-10">
            Join PSR and become part of our photography community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Full name" name="fullName" required placeholder="Your full name" className="mb-6" />
          <Input label="Email address" type="email" name="email" required placeholder="you@example.com" className="mb-6" />
          <Input label="Password" type="password" name="password" minLength={8} required placeholder="At least 8 characters" className="mb-6" />

          <div className="p-4 rounded-lg border line-border bg-surface-2 mb-6">
            <h3 className="text-sm font-bold text-orange uppercase tracking-wider mb-3">Choose your role</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer p-3 rounded-lg border transition-all text-center flex flex-col items-center justify-center ${isClient ? "border-orange/50 bg-orange/10 text-orange" : "border-line-border bg-transparent hover:bg-orange/5 hover:border-orange/30"}`}>
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={role === "CLIENT"}
                  onChange={(e) => setRole(e.target.value as "CLIENT" | "PHOTOGRAPHER")}
                  className="hidden"
                />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-orange">Client</span>
                  <span className="text-xs text-gray-400">Share photos, book photographers</span>
                </div>
              </label>
              <label className={`cursor-pointer p-3 rounded-lg border transition-all text-center flex flex-col items-center justify-center ${isPhotographer ? "border-orange/50 bg-orange/10 text-orange" : "border-line-border bg-transparent hover:bg-orange/5 hover:border-orange/30"}`}>
                <input
                  type="radio"
                  name="role"
                  value="PHOTOGRAPHER"
                  checked={role === "PHOTOGRAPHER"}
                  onChange={(e) => setRole(e.target.value as "CLIENT" | "PHOTOGRAPHER")}
                  className="hidden"
                />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white">Photographer</span>
                  <span className="text-xs text-gray-400">Upload photos, accept bookings</span>
                </div>
              </label>
            </div>
          </div>

          {notice && (
            <div className="mb-6 p-4 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
              {notice}
            </div>
          )}

          <Button type="submit" variant="primary" className="auth-button w-full py-4 text-lg font-bold tracking-wider" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?
          <Link href="/sign-in" className="auth-switch-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
