"use client";

import * as React from "react";

type User = { id: string; full_name?: string; fullName?: string; email: string; roles?: string[] };

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (fullName: string, email: string, password: string, initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER") => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authOpen: boolean;
  authMode: "login" | "register";
  openAuthDialog: (mode?: "login" | "register") => void;
  closeAuthDialog: () => void;
  authNotice: string;
  setAuthNotice: (msg: string) => void;
  setAuthMode: (mode: "login" | "register") => void;
  setAuthOpen: (open: boolean) => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");
  const [authNotice, setAuthNotice] = React.useState("");

  const refreshUser = React.useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const json = await res.json();
        setUser(json.data ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();
  }, [refreshUser]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error?.message || "Sign in failed.");
    if (data.requiresAdminOtp) {
      throw new Error("Administrator accounts must sign in through the administrator sign-in page.");
    }
    setUser(data.user ?? null);
    setAuthOpen(false);
    setAuthNotice("");
    return data.user;
  }, []);

  const signUp = React.useCallback(async (fullName: string, email: string, password: string, initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER") => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, initialRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error?.message || "Registration failed.");
    setUser(data.user ?? null);
    setAuthOpen(false);
    setAuthNotice("");
  }, []);

  const signOut = React.useCallback(async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const openAuthDialog = React.useCallback((mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setAuthNotice("");
  }, []);

  const closeAuthDialog = React.useCallback(() => {
    setAuthOpen(false);
    setAuthNotice("");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, authOpen, authMode, openAuthDialog, closeAuthDialog, authNotice, setAuthNotice, setAuthMode, setAuthOpen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    return { user: null, loading: true, signIn: async () => {}, signUp: async (_fullName: string, _email: string, _password: string, _initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER") => {}, signOut: async () => {}, refreshUser: async () => {}, authOpen: false, authMode: "login" as const, openAuthDialog: async () => {}, closeAuthDialog: async () => {}, authNotice: "", setAuthNotice: async () => {}, setAuthMode: async () => {}, setAuthOpen: async () => {} };
  }
  return context;
}
