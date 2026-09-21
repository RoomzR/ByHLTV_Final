import type { Locale } from "@/i18n/config";

export type I18nText = Record<Locale, string>;

export function pickText(value: I18nText | string, locale: Locale): string {
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? value.ru ?? value.be;
}
