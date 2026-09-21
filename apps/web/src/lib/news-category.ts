import type { TranslationKey } from "@/i18n/get-dictionary";

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  news: "news.categories.news",
  interview: "news.categories.interview",
  analysis: "news.categories.analysis",
  transfer: "news.categories.transfer",
};

export function newsCategoryKey(category?: string | null): TranslationKey {
  const key = (category ?? "news").toLowerCase();
  return CATEGORY_KEYS[key] ?? "news.categories.news";
}
