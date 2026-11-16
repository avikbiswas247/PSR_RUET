"use client";

import * as React from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

type ToastContextType = {
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id?: string) => void;
  toasts: Toast[];
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    (item: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2, 10);
      const newToast: Toast = { id, ...item };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
      return id;
    },
    []
  );

  const dismiss = React.useCallback((id?: string) => {
    setToasts((prev) =>
      id ? prev.filter((t) => t.id !== id) : []
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

function ToastList() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id?: string) => void;
}) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const variantStyles: Record<string, string> = {
    default: "border line-border bg-surface text-text",
    destructive: "border-orange/30 bg-orange/10 text-orange-deep",
    success: "border-orange/30 bg-orange/10 text-[#14110f]",
  };

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-auto flex items-center gap-4 p-4 rounded-sm border shadow max-w-xs min-w-[300px] transition-opacity duration-300 ${variantStyles[toast.variant ?? "default"]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1">
        {toast.title && (
          <h4 className="text-sm font-semibold">{toast.title}</h4>
        )}
        {toast.description && (
          <p className="text-xs text-muted mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 p-1 text-muted hover:text-text"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

