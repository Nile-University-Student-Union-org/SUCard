import React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "cn";

export interface AuthSubmitSuccess {
  label: string;
  message: string;
}

interface AuthSubmitButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingLabel: string;
  success?: AuthSubmitSuccess | null;
}

export function AuthSubmitButton({
  isLoading,
  loadingLabel,
  success,
  disabled,
  className,
  children,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <>
      <Button
        {...props}
        type="submit"
        disabled={disabled || isLoading || Boolean(success)}
        aria-busy={isLoading && !success}
        className={cn(
          "w-full min-h-[48px] text-[15px] font-black",
          (isLoading || success) && "disabled:opacity-100",
          className,
        )}
      >
        {success ? (
          <>
            <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>{success.label}</span>
          </>
        ) : isLoading ? (
          <>
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
            />
            <span>{loadingLabel}</span>
          </>
        ) : (
          children
        )}
      </Button>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {success?.message ?? ""}
      </span>
    </>
  );
}
