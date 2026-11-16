"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { getRoleHomeLabel, getRoleHomePath } from "@/lib/auth/role-home";

export function AuthButton() {
  const { user, loading, openAuthDialog } = useAuth();

  if (loading) {
    return (
      <button className="button button-small button-outline" disabled>
        Sign in
      </button>
    );
  }

  if (user) {
    return (
      <Link
        href={getRoleHomePath(user.roles)}
        className="button button-small button-outline"
      >
        {getRoleHomeLabel(user.roles)} <span>↗</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="button button-small button-outline"
      onClick={() => openAuthDialog("login")}
      aria-label="Member sign in"
    >
      Member sign in <span>↗</span>
    </button>
  );
}
