"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Reveal } from "@/components/effects/page-transition";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";

interface SectionHeaderProps {
  titleKey?: TranslationKey;
  title?: string;
  subtitleKey?: TranslationKey;
  subtitle?: string;
  href?: string;
  actionKey?: TranslationKey;
  icon?: ReactNode;
}

export function SectionHeader({
  titleKey,
  title,
  subtitleKey,
  subtitle,
  href,
  actionKey = "home.viewAll",
  icon,
}: SectionHeaderProps) {
  const { t } = useI18n();
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedSubtitle = subtitleKey ? t(subtitleKey) : subtitle;

  return (
    <Reveal className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
            {resolvedTitle}
          </h2>
        </div>
        {resolvedSubtitle ? (
          <p className="mt-1 text-sm text-zinc-500">{resolvedSubtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {t(actionKey)}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </Reveal>
  );
}
