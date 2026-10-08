import React from "react";
import Link, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex min-h-[44px] items-center justify-center gap-2 font-bold rounded-tactile select-none cursor-pointer transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0 disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "text-white dark:text-midnight bg-brand border-b-4 border-black/25 duration-100 hover:brightness-110 active:translate-y-[2px] active:border-b-2 shadow-xs",
        secondary:
          "text-charcoal dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 active:scale-[0.98]",
        surface:
          "text-charcoal dark:text-zinc-200 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.98]",
        destructive:
          "text-white bg-rose-600 border-b-4 border-black/25 hover:bg-rose-500 active:translate-y-[2px] active:border-b-2 shadow-xs",
        accent:
          "text-midnight dark:text-midnight bg-macaw-blue border-b-4 border-black/25 hover:brightness-110 active:translate-y-[2px] active:border-b-2 shadow-xs",
        ghost:
          "text-charcoal dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-charcoal dark:hover:text-white active:scale-[0.98]",
        outline:
          "text-charcoal dark:text-zinc-100 bg-transparent border-2 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-zinc-500 active:scale-[0.98]",
        "outline-brand":
          "text-brand dark:text-brand-soft bg-transparent border-2 border-brand/40 dark:border-brand-soft/40 hover:border-brand dark:hover:border-brand-soft hover:bg-brand/10 dark:hover:bg-brand-soft/15 active:scale-[0.98]",
        "outline-blue":
          "text-eel-dark-blue dark:text-sky-300 bg-transparent border-2 border-macaw-blue-dark dark:border-macaw-blue hover:border-macaw-blue hover:bg-macaw-blue/15 active:scale-[0.98]",
        "outline-inverse":
          "text-white bg-white/10 border-2 border-white/60 hover:bg-white/20 hover:border-white backdrop-blur-sm active:scale-[0.98] focus-visible:ring-white dark:focus-visible:ring-white focus-visible:ring-offset-0 dark:focus-visible:ring-offset-0",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
        icon: "w-11 min-w-[44px] h-11 p-0",
        "icon-sm": "w-11 min-w-[44px] h-11 p-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  render?: React.ReactElement;
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant,
  size,
  className,
  type = "button",
  loading = false,
  loadingText,
  disabled,
  render,
  children,
  ...props
}, ref) {
  const isDisabled = disabled || loading;
  const classes = cn(buttonVariants({ variant, size }), className);

  if (render && React.isValidElement(render)) {
    const isButtonElement =
      render.type === "button" ||
      (typeof render.type === "function" &&
        (render.type as { displayName?: string }).displayName?.toLowerCase().includes("button"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderProps = render.props as any;

    return React.cloneElement(render, {
      className: cn(classes, renderProps.className),
      children: renderProps.children ?? children,
      "aria-busy": loading ? true : undefined,
      ...(isButtonElement
        ? { disabled: isDisabled }
        : { "aria-disabled": isDisabled ? true : undefined }),
      ...props,
    } as React.Attributes & Record<string, unknown>);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading ? true : undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0 motion-reduce:animate-none" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";

export interface ButtonLinkProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    VariantProps<typeof buttonVariants> {}

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant,
  size,
  className,
  ...props
}) => <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
