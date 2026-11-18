"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { useAuth } from "@/components/providers/auth-provider";

export default function EmailVerificationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const userId = searchParams.get("userId") || "";
  const email = searchParams.get("email") || "";
  const emailWasSent = searchParams.get("sent") !== "0";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const [resendSeconds, setResendSeconds] = useState(emailWasSent ? 60 : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    intervalRef.current = setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resendSeconds]);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || result.data?.message || result.message || "Unable to verify email.");
      await refreshUser();
      const roles = result.data?.user?.roles ?? [];
      router.replace(getRoleHomePath(roles));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to verify email. Please try again.");
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!userId || resending || resendSeconds > 0) return;
    setResending(true);
    setNotice("");
    try {
      const response = await fetch("/api/auth/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || result.data?.message || result.message || "Unable to send a new code.");
      setNotice(result.data?.message || "If your account needs verification, a new code will be sent.");
      setResendSeconds(60);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to send a new code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface px-5 py-12 flex items-center justify-center">
      <section className="w-full max-w-[460px] rounded-2xl border line-border bg-surface-2 p-7 shadow-2xl sm:p-9">
        <Link href="/" className="mb-8 flex justify-center" aria-label="PSR home">
          <BrandLogo height={48} preload />
        </Link>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange">Account security</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-text">Verify your email</h1>
        <p className="mb-7 text-sm leading-6 text-muted">
          {email ? <>Enter the six-digit code sent to <strong className="text-text">{email}</strong>.</> : "Enter the six-digit code sent to your email address."}
          {" "}Email verification is required before you can sign in.
        </p>

        {!userId && <div className="form-notice mb-5">This verification link is incomplete. Please create your account again.</div>}
        {userId && !emailWasSent && (
          <div className="mb-5 rounded-lg border border-orange/20 bg-orange/10 p-4 text-sm text-orange">
            We couldn&rsquo;t deliver the first code. Use the button below to request another one.
          </div>
        )}
        {notice && <div className="form-notice mb-5">{notice}</div>}

        {userId && (
          <form onSubmit={verify} className="space-y-5">
            <label className="block text-sm font-semibold text-text" htmlFor="verification-code">Verification code</label>
            <input
              id="verification-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-xl border line-border bg-surface px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-text outline-none transition focus:border-orange"
            />
            <Button type="submit" variant="primary" className="w-full py-3" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify email"}
            </Button>
          </form>
        )}

        {userId && (
          <div className="mt-6 text-center text-sm text-muted">
            Didn&rsquo;t receive a code?{" "}
            {resendSeconds > 0 ? (
              <span>Resend in {resendSeconds}s</span>
            ) : (
              <button type="button" onClick={resend} disabled={resending} className="font-semibold text-orange hover:underline disabled:opacity-60">
                {resending ? "Sending…" : "Send a new code"}
              </button>
            )}
          </div>
        )}
        <p className="mt-8 border-t line-border pt-5 text-center text-sm text-muted">
          Already verified? <Link href="/sign-in" className="font-semibold text-orange hover:underline">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
