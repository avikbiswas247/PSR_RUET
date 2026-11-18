"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error?.message || "Unable to process your request.");
      setSent(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 5%, rgba(255,116,23,.13), transparent 36rem), radial-gradient(ellipse at 92% 92%, rgba(255,116,23,.07), transparent 30rem)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid overflow-hidden rounded-[26px] border line-border bg-surface/90 shadow-2xl backdrop-blur-xl lg:min-h-[650px] lg:grid-cols-[1.04fr_.96fr]">
          <aside className="relative flex flex-col justify-between overflow-hidden bg-surface-2 p-6 sm:p-9 lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 0% 0%, rgba(255,116,23,.12), transparent 52%), linear-gradient(145deg, transparent 38%, rgba(255,116,23,.035))",
              }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full border border-orange/10 sm:h-96 sm:w-96">
              <div className="absolute inset-7 rounded-full border border-orange/10" />
              <div className="absolute inset-16 rounded-full border border-orange/10" />
              <div className="absolute inset-[34%] rounded-full border border-orange/15 bg-orange/[0.025]" />
            </div>

            <div className="relative flex items-center justify-between gap-4">
              <Link href="/" aria-label="PSR home" className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange">
                <BrandLogo height={44} preload />
              </Link>
              <span className="hidden items-center gap-2 rounded-full border line-border bg-surface/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                Account support
              </span>
            </div>

            <div className="relative mt-10 max-w-xl lg:my-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
                <KeyRound size={13} strokeWidth={2.2} />
                Secure recovery
              </div>
              <h1 className="max-w-lg text-[clamp(2.65rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-text">
                Back to the moments that matter.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted sm:text-base">
                A few quick steps and you&rsquo;ll be back to exploring the PSR photography community.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { number: "01", title: "Your email", detail: "Tell us which account" },
                  { number: "02", title: "A private link", detail: "Sent just to your inbox" },
                  { number: "03", title: "A fresh start", detail: "Choose a new password" },
                ].map((step) => (
                  <div key={step.number} className="rounded-xl border line-border bg-surface/50 p-3.5 sm:p-4">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-orange">{step.number}</span>
                    <p className="mt-2 text-sm font-semibold text-text">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 flex items-center gap-3 border-t line-border pt-5 text-xs text-muted sm:pt-6">
              <ShieldCheck size={18} className="shrink-0 text-orange" />
              <span>Your password stays private. Reset links expire after 30 minutes.</span>
            </div>
          </aside>

          <section className="flex items-center justify-center bg-surface px-5 py-9 sm:px-10 sm:py-12 lg:px-12">
            <div className="w-full max-w-[420px]">
              <Link href="/sign-in" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange sm:mb-12">
                <ArrowLeft size={15} />
                Back to sign in
              </Link>

              {!sent ? (
                <>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange/15 bg-orange/[0.08] text-orange shadow-sm">
                    <Mail size={21} strokeWidth={1.8} />
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange">Password recovery</p>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-[2.6rem]">Forgot your password?</h2>
                  <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                    Enter the email address linked to your client or photographer account. We&rsquo;ll send a private reset link.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5 sm:mt-9">
                    <Input
                      id="reset-email"
                      label="Email address"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="!rounded-xl !py-3.5"
                    />

                    {notice && (
                      <div role="alert" className="rounded-xl border border-orange/20 bg-orange/[0.07] px-4 py-3 text-sm leading-6 text-text">
                        {notice}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={busy || !email.trim()}
                      className="group w-full !justify-between !rounded-xl !px-5 !py-4 text-xs !tracking-[0.14em] shadow-sm"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        {busy ? (
                          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        ) : (
                          <Mail size={16} />
                        )}
                        {busy ? "Sending reset link" : "Send reset link"}
                      </span>
                      {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
                    </Button>
                  </form>

                  <div className="mt-7 flex items-start gap-3 rounded-xl border line-border bg-surface-2/70 p-4">
                    <LockKeyhole size={17} className="mt-0.5 shrink-0 text-muted" />
                    <p className="text-xs leading-5 text-muted">
                      For your security, we&rsquo;ll show the same confirmation whether or not an eligible account uses that email.
                    </p>
                  </div>

                  <p className="mt-7 text-center text-xs text-muted sm:text-left">
                    Administrator?{" "}
                    <Link href="/admin/forgot-password" className="font-semibold text-orange underline-offset-4 hover:underline">
                      Use admin recovery
                    </Link>
                  </p>
                </>
              ) : (
                <div aria-live="polite" className="py-2">
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-green/20 bg-green/[0.08] text-green">
                    <Check size={25} strokeWidth={2.2} />
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange">Request received</p>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-[2.6rem]">Check your inbox.</h2>
                  <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
                    If an active client or photographer account exists for <strong className="break-all font-semibold text-text">{email}</strong>, reset instructions will arrive shortly. Check your spam folder too.
                  </p>

                  <div className="mt-7 flex items-start gap-3 rounded-xl border line-border bg-surface-2/70 p-4">
                    <Clock3 size={17} className="mt-0.5 shrink-0 text-orange" />
                    <p className="text-xs leading-5 text-muted">The reset link expires in 30 minutes and can only be used once.</p>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" className="!rounded-xl !py-3.5" onClick={() => { setSent(false); setNotice(""); }}>
                      Use another email
                    </Button>
                    <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#14110f] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                      Return to sign in
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-9 border-t line-border pt-5 text-center text-[11px] leading-5 text-muted sm:mt-12">
                PSR · Photographic Society of RUET
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-2 px-1 text-[10px] text-muted sm:flex-row">
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-orange">
            <ArrowLeft size={12} />
            Back to PSR
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} />
            Secure account recovery
          </span>
        </div>
      </div>
    </main>
  );
}
