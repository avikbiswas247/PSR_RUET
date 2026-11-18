"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;
    if (password !== confirm) {
      setNotice("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Unable to reset password.");
      setDone(true);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="section-pad max-w-[480px] mx-auto">
      <Link href="/" className="wordmark w-full justify-center" aria-label="PSR home">
        <BrandLogo height={54} preload />
      </Link>
      <h1 className="text-[40px] tracking-tight font-bold mt-8 mb-4 leading-1">Reset password</h1>
      {!done ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && <div className="form-notice">No reset token provided. Please request a new password reset.</div>}
          {token && (
            <>
              <Input label="New password" type="password" name="password" required minLength={8} placeholder="At least 8 characters" />
              <Input label="Confirm new password" type="password" name="confirm" required minLength={8} placeholder="Type it again" />
              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {busy ? "Resetting…" : "Reset password"}
              </Button>
              {notice && <div className="form-notice">{notice}</div>}
            </>
          )}
        </form>
      ) : (
        <div className="text-center py-12">
          <div className="text-orange text-6xl mb-4" aria-hidden="true">\u2705</div>
          <h2 className="text-[28px] tracking-tight font-bold mb-4">Password reset</h2>
          <p className="text-muted text-lg mb-8">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link href="/sign-in" className="button button-primary">Sign in</Link>
        </div>
      )}
    </main>
  );
}
