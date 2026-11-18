"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Login failed.");
      if (!json.data || !json.data.userId) {
        throw new Error("Login response missing verification identifier.");
      }
      if (json.data.requiresEmailVerification) {
        setNotice("Please verify your email to activate administrator access.");
        router.push(`/admin/verify-email?userId=${encodeURIComponent(json.data.userId)}&email=${encodeURIComponent(email)}`);
      } else {
        setNotice("Verification code sent. Please check your email.");
        router.push(`/admin/verify-login?userId=${encodeURIComponent(json.data.userId)}`);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Login failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[440px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Admin Sign In</h1>
          <p className="text-muted text-sm mb-8">
            Sign in to manage the PSR platform.
          </p>

          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("Verification code sent")
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-muted">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-orange hover:text-orange/80 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
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
              disabled={busy || !email || !password}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.13)]">
            <p className="text-xs text-muted text-center mb-4">
              Don&rsquo;t have an admin account? Contact an existing administrator
              to request an invitation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin/forgot-password" className="button button-outline w-full sm:w-auto">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
