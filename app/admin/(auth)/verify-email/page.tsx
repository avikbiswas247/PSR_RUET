"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId") || "";
  const email = searchParams.get("email") || "";

  const [codeDigits, setCodeDigits] = useState<Array<string>>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setResendSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resendSeconds]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose: "email_verification", code: codeDigits.join("") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Verification failed.");
      setNotice("Email verified successfully. Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendBusy || resendSeconds > 0) return;
    setResendBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose: "email_verification" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Failed to send code.");
      setNotice("A new code has been sent to your email.");
      setResendSeconds(60);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setResendBusy(false);
    }
  };

  const isCodeOnlyDigits = /^\d{6}$/.test(codeDigits.join(""));

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[440px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Verify Email</h1>
          <p className="text-muted text-sm mb-8">
            Enter the 6-digit code sent to {email ? `“${email}”` : "your email address"}.
          </p>

          {notice && (
            <div className={`mb-6 p-4 rounded-[10px] text-sm ${
              notice.includes("successfully") || notice.includes("sent") || notice.includes("Redirecting")
                ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
                : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
            }`}>
              {notice}
            </div>
          )}

          {!userId && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm text-center">
              Invalid verification request. Please register again.
            </div>
          )}

          {userId && (
            <form onSubmit={verify} className="space-y-5">
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={codeDigits[i]}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setCodeDigits((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                    inputMode="numeric"
                    className="text-center text-lg font-mono font-bold h-12 rounded-[10px] border border-[rgba(255,255,255,0.13)] focus:border-orange focus:ring-1 focus:ring-orange/25 text-white"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted text-center">
                Didn&rsquo;t receive a code?
                {resendSeconds > 0 ? (
                  <span className="text-muted"> Resend in {resendSeconds}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resendBusy}
                    className="text-orange font-bold hover:text-orange/80 transition-colors"
                  >
                    Resend code
                  </button>
                )}
              </p>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 text-lg font-bold tracking-wider"
                disabled={busy || !isCodeOnlyDigits}
              >
                {busy ? "Verifying…" : "Verify Code"}
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

export default function AdminVerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
        <div className="max-w-[440px] w-full">
          <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
            <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">Verify Email</h1>
            <p className="text-muted text-sm mb-8">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
