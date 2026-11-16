"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Request failed.");
      setNotice("If an account exists for that email, a verification code will be sent.");
      if (json.data && json.data.userId) {
        setTimeout(() => {
          router.push(`/admin/auth/otp?userId=${encodeURIComponent(json.data.userId)}&purpose=password_reset`);
        }, 1000);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Request failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[440px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-muted text-sm mb-8">
            Enter your administrator email address. We&rsquo;ll send you a verification code.
          </p>

          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("sent") || notice.includes("Redirecting")
                ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
                : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
            }`}>
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                Email address
              </label>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@psr.example"
                required
                className="mb-0"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-lg font-bold tracking-wider"
              disabled={busy || !email}
            >
              {busy ? "Sending code…" : "Send Verification Code"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.13)]">
            <Link href="/admin/login" className="button button-outline w-full">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
