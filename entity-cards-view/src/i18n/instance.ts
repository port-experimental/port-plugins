import { MESSAGE_BUNDLES } from "./messages";
import { normalizeLocaleTag } from "./resolveLocale";
import type { MessageKey, Messages, SupportedLocale } from "./types";

let locale: SupportedLocale = "en";
let messages: Messages = MESSAGE_BUNDLES.en;

export function setI18nLocale(tag: string): SupportedLocale {
  locale = normalizeLocaleTag(tag);
  messages = MESSAGE_BUNDLES[locale];
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    document.documentElement.dir =
      locale === "he" ? "rtl" : document.documentElement.dir || "ltr";
  }
  return locale;
}

export function getI18nLocale(): SupportedLocale {
  return locale;
}

export function t(
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  let text = messages[key] ?? MESSAGE_BUNDLES.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
