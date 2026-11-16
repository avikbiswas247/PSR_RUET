"use client";

import Link from "next/link";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export default function AccountSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-[600px] space-y-8">
      <h1 className="text-[32px] tracking-tight font-bold">Settings</h1>
      <div className="p-6 rounded-sm border line-border bg-surface space-y-6">
        <div>
          <h2 className="text-[20px] font-bold mb-4">Appearance</h2>
          <div className="flex items-center gap-4">
            <span className="text-muted">Color theme</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </Button>
          </div>
          <p className="text-xs text-muted mt-2">
            Your theme preference is saved and remembered across visits.
          </p>
        </div>
        <div className="pt-6 border-t line-border">
          <h2 className="text-[20px] font-bold mb-4">Account</h2>
          <p className="text-muted text-sm mb-4">
            Manage your profile and security at <Link href="/account/profile">My Profile</Link>.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-muted">Delete account</span>
            <Button variant="outline" size="sm" className="text-orange-deep hover:text-orange-deep border-orange-deep/30">
              Request deletion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
