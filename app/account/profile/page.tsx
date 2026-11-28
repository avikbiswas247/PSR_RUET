"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { ClientProfileData } from "@/lib/types/public";
import { PHOTOGRAPHY_SERVICES } from "@/lib/constants/booking";

interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  roles?: string[];
  client_profile: ClientProfileData | null;
}

interface ProfileForm {
  fullName: string;
  phone: string;
  organizationName: string;
  billingAddress: string;
  preferredServices: string[];
  preferredContactMethod: string;
  bookingNotes: string;
}

function profileForm(user: CurrentUser): ProfileForm {
  return {
    fullName: user.full_name || "",
    phone: user.phone || "",
    organizationName: user.client_profile?.organization_name || "",
    billingAddress: user.client_profile?.billing_address || "",
    preferredServices: user.client_profile?.preferred_services || [],
    preferredContactMethod: user.client_profile?.preferred_contact_method || "",
    bookingNotes: user.client_profile?.booking_notes || "",
  };
}

export default function AccountProfilePage() {
  const { refreshUser } = useAuth();
  const { data: profile, loading, error } = useApi<CurrentUser>("/api/users/me");
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [savedForm, setSavedForm] = useState<ProfileForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const next = profileForm(profile);
    const timer = window.setTimeout(() => {
      setForm(next);
      setSavedForm(next);
      setAvatarUrl(profile.avatar_url);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile]);

  const dirty = useMemo(() => !!form && !!savedForm && JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);
  const completion = useMemo(() => {
    if (!form || !profile) return 0;
    const fields = [profile.email, avatarUrl, form.fullName, form.phone, form.organizationName, form.billingAddress,
      form.preferredServices.length > 0 ? "services" : "", form.preferredContactMethod, form.bookingNotes];
    return Math.round(fields.filter((value) => String(value).trim().length > 0).length / fields.length * 100);
  }, [form, profile, avatarUrl]);

  useEffect(() => {
    if (!dirty) return;
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => window.removeEventListener("beforeunload", preventLeave);
  }, [dirty]);

  const change = (patch: Partial<ProfileForm>) => setForm((current) => current ? { ...current, ...patch } : current);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    if (form.fullName.trim().length < 2) {
      setNoticeIsError(true);
      setNotice("Enter a name with at least 2 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || null,
          organizationName: form.organizationName || null,
          billingAddress: form.billingAddress || null,
          preferredServices: form.preferredServices,
          preferredContactMethod: form.preferredContactMethod || null,
          bookingNotes: form.bookingNotes || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Unable to update profile.");
      setSavedForm(form);
      setNoticeIsError(false);
      setNotice("Your profile and booking preferences were saved.");
      await refreshUser();
    } catch (saveError) {
      setNoticeIsError(true);
      setNotice(saveError instanceof Error ? saveError.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setAvatarBusy(true);
    setAvatarNotice("");
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const uploadResponse = await fetch("/api/media/upload", { method: "POST", body: uploadForm, credentials: "same-origin" });
      const uploadPayload = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || typeof uploadPayload.data?.url !== "string") throw new Error(uploadPayload.error?.message || "Unable to upload profile image.");
      const updateResponse = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ avatarUrl: uploadPayload.data.url }) });
      const updatePayload = await updateResponse.json().catch(() => ({}));
      if (!updateResponse.ok) throw new Error(updatePayload.error?.message || "Image uploaded but could not be saved to your profile.");
      setAvatarUrl(uploadPayload.data.url);
      setAvatarNotice("Profile image updated.");
      await refreshUser();
    } catch (uploadError) {
      setAvatarNotice(uploadError instanceof Error ? uploadError.message : "Please try again.");
    } finally {
      setAvatarBusy(false);
    }
  };

  if (loading || (!form && !error && !!profile)) return <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-[32px] font-bold">My Profile</h1><div className="skeleton h-80 rounded-2xl" /></div>;
  if (error) return <EmptyState title="Unable to load your profile" description={error} action={{ label: "Sign in again", href: "/sign-in" }} />;
  if (!profile || !form) return <EmptyState title="Profile not found" description="Sign in to view and update your PSR client profile." action={{ label: "Sign in", href: "/sign-in" }} />;

  const displayName = form.fullName.trim() || profile.full_name;
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Client workspace</p>
        <h1 className="mt-2 text-[32px] tracking-tight font-bold">My Profile</h1>
        <p className="mt-1 text-sm text-muted">Keep your contact and booking preferences ready for your next session.</p>
      </div>

      <section className="rounded-sm border line-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border line-border object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full border line-border bg-orange/10 text-xl font-bold text-orange">{initials || "C"}</div>}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="mt-1 break-all text-sm text-muted">{profile.email}</p>
            <label className="mt-3 inline-flex min-h-9 cursor-pointer items-center rounded-sm border line-border px-3 text-xs font-semibold text-text hover:border-orange">{avatarBusy ? "Uploading…" : "Update profile image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" disabled={avatarBusy} onChange={(event) => void handleAvatarUpload(event)} /></label>
            {avatarNotice && <p role="status" className="mt-2 text-xs text-muted">{avatarNotice}</p>}
          </div>
          <div className="min-w-40 text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Profile completeness</p>
            <p className="mt-1 text-2xl font-bold text-orange">{completion}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-orange transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-sm border line-border bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-bold">Personal information</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Your email is used for account access and cannot be changed here.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="fullName" required maxLength={120} value={form.fullName} onChange={(event) => change({ fullName: event.target.value })} />
            <Input label="Email address" name="email" value={profile.email} readOnly disabled />
            <Input label="Phone number" name="phone" type="tel" maxLength={40} value={form.phone} onChange={(event) => change({ phone: event.target.value })} placeholder="+880 1XXXXXXXXX" className="sm:col-span-2" />
          </div>
        </section>

        <section className="rounded-sm border line-border bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-bold">Organization and billing</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Optional details for company, event, or commercial photography requests.</p>
          <div className="space-y-4">
            <Input label="Organization or company" name="organizationName" maxLength={160} value={form.organizationName} onChange={(event) => change({ organizationName: event.target.value })} placeholder="Organization name" />
            <div><label htmlFor="billingAddress" className="mb-1.5 block text-xs font-semibold text-muted">Billing address</label><Textarea id="billingAddress" name="billingAddress" maxLength={500} rows={3} value={form.billingAddress} onChange={(event) => change({ billingAddress: event.target.value })} placeholder="Billing address (optional)" /><p className="mt-1 text-right text-[10px] text-muted">{form.billingAddress.length}/500</p></div>
          </div>
        </section>

        <section className="rounded-sm border line-border bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-bold">Booking preferences</h2>
          <p className="mb-5 mt-1 text-sm text-muted">These optional preferences help you prepare future booking requests.</p>
          <fieldset>
            <legend className="mb-3 text-xs font-semibold text-muted">Preferred photography services</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PHOTOGRAPHY_SERVICES.map((service) => <label key={service} className="flex min-h-11 items-center gap-3 rounded-sm border line-border bg-surface-2 px-3 py-2 text-sm"><input type="checkbox" checked={form.preferredServices.includes(service)} onChange={(event) => change({ preferredServices: event.target.checked ? [...form.preferredServices, service] : form.preferredServices.filter((item) => item !== service) })} className="accent-orange" />{service}</label>)}
            </div>
          </fieldset>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="preferredContactMethod" className="mb-1.5 block text-xs font-semibold text-muted">Preferred contact method</label><select id="preferredContactMethod" value={form.preferredContactMethod} onChange={(event) => change({ preferredContactMethod: event.target.value })} className="min-h-11 w-full rounded-sm border line-border bg-surface-2 px-3 text-text"><option value="">No preference</option><option value="email">Email</option><option value="phone">Phone</option><option value="either">Either</option></select></div>
            <div><label htmlFor="bookingNotes" className="mb-1.5 block text-xs font-semibold text-muted">General booking notes</label><Textarea id="bookingNotes" name="bookingNotes" maxLength={2000} rows={3} value={form.bookingNotes} onChange={(event) => change({ bookingNotes: event.target.value })} placeholder="Anything you often need photographers to know?" /><p className="mt-1 text-right text-[10px] text-muted">{form.bookingNotes.length}/2,000</p></div>
          </div>
        </section>

        {notice && <p role={noticeIsError ? "alert" : "status"} className={`rounded-sm border p-3 text-sm ${noticeIsError ? "border-red-500/30 bg-red-500/5 text-red-300" : "border-orange/30 bg-orange/5 text-orange"}`}>{notice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{dirty ? "You have unsaved changes." : "Your profile is up to date."}</p><Button type="submit" variant="primary" disabled={busy || !dirty}>{busy ? "Saving profile…" : "Save profile"}</Button></div>
      </form>
    </div>
  );
}
