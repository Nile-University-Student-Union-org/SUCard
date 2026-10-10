"use client";

import React, { forwardRef, useId, useRef, useState, useCallback } from "react";
import { Upload, AlertCircle, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileDropProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // In bytes
  disabled?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  fileName?: string;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

export const FileDrop = forwardRef<HTMLInputElement, FileDropProps>(
  (
    {
      onFileSelect,
      accept,
      maxSize,
      disabled = false,
      label,
      helperText,
      error,
      icon,
      title = "Click to browse or drag and drop",
      description,
      fileName,
      className,
      id,
      children,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const internalInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalInputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const handleFile = (file: File) => {
      setLocalError(null);
      if (maxSize && file.size > maxSize) {
        const sizeMb = (maxSize / (1024 * 1024)).toFixed(1);
        setLocalError(`File size exceeds maximum of ${sizeMb} MB`);
        return;
      }
      onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value so same file can be picked again if desired
      e.target.value = "";
    };

    const displayError = error || localError;

    return (
      <div className={cn("w-full space-y-1.5 text-left font-sans", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-slate-700 dark:text-zinc-300 block"
          >
            {label}
          </label>
        )}

        {/* Hidden accessible input */}
        <input
          ref={setRefs}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {children ? (
          <div
            onClick={() => !disabled && internalInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {children}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && internalInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                internalInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "group relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2.5 min-h-[140px]",
              isDragging
                ? "border-brand bg-brand/5 dark:bg-brand/10 scale-[0.99]"
                : "border-slate-300 dark:border-zinc-700 hover:border-brand/60 hover:bg-slate-50 dark:hover:bg-zinc-800/50 bg-white dark:bg-zinc-900",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="size-11 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              {fileName ? (
                <FileCheck className="size-5" />
              ) : icon ? (
                icon
              ) : (
                <Upload className="size-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[280px]">
                {fileName || title}
              </p>
              {description && (
                <p className="text-[11px] text-muted-foreground font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {displayError ? (
          <p className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{displayError}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs font-medium text-ash dark:text-zinc-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FileDrop.displayName = "FileDrop";
