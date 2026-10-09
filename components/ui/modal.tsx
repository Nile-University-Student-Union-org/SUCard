"use client";

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const emptySubscribe = () => () => {};

interface ModalContextValue {
  titleId: string;
  descriptionId: string;
  setTitleRendered: (val: boolean) => void;
  setDescriptionRendered: (val: boolean) => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  zIndex?: string;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  maxWidth = "lg",
  showCloseButton = true,
  showDragHandle = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  zIndex = "z-50",
  role = "dialog",
  ariaLabel,
  initialFocusRef,
}) => {
  const [present, setPresent] = useState(isOpen);
  const [titleRendered, setTitleRendered] = useState(false);
  const [descriptionRendered, setDescriptionRendered] = useState(false);
  if (isOpen && !present) setPresent(true);
  useEffect(() => {
    if (isOpen || !present) return;
    const timeout = window.setTimeout(
      () => setPresent(false),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 130
    );
    return () => window.clearTimeout(timeout);
  }, [isOpen, present]);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Lock body scroll while modal is open
  useEffect(() => {
    if (present) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      const openModals = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (openModals.length === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [present]);

  // Focus trap & restore focus on close
  useEffect(() => {
    if (!present) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusFrame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      );
      (initialFocusRef?.current || first || panelRef.current)?.focus();
    });
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const dialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (!dialogs[dialogs.length - 1]?.contains(panelRef.current)) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleTab);
      previousFocus?.focus();
    };
  }, [present, initialFocusRef]);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (
        e.key === "Escape" &&
        isOpen &&
        dialogs[dialogs.length - 1]?.contains(panelRef.current)
      ) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  if (!mounted || !present) return null;

  const isLabelled = Boolean(title) || titleRendered;
  const isDescribed = Boolean(description) || descriptionRendered;

  const modalNode = (
    <ModalContext.Provider
      value={{
        titleId,
        descriptionId,
        setTitleRendered,
        setDescriptionRendered,
      }}
    >
      <div
        className={cn(
          "fixed inset-0 flex min-w-0 items-end sm:items-center justify-center p-0 sm:p-6 md:p-10 overflow-hidden",
          zIndex
        )}
        role={role}
        aria-modal="true"
        aria-labelledby={isLabelled ? titleId : undefined}
        aria-describedby={isDescribed ? descriptionId : undefined}
        aria-label={!isLabelled ? (ariaLabel || "Dialog") : undefined}
      >
        {/* Backdrop */}
        <div
          onClick={isOpen && closeOnBackdropClick ? onClose : undefined}
          className={cn(
            "fixed inset-0 bg-black/65 backdrop-blur-sm motion-reduce:animate-none",
            isOpen ? "animate-in fade-in duration-180 ease-out" : "animate-out fade-out duration-130 ease-in"
          )}
          aria-hidden="true"
        />

        {/* Modal / Bottom Sheet Panel */}
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            "relative w-full min-w-0 max-w-full max-h-[92dvh] sm:max-h-[90dvh] flex flex-col bg-white dark:bg-zinc-900 rounded-t-[28px] sm:rounded-[24px] border-t-2 sm:border-2 border-slate-200 dark:border-zinc-800 shadow-2xl text-foreground overflow-hidden z-10 motion-reduce:animate-none pb-safe sm:pb-0",
            isOpen
              ? "animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-180 ease-out"
              : "animate-out fade-out slide-out-to-bottom-4 sm:slide-out-to-bottom-0 sm:zoom-out-95 duration-130 ease-in",
            maxWidthMap[maxWidth],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          {showDragHandle && (
            <div className="sm:hidden pt-3 pb-1 flex justify-center items-center bg-white dark:bg-zinc-900 shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
            </div>
          )}

          {/* Dedicated Top Header */}
          {(title || showCloseButton) && (
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand dark:text-brand-soft shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <div
                      id={titleId}
                      className="text-sm sm:text-base font-black text-eel-dark-blue dark:text-white leading-snug [overflow-wrap:anywhere]"
                    >
                      {title}
                    </div>
                  )}
                  {description && (
                    <p
                      id={descriptionId}
                      className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed mt-0.5 [overflow-wrap:anywhere]"
                    >
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {showCloseButton && (
                <Button
                  onClick={onClose}
                  type="button"
                  variant="surface"
                  size="icon"
                  aria-label="Close dialog"
                  className="shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}

          {/* Modal Children Content */}
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(modalNode, document.body);
};

export const ModalHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-5 py-4 sm:px-6 border-b-2 border-slate-200 dark:border-zinc-800 shrink-0",
      className
    )}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, id, ...props }, ref) => {
  const context = React.useContext(ModalContext);
  useEffect(() => {
    context?.setTitleRendered(true);
    return () => context?.setTitleRendered(false);
  }, [context]);

  return (
    <h2
      ref={ref}
      id={id || context?.titleId}
      className={cn(
        "text-xl sm:text-2xl font-black text-eel-dark-blue dark:text-white leading-tight font-heading tracking-wide uppercase",
        className
      )}
      {...props}
    />
  );
});
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, id, ...props }, ref) => {
  const context = React.useContext(ModalContext);
  useEffect(() => {
    context?.setDescriptionRendered(true);
    return () => context?.setDescriptionRendered(false);
  }, [context]);

  return (
    <p
      ref={ref}
      id={id || context?.descriptionId}
      className={cn(
        "mt-1 text-sm text-ash dark:text-zinc-400 font-medium",
        className
      )}
      {...props}
    />
  );
});
ModalDescription.displayName = "ModalDescription";

export const ModalBody = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-w-0 [overflow-wrap:anywhere] overflow-y-auto thin-scrollbar p-5 sm:p-6 flex-1 min-h-0 space-y-4 overscroll-contain",
      className
    )}
    {...props}
  />
));
ModalBody.displayName = "ModalBody";

export const ModalFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 sm:p-5 border-t-2 border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-safe z-10 shrink-0",
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";
