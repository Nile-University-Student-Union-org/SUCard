"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { cn } from "cn";

export type ToastVariant = "success" | "error" | "warning" | "info" | "brand";

export interface ToastItem {
  id: string;
  message: ReactNode;
  title?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  isOpen?: boolean;
  message?: ReactNode;
  title?: ReactNode;
  variant?: ToastVariant;
  onClose?: () => void;
  duration?: number;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const emptySubscribe = () => () => {};

const variantStyles: Record<
  ToastVariant,
  {
    bg: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
> = {
  success: {
    bg: "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-950/20 border-emerald-500/20",
    icon: CheckCircle2,
    iconClass: "text-white",
  },
  error: {
    bg: "bg-rose-600 dark:bg-rose-500 text-white shadow-rose-950/20 border-rose-500/20",
    icon: AlertCircle,
    iconClass: "text-white",
  },
  warning: {
    bg: "bg-amber-600 dark:bg-amber-500 text-white shadow-amber-950/20 border-amber-500/20",
    icon: AlertTriangle,
    iconClass: "text-white",
  },
  info: {
    bg: "bg-sky-600 dark:bg-sky-500 text-white shadow-sky-950/20 border-sky-500/20",
    icon: Info,
    iconClass: "text-white",
  },
  brand: {
    bg: "bg-brand text-white shadow-brand-dark/20 border-brand-soft/30",
    icon: CheckCircle2,
    iconClass: "text-current",
  },
};

export const Toast: React.FC<ToastProps> = ({
  isOpen = true,
  message,
  title,
  variant = "success",
  onClose,
  duration = 3500,
  className,
  action,
}) => {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen || !onClose || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, duration]);

  if (!mounted || !isOpen || !message) return null;

  const currentVariant = variantStyles[variant] || variantStyles.success;
  const Icon = currentVariant.icon;

  const content = (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-[80] max-w-md",
        "flex items-start gap-3 px-5 py-3.5 rounded-2xl shadow-xl border",
        "animate-in slide-in-from-bottom-5 fade-in-0 duration-300",
        currentVariant.bg,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", currentVariant.iconClass)} />

      <div className="flex-1 min-w-0">
        {title && <div className="text-sm font-black leading-snug">{title}</div>}
        <div className="text-sm font-bold leading-snug">{message}</div>

        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose?.();
            }}
            className="mt-2 text-xs font-black uppercase tracking-wider underline hover:opacity-80 cursor-pointer"
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className={cn("shrink-0 p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer", variant === "brand" ? "text-current" : "text-white")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
};

interface ToastContextValue {
  showToast: (item: Omit<ToastItem, "id"> | string) => void;
  toast: {
    (item: Omit<ToastItem, "id"> | string): void;
    success: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) => void;
    error: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) => void;
    warning: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) => void;
    info: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) => void;
    brand: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) => void;
  };
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (item: Omit<ToastItem, "id"> | string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const toastData: ToastItem =
        typeof item === "string"
          ? { id, message: item, variant: "success", duration: 3500 }
          : { id, variant: "success", duration: 3500, ...item };

      setToasts((prev) => [...prev, toastData]);

      if (toastData.duration && toastData.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, toastData.duration);
      }
    },
    [dismissToast]
  );

  const toastMethods = Object.assign(
    (item: Omit<ToastItem, "id"> | string) => showToast(item),
    {
      success: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) =>
        showToast({ message, variant: "success", ...options }),
      error: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) =>
        showToast({ message, variant: "error", ...options }),
      warning: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) =>
        showToast({ message, variant: "warning", ...options }),
      info: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) =>
        showToast({ message, variant: "info", ...options }),
      brand: (message: ReactNode, options?: Partial<Omit<ToastItem, "id" | "message" | "variant">>) =>
        showToast({ message, variant: "brand", ...options }),
    }
  );

  const portalContent = mounted && toasts.length > 0 && typeof document !== "undefined"
    ? createPortal(
        <div
          role="region"
          aria-label="Notifications"
          className="fixed bottom-6 right-6 z-[80] flex flex-col gap-2.5 pointer-events-none max-w-md w-full sm:w-auto"
        >
          {toasts.map((item) => {
            const currentVariant = variantStyles[item.variant || "success"] || variantStyles.success;
            const Icon = currentVariant.icon;

            return (
              <div
                key={item.id}
                role="alert"
                aria-live="polite"
                className={cn(
                  "pointer-events-auto flex items-start gap-3 px-5 py-3.5 rounded-2xl shadow-xl border",
                  "animate-in slide-in-from-bottom-5 fade-in-0 duration-300",
                  currentVariant.bg
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", currentVariant.iconClass)} />

                <div className="flex-1 min-w-0">
                  {item.title && <div className="text-sm font-black leading-snug">{item.title}</div>}
                  <div className="text-sm font-bold leading-snug">{item.message}</div>

                  {item.action && (
                    <button
                      onClick={() => {
                        item.action?.onClick();
                        dismissToast(item.id);
                      }}
                      className="mt-2 text-xs font-black uppercase tracking-wider underline hover:opacity-80 cursor-pointer"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => dismissToast(item.id)}
                  aria-label="Dismiss notification"
                  className={cn("shrink-0 p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer", item.variant === "brand" ? "text-current" : "text-white")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        toast: toastMethods,
        dismissToast,
        dismissAll,
      }}
    >
      {children}
      {portalContent}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider />");
  }
  return context;
};
