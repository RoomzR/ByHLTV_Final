import type { TranslationKey } from "@/i18n/get-dictionary";

const FORMAT_KEYS: Record<string, TranslationKey> = {
  BANNER: "admin.adsFormatBanner",
  TEASER: "admin.adsFormatTeaser",
  SPONSORED_ARTICLE: "admin.adsFormatSponsored",
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  DRAFT: "admin.adsStatusDraft",
  ACTIVE: "admin.adsStatusActive",
  PAUSED: "admin.adsStatusPaused",
  EXPIRED: "admin.adsStatusExpired",
};

export function adFormatLabel(
  format: string,
  t: (key: TranslationKey) => string,
): string {
  const key = FORMAT_KEYS[format];
  return key ? t(key) : format;
}

export function adStatusLabel(
  status: string,
  t: (key: TranslationKey) => string,
): string {
  const key = STATUS_KEYS[status];
  return key ? t(key) : status;
}
