"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFlowError, useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function SignInPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace(getRoleHomePath(user.roles));
  }, [loading, router, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(e.currentTarget);
    const fullName = form.get("fullName") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    try {
      if (mode === "register") {
        const result = await signUp(fullName, email, password);
        router.push(`/verify-email?userId=${encodeURIComponent(result.userId)}&email=${encodeURIComponent(result.email)}&sent=${result.verificationEmailSent ? "1" : "0"}`);
      } else {
        const user = await signIn(email, password);
        if (user) router.push(getRoleHomePath(user.roles));
      }
    } catch (err) {
      if (err instanceof AuthFlowError && err.code === "EMAIL_NOT_VERIFIED" && err.userId) {
        router.push(`/verify-email?userId=${encodeURIComponent(err.userId)}&email=${encodeURIComponent(email)}&sent=${err.verificationEmailSent ? "1" : "0"}`);
        return;
      }
      setNotice(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
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
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-lg text-gray-400 mb-10">
            {mode === "login"
              ? "Welcome back. Sign in to your PSR account."
              : "Join PSR and become part of our photography community."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "register" && (
            <Input
              label="Full name"
              name="fullName"
              required
              placeholder="Your full name"
              className="mb-6"
            />
          )}
          <Input
            label="Email address"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="mb-6"
          />

          {mode === "login" && (
            <div className="-mt-4 mb-2 text-right">
              <Link href="/forgot-password" className="text-sm text-muted hover:text-orange transition-colors">
                Forgot password?
              </Link>
            </div>
          )}
          <Input
            label="Password"
            type="password"
            name="password"
            minLength={8}
            required
            placeholder="At least 8 characters"
            className="mb-6"
          />

          {notice && (
            <div className="mb-6 p-4 rounded-lg bg-orange/10 border border-orange/20 text-orange text-sm">
              {notice}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="auth-button w-full py-4 text-lg font-bold tracking-wider"
            disabled={busy}
          >
            {busy ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-gray-400 text-center">
          {mode === "login" ? (
            <>
              Don&rsquo;t have an account?{" "}
              <Link href="#" className="auth-switch-link" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="#" className="auth-switch-link" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                Sign in
              </Link>
            </>
          )}
        </p>
        <p className="text-sm text-gray-400 text-center">
          Administrator? <Link href="/admin/login" className="text-orange font-bold hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
