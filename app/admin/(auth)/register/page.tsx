"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegistrationMode = "BOOTSTRAP" | "INVITATION" | "CLOSED";

interface SlotsResponse {
  used: number;
  total: number;
  registrationMode: RegistrationMode;
  bootstrapConfigured: boolean;
  registrationAvailable: boolean;
}

export default function AdminRegisterPage() {
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  const [secret, setSecret] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const mode = slots?.registrationMode ?? null;
  const isBootstrap = mode === "BOOTSTRAP";
  const isInvite = mode === "INVITATION";
  const isFull = mode === "CLOSED";

  const checkAvailability = useCallback(async () => {
    setAvailabilityError(null);
    try {
      const res = await fetch("/api/admin/auth/slots");
      if (!res.ok) throw new Error("Failed to check registration availability.");
      const json = (await res.json()) as SlotsResponse;
      setSlots(json);
    } catch (err) {
      setAvailabilityError(err instanceof Error ? err.message : "Unable to check registration availability. Please try again.");
    } finally {
      setAvailabilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await checkAvailability();
    })();
    return () => { cancelled = true; };
  }, [checkAvailability]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!username.trim()) {
      errors.username = "Username is required.";
    } else if (username.trim().length < 2) {
      errors.username = "Username must be at least 2 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      errors.username = "Username can only contain letters, numbers, underscores and hyphens.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (password.length > 128) {
      errors.password = "Password must be at most 128 characters.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (isBootstrap && !secret.trim()) {
      errors.secret = "Bootstrap secret is required.";
    }

    if (isInvite && !invitationToken.trim()) {
      errors.invitationToken = "Invitation token is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    setFieldErrors({});

    if (!validateForm()) {
      setBusy(false);
      return;
    }

    try {
      if (isBootstrap) {
        const res = await fetch("/api/admin/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bootstrapSecret: secret.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || json.error?.message || "Bootstrap failed.");
        setNotice("First administrator account created. Check your email for a verification code.");
        setTimeout(() => {
          router.push(`/admin/verify-email?userId=${encodeURIComponent(json.userId ?? json.user?.id)}&email=${encodeURIComponent(json.email ?? json.user?.email ?? "")}&purpose=email_verification`);
        }, 1000);
      } else if (isInvite) {
        const res = await fetch("/api/admin/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitationToken: invitationToken.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || json.error?.message || "Registration failed.");
        setNotice("Account created. Check your email for a verification code.");
        setTimeout(() => {
          router.push(`/admin/verify-email?userId=${encodeURIComponent(json.userId)}&email=${encodeURIComponent(json.email ?? "")}&purpose=email_verification`);
        }, 1000);
      } else {
        throw new Error("Administrator registration is full. Maximum two administrators allowed.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setNotice(message);
      setBusy(false);
    }
  };

  const used = slots ? slots.used : 0;
  const total = slots ? slots.total : 2;

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[480px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>

          {/* Availability info (non-blocking, above form) */}
          {!availabilityLoaded && !availabilityError && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#1a1a1a]/50 text-muted text-sm text-center">
              Checking registration availability…
            </div>
          )}
          {availabilityError && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm">
              {availabilityError}
              <button
                onClick={() => { setAvailabilityError(null); checkAvailability(); }}
                className="mt-2 text-[10px] text-orange underline hover:text-orange/80"
              >
                Retry
              </button>
            </div>
          )}
          {availabilityLoaded && !availabilityError && !isFull && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#1a1a1a]/50 text-muted text-sm text-center">
              Registration slots: {used} of {total} used.
              {isBootstrap ? " — Bootstrap mode: first administrator." : " — Invitation mode: second administrator slot available."}
            </div>
          )}
          {isFull && (
            <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm text-center">
              Administrator registration is full. Maximum two administrators allowed.
            </div>
          )}

          <h1 className={`text-[32px] tracking-tight font-bold text-white mb-2 ${isFull ? "text-orange" : ""}`}>
            {isFull ? "Registration Closed" : isBootstrap ? "Bootstrap First Administrator" : "Complete Registration"}
          </h1>
          <p className="text-muted text-sm mb-8">
            {isFull
              ? "The maximum number of administrator accounts has been reached."
              : isBootstrap
                ? "Create the first administrator account. This requires the server bootstrap secret."
                : "Complete your administrator account setup using your invitation token."}
          </p>

          {!isFull && (
            <>
              {isBootstrap && !slots?.bootstrapConfigured && (
                <div className="mb-6 p-4 rounded-[10px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm">
                  Bootstrap is not configured on this server. Contact the system administrator to set ADMIN_BOOTSTRAP_SECRET.
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
              <form onSubmit={submit} className="space-y-5">
                {isBootstrap && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                      Bootstrap Secret
                    </label>
                    <Input
                      type="password"
                      name="secret"
                      value={secret}
                      onChange={(e) => { setSecret(e.target.value); clearFieldError("secret"); }}
                      placeholder="Enter bootstrap secret"
                      required
                      className={`mb-0 ${fieldErrors.secret ? "border-red" : ""}`}
                    />
                    {fieldErrors.secret && <p className="text-[10px] text-red mt-1">{fieldErrors.secret}</p>}
                  </div>
                )}
                {isInvite && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                      Invitation Token
                    </label>
                    <Input
                      name="invitationToken"
                      value={invitationToken}
                      onChange={(e) => { setInvitationToken(e.target.value); clearFieldError("invitationToken"); }}
                      placeholder="Invitation token"
                      required
                      className={`mb-0 ${fieldErrors.invitationToken ? "border-red" : ""}`}
                    />
                    {fieldErrors.invitationToken && <p className="text-[10px] text-red mt-1">{fieldErrors.invitationToken}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Username
                  </label>
                  <Input
                    name="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); clearFieldError("username"); }}
                    placeholder="Choose a username"
                    required
                    className={`mb-0 ${fieldErrors.username ? "border-red" : ""}`}
                  />
                  {fieldErrors.username && <p className="text-[10px] text-red mt-1">{fieldErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                    placeholder="admin@psr.example"
                    required
                    className={`mb-0 ${fieldErrors.email ? "border-red" : ""}`}
                  />
                  {fieldErrors.email && <p className="text-[10px] text-red mt-1">{fieldErrors.email}</p>}
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
                    onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    required
                    className={`mb-0 ${fieldErrors.password ? "border-red" : ""}`}
                  />
                  {fieldErrors.password && <p className="text-[10px] text-red mt-1">{fieldErrors.password}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-muted">
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[10px] text-orange hover:text-orange/80 transition-colors"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    required
                    className={`mb-0 ${fieldErrors.confirmPassword ? "border-red" : ""}`}
                  />
                  {fieldErrors.confirmPassword && <p className="text-[10px] text-red mt-1">{fieldErrors.confirmPassword}</p>}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="auth-button w-full py-4 text-lg font-bold tracking-wider"
                  disabled={
                    busy ||
                    isFull ||
                    !username ||
                    !email ||
                    !password ||
                    !confirmPassword ||
                    password !== confirmPassword ||
                    (isBootstrap && !secret) ||
                    (isInvite && !invitationToken) ||
                    Object.keys(fieldErrors).length > 0
                  }
                >
                  {busy ? "Creating account…" : isBootstrap ? "Create First Administrator" : "Complete Registration"}
                </Button>
              </form>
              <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.13)]">
                <Link href="/admin/login" className="button button-outline w-full">
                  Already have an account? Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
