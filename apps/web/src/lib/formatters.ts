import { format } from "date-fns";
import { be, enUS, ru } from "date-fns/locale";

import type { Locale } from "@/i18n/config";

const DATE_LOCALES = {
  be,
  ru,
  en: enUS,
} as const;

function dateLocale(locale: Locale) {
  return DATE_LOCALES[locale] ?? be;
}

export function formatMatchTime(iso: string, locale: Locale = "be"): string {
  return format(new Date(iso), "dd MMM HH:mm", { locale: dateLocale(locale) });
}

export function formatRelative(iso: string, locale: Locale = "be"): string {
  return format(new Date(iso), "dd MMM HH:mm", { locale: dateLocale(locale) });
}

export function formatRating(value: number): string {
  return value.toFixed(2);
}

export function formatPrize(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
