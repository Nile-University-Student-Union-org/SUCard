"use client";

import React, { useRef, useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "./modal";
import { Button } from "./button";
import { UserAvatar } from "./user-avatar";
import { showSignOutTransition } from "./sign-out-transition";
import { signOut } from "@/lib/auth/client";

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  onConfirm?: () => Promise<void> | void;
  redirectTo?: string;
  isAdmin?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  className?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  redirectTo = "/login",
  isAdmin = true,
  title,
  description,
  confirmText = "Sign out",
  cancelText = "Stay signed in",
  className,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const transition = showSignOutTransition({
      name: "SU Card",
    });

    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // will redirect below
          },
        },
      });
      await transition.ready;
      await onConfirm?.();
      window.location.replace(redirectTo);
    } catch {
      transition.dismiss();
      setError("We couldn't reach the server to end your session.");
      submittingRef.current = false;
      setIsSubmitting(false);
      cancelRef.current?.focus();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submittingRef.current) {
          setError(null);
          onClose();
        }
      }}
      title={title ?? (isAdmin ? "Sign out of admin console?" : "Sign out?")}
      icon={
        isAdmin ? (
          <ShieldAlert className="h-5 w-5" />
        ) : (
          <LogOut className="h-5 w-5" />
        )
      }
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton={false}
      closeOnEscape={!isSubmitting}
      closeOnBackdropClick={!isSubmitting}
      initialFocusRef={cancelRef}
      className={className}
    >
      <ModalBody>
        {user && (
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            <UserAvatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-bold">{user.name}</p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={user.email || undefined}
              >
                {user.email || user.role}
              </p>
            </div>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description ??
            (isAdmin
              ? "You'll need to sign in again to reach the admin console."
              : "You'll need to sign in again to continue.")}
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive font-semibold">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter className="flex-col items-stretch sm:flex-col sm:items-stretch gap-3">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full">
          <Button
            ref={cancelRef}
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              setError(null);
              onClose();
            }}
            className="w-full sm:w-auto normal-case"
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            loading={isSubmitting}
            loadingText="Signing out…"
            onClick={handleConfirm}
            className="w-full sm:w-auto normal-case"
          >
            <LogOut className="h-4 w-4" />
            {error ? "Try again" : confirmText}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
