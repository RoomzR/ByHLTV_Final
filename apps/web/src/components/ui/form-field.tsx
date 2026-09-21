import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export const fieldInputClass =
  "w-full border border-[var(--border)] bg-[#121212] px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[var(--hltv-green)]";
