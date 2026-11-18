"use client";

import * as React from "react";

export type AuthUser = {
  id: string;
  full_name?: string;
  fullName?: string;
  email: string;
  roles?: string[];
};

export type RegistrationResult = {
  userId: string;
  email: string;
  verificationEmailSent: boolean;
};

type AuthMode = "login" | "register";

type ApiPayload = {
  success?: boolean;
  message?: string;
  code?: string;
  id?: string;
  userId?: string;
  email?: string;
  verificationEmailSent?: boolean;
  requiresAdminOtp?: boolean;
  user?: AuthUser;
  data?: {
    id?: string;
    userId?: string;
    email?: string;
    verificationEmailSent?: boolean;
    user?: AuthUser;
    [key: string]: unknown;
  };
  error?: {
    message?: string;
    code?: string;
  };
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser | null>;
  signUp: (fullName: string, email: string, password: string, initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER") => Promise<RegistrationResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authOpen: boolean;
  authMode: AuthMode;
  openAuthDialog: (mode?: AuthMode) => void;
  closeAuthDialog: () => void;
  authNotice: string;
  setAuthNotice: (message: string) => void;
  setAuthMode: (mode: AuthMode) => void;
  setAuthOpen: (open: boolean) => void;
};

export class AuthFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userId?: string,
    public readonly verificationEmailSent = false,
  ) {
    super(message);
    this.name = "AuthFlowError";
  }
}

const AuthContext = React.createContext<AuthContextType | null>(null);

async function readPayload(response: Response): Promise<ApiPayload> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload && typeof payload === "object" ? (payload as ApiPayload) : {};
}

function getMessage(payload: ApiPayload, fallback: string) {
  return payload.message || payload.error?.message || fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<AuthMode>("login");
  const [authNotice, setAuthNotice] = React.useState("");

  const refreshUser = React.useCallback(async () => {
    try {
      const response = await fetch("/api/users/me", { credentials: "same-origin" });
      const payload = await readPayload(response);
      setUser(response.ok ? payload.data as AuthUser ?? null : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    const payload = await readPayload(response);

    if (payload.code === "EMAIL_NOT_VERIFIED") {
      throw new AuthFlowError(
        getMessage(payload, "Verify your email address before signing in."),
        payload.code,
        payload.userId,
        payload.verificationEmailSent === true,
      );
    }
    if (!response.ok) throw new Error(getMessage(payload, "Sign in failed."));
    if (payload.requiresAdminOtp) {
      throw new Error(getMessage(payload, "Administrator accounts must sign in through the administrator sign-in page."));
    }

    const nextUser = payload.user ?? payload.data?.user ?? null;
    setUser(nextUser);
    setAuthOpen(false);
    setAuthNotice("");
    return nextUser;
  }, []);

  const signUp = React.useCallback(async (
    fullName: string,
    email: string,
    password: string,
    initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER",
  ) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ fullName, email, password, initialRole }),
    });
    const payload = await readPayload(response);
    if (!response.ok) throw new Error(getMessage(payload, "Registration failed."));

    const result = payload.data ?? payload;
    const userId = result.userId ?? result.id;
    if (!userId) throw new Error("Account created, but the verification request could not be prepared. Please try signing in.");

    setAuthOpen(false);
    setAuthNotice("");
    return {
      userId,
      email: result.email || email,
      verificationEmailSent: result.verificationEmailSent !== false,
    };
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      setUser(null);
    }
  }, []);

  const openAuthDialog = React.useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setAuthNotice("");
  }, []);

  const closeAuthDialog = React.useCallback(() => {
    setAuthOpen(false);
    setAuthNotice("");
  }, []);

  const value = React.useMemo<AuthContextType>(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    authOpen,
    authMode,
    openAuthDialog,
    closeAuthDialog,
    authNotice,
    setAuthNotice,
    setAuthMode,
    setAuthOpen,
  }), [user, loading, signIn, signUp, signOut, refreshUser, authOpen, authMode, openAuthDialog, closeAuthDialog, authNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
