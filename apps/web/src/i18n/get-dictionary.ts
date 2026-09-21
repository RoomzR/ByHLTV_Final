import { be, type Dictionary } from "./dictionaries/be";
import { en } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { be, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? be;
}

type Primitive = string | number | boolean;

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Primitive
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${PathImpl<T[Key], keyof T[Key]>}`
      : never
  : never;

export type TranslationKey = PathImpl<Dictionary, keyof Dictionary>;

export function translate(dict: Dictionary, key: TranslationKey | string): string {
  const parts = key.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}
