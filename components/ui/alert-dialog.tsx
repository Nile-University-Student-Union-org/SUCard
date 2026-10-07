"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: "info" | "success" | "warning" | "destructive" | "brand";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantIconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
  brand: ShieldCheck,
};

const variantStyleMap = {
  info: {
    iconBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    buttonVariant: "secondary" as const,
  },
  success: {
    iconBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    buttonVariant: "primary" as const,
  },
  warning: {
    iconBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    buttonVariant: "accent" as const,
  },
  destructive: {
    iconBg: "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    buttonVariant: "destructive" as const,
  },
  brand: {
    iconBg: "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border-brand/20 dark:border-brand-soft/30",
    buttonVariant: "primary" as const,
  },
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = "info",
  confirmText = "Continue",
  cancelText,
  onConfirm,
  isLoading = false,
  icon,
  className,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const IconComponent = variantIconMap[variant] || Info;
  const { iconBg, buttonVariant } = variantStyleMap[variant] || variantStyleMap.info;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      role="alertdialog"
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton={false}
      showDragHandle={true}
      initialFocusRef={variant === "destructive" && cancelText ? cancelRef : undefined}
      className={cn("p-6 text-center sm:text-left", className)}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Leading Accent Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-[14px] border-2 flex items-center justify-center shrink-0 shadow-xs",
            iconBg
          )}
        >
          {icon || <IconComponent className="w-6 h-6" />}
        </div>

        {/* Text Details */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <h3 className="text-lg font-black text-eel-dark-blue dark:text-white leading-snug [overflow-wrap:anywhere]">
            {title}
          </h3>
          {description && (
            <div className="text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed [overflow-wrap:anywhere]">
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        {cancelText && (
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] px-6 text-xs font-bold"
          >
            {cancelText}
          </Button>
        )}

        <Button
          type="button"
          variant={buttonVariant}
          size="md"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full sm:w-auto min-h-[44px] px-6 text-xs font-bold rounded-[12px]"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
