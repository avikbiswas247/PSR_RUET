"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export default function RootLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
