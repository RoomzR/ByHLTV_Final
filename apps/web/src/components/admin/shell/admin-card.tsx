import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-[#2a2a2a] bg-[#171717]", className)}>
      {title || action ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#2a2a2a] px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  tone = "default",
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "amber" | "rose";
  delta?: number | null;
}) {
  const valueClass =
    tone === "green"
      ? "text-[var(--hltv-green)]"
      : tone === "amber"
        ? "text-amber-300"
        : tone === "rose"
          ? "text-[#e35d5d]"
          : "text-white";
  const deltaClass =
    delta == null
      ? ""
      : delta > 0
        ? "text-[var(--hltv-green)]"
        : delta < 0
          ? "text-[#e35d5d]"
          : "text-zinc-500";
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn("mt-2 font-mono text-2xl font-bold tabular-nums", valueClass)}>{value}</div>
      {delta != null ? (
        <div className={cn("mt-1 text-xs font-medium tabular-nums", deltaClass)}>
          {delta > 0 ? "+" : ""}
          {(delta * 100).toFixed(1)}%
        </div>
      ) : null}
      {hint ? <div className="mt-1 text-xs text-zinc-600">{hint}</div> : null}
    </div>
  );
}
