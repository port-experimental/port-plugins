import type { User } from "../types";
import type { SupportedLocale } from "./types";
import { MESSAGE_BUNDLES } from "./messages";

export function normalizeLocaleTag(raw: string): SupportedLocale {
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  if (base in MESSAGE_BUNDLES) return base as SupportedLocale;
  return "en";
}

export function resolveLocale(user?: User | null): SupportedLocale {
  const record = user as Record<string, unknown> | undefined;
  const fromUser =
    (typeof record?.locale === "string" && record.locale) ||
    (typeof record?.language === "string" && record.language) ||
    (typeof record?.preferredLanguage === "string" &&
      record.preferredLanguage);

  if (fromUser) return normalizeLocaleTag(fromUser);

  if (typeof document !== "undefined") {
    const docLang = document.documentElement.lang;
    if (docLang?.trim()) return normalizeLocaleTag(docLang);
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLocaleTag(navigator.language);
  }

  return "en";
}
