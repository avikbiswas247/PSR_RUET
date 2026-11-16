"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(e.currentTarget);
    const emailValue = form.get("email") as string;
    setEmail(emailValue);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Unable to send reset email.");
      setSent(true);
      setNotice("If an account exists for that email, reset instructions will be sent.");
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
      <h1 className="text-[40px] tracking-tight font-bold mt-8 mb-4 leading-1">Forgot password?</h1>
      <p className="text-muted text-lg mb-10">
        Enter your email and we&rsquo;ll send instructions to reset your password.
      </p>
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email address" type="email" name="email" required placeholder="you@example.com" />
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          {notice && <div className="form-notice">{notice}</div>}
        </form>
      ) : (
        <div className="text-center py-12">
          <div className="text-orange text-6xl mb-4" aria-hidden="true">\u2705</div>
          <h2 className="text-[28px] tracking-tight font-bold mb-4">Check your email</h2>
          <p className="text-muted text-lg mb-8">
            We&rsquo;ve sent password reset instructions to <strong>{email}</strong>. The link expires in 30 minutes and can be used once.
          </p>
          <Link href="/" className="button button-primary">Back to home</Link>
        </div>
      )}
      <p className="text-center text-sm text-muted mt-10">
        Remember your password?{" "}
        <Link href="/#discover" className="text-orange hover:underline font-bold" onClick={(e) => { e.preventDefault(); }}>
          &rarr; Sign in
        </Link>
      </p>
    </main>
  );
}
