"use client";

import { Suspense } from "react";

import { SearchView } from "@/components/search/search-view";
import { useI18n } from "@/i18n/provider";

export default function SearchPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-zinc-500">{t("common.loading")}</div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
