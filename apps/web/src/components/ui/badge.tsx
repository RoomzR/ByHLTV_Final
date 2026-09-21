import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#3a3a3a] bg-[#2a2a2a] text-zinc-300",
        cyan: "border-[var(--hltv-green)]/40 bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]",
        green: "border-[var(--hltv-green)]/40 bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]",
        live: "border-[var(--hltv-live)]/50 bg-[var(--hltv-live)] text-white animate-pulse",
        gold: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
