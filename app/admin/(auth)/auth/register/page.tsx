"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";

const RegisterContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationToken = searchParams.get("token") || "";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationToken, fullName, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Registration failed.");
      setNotice("Account created. Check your email for a verification code.");
      setTimeout(() => {
        router.push(`/admin/auth/otp?userId=${encodeURIComponent(json.userId)}&purpose=email_verification`);
      }, 1000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[480px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Complete Registration</h1>
          <p className="text-muted text-sm mb-8">
            You&rsquo;ve been invited to join as an administrator. Complete your account setup below.
          </p>

          {!invitationToken && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm text-center">
              No invitation token provided. Please use the invitation link from your email.
            </div>
          )}

          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("created") || notice.includes("Redirecting")
                ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
                : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
            }`}>
              {notice}
            </div>
          )}

          {invitationToken && (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Full Name
                </label>
                <Input
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mb-0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="mb-0"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="auth-button w-full py-4 text-lg font-bold tracking-wider"
                disabled={busy || !invitationToken || !fullName || !password}
              >
                {busy ? "Creating account…" : "Complete Registration"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
        <div className="max-w-[480px] w-full">
          <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
            <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Complete Registration</h1>
            <p className="text-muted text-sm mb-8">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
