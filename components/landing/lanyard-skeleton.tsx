import { cn } from "cn";

const shimmer =
  "relative overflow-hidden bg-slate-200 dark:bg-zinc-800 after:absolute after:inset-0 after:-translate-x-full motion-safe:after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 dark:after:via-white/10 after:to-transparent";

/** Placeholder shaped like the hanging card (strap, crimp, ring, card) while the 3D scene loads. */
export function LanyardSkeleton({ className, done = false }: { className?: string; done?: boolean }) {
  return (
    <div
      className={cn("absolute inset-0 flex flex-col items-center pointer-events-none select-none", className)}
      role={done ? undefined : "status"}
      aria-label={done ? undefined : "Loading the SU Card preview"}
      aria-hidden={done || undefined}
    >
      {/* Strap from the top edge */}
      <div className={cn(shimmer, "w-[11%] max-w-14 min-w-9 flex-1 max-h-[36%] rounded-b-sm opacity-80 [mask-image:linear-gradient(to_bottom,transparent,#000_64px)]")} />
      {/* Crimp + ring */}
      <div className={cn(shimmer, "w-[12.5%] max-w-16 min-w-10 h-3 rounded-full")} />
      <div className="size-7 -mt-0.5 rounded-full border-[3px] border-slate-200 dark:border-zinc-800" />
      {/* Card */}
      <div
        className={cn(
          shimmer,
          "-mt-2 w-[min(78%,440px)] aspect-[1.585/1] rounded-[22px] p-[5%] flex justify-between gap-[6%] shadow-sm",
        )}
      >
        <div className="flex flex-col justify-between w-1/2">
          <div className="h-[9%] w-1/2 rounded-md bg-slate-300/70 dark:bg-zinc-700/70" />
          <div className="space-y-2">
            <div className="h-6 sm:h-9 w-11/12 rounded-md bg-slate-300/70 dark:bg-zinc-700/70" />
            <div className="h-2 sm:h-2.5 w-full rounded bg-slate-300/60 dark:bg-zinc-700/60" />
          </div>
          <div className="h-4 sm:h-5 w-2/5 rounded-full bg-slate-300/70 dark:bg-zinc-700/70" />
        </div>
        <div className="self-center aspect-square w-[34%] rounded-xl bg-slate-300/70 dark:bg-zinc-700/70" />
      </div>
      {!done && <span className="sr-only">Loading…</span>}
    </div>
  );
}
