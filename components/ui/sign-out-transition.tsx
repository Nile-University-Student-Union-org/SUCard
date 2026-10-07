"use client";

import Image from "next/image";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Loader2 } from "lucide-react";

interface SignOutTransitionProps {
  name?: string;
  logoUrl?: string | null;
  closing?: boolean;
}

export function SignOutTransition({
  name = "SU Card",
  logoUrl,
  closing = false,
}: SignOutTransitionProps) {
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      tabIndex={-1}
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background p-6 text-foreground motion-reduce:animate-none ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-300"}`}
    >
      <div className="flex max-w-full items-center gap-3">
        <Image
          src={logoUrl || "/brand/su-logo-color.png"}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 object-contain dark:hidden"
        />
        <Image
          src={logoUrl || "/brand/su-logo-white@hd.png"}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 object-contain hidden dark:block"
        />
        <span className="min-w-0 truncate text-xl font-bold font-heading uppercase tracking-wide">{name}</span>
      </div>
      <p className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin motion-reduce:animate-none text-brand"
        />
        Signing out…
      </p>
    </div>,
    document.body,
  );
}

export function showSignOutTransition(
  props?: Omit<SignOutTransitionProps, "closing">,
) {
  if (typeof document === "undefined") {
    return {
      ready: Promise.resolve(),
      dismiss() {},
    };
  }
  const root = createRoot(document.createElement("div"));
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  flushSync(() => root.render(<SignOutTransition {...props} />));
  (document.body.lastElementChild as HTMLElement | null)?.focus();
  return {
    ready: new Promise<void>((resolve) =>
      window.setTimeout(
        resolve,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300,
      ),
    ),
    dismiss() {
      root.render(<SignOutTransition {...props} closing />);
      window.setTimeout(
        () => {
          root.unmount();
          document.body.style.overflow = previousOverflow;
        },
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150,
      );
    },
  };
}
