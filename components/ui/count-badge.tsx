import { Badge } from "./badge";

export interface CountBadgeProps {
  count: number;
  singularLabel: string;
  pluralLabel: string;
}

export function CountBadge({
  count,
  singularLabel,
  pluralLabel,
}: CountBadgeProps) {
  return (
    <Badge
      variant="brand"
      shape="pill"
      size="sm"
      aria-label={`${count} ${count === 1 ? singularLabel : pluralLabel}`}
      className="h-5 min-w-[20px] shrink-0 justify-center px-1.5 text-[11px] leading-none normal-case tracking-normal tabular-nums dark:bg-brand-soft dark:text-zinc-950"
    >
      {count}
    </Badge>
  );
}
