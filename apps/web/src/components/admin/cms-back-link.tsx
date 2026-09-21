"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function CmsBackLink({ className }: { className?: string }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const toAdmin = can("admin.panel");

  return (
    <Link
      href={toAdmin ? "/admin" : "/profile"}
      className={cn("text-sm text-zinc-400 transition-colors hover:text-white hover:underline", className)}
    >
      {toAdmin ? t("admin.back") : t("account.backToDesk")}
    </Link>
  );
}
