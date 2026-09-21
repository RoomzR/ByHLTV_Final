export const LOCALES = ["be", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  be: "Беларуская",
  ru: "Русский",
  en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  be: "BE",
  ru: "RU",
  en: "EN",
};

export const DEFAULT_LOCALE: Locale = "ru";
export const STORAGE_KEY = "byhltv-locale";
