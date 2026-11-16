"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId") || "";

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    if (newPassword !== confirmPassword) {
      setNotice("Passwords do not match.");
      setBusy(false);
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setNotice("Password must contain between 8 and 128 characters.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otpCode, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Reset failed.");
      setNotice("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => {
        router.push("/admin/login");
      }, 1000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Reset failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[440px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Reset Password</h1>
          <p className="text-muted text-sm mb-8">
            Verify your identity and set a new password.
          </p>

          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("successfully") || notice.includes("Redirecting")
                ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
                : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
            }`}>
              {notice}
            </div>
          )}

          {!userId && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm text-center">
              Invalid reset request. Please start from the forgot password page.
            </div>
          )}

          {userId && (
            <form onSubmit={verifyAndReset} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Verification Code
                </label>
                <Input
                  type="text"
                  name="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="mb-0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  New Password
                </label>
                <Input
                  type="password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="mb-0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="mb-0"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 text-lg font-bold tracking-wider"
                disabled={
                  busy ||
                  !userId ||
                  !otpCode ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                {busy ? "Resetting…" : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.13)]">
            <Link href="/admin/login" className="button button-outline w-full">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
        <div className="max-w-[440px] w-full">
          <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
            <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Reset Password</h1>
            <p className="text-muted text-sm mb-8">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
