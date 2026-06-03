import { useEffect, useState } from "react";
import { getI18nLocale, setI18nLocale, t as translate } from "../i18n/instance";
import { resolveLocale } from "../i18n/resolveLocale";
import type { SupportedLocale } from "../i18n/types";
import { usePostMessageData } from "./usePostMessageData";

export function useI18n() {
  const { user } = usePostMessageData();
  const [locale, setLocale] = useState<SupportedLocale>(getI18nLocale);

  useEffect(() => {
    setLocale(setI18nLocale(resolveLocale(user)));
  }, [user]);

  return { t: translate, locale };
}
