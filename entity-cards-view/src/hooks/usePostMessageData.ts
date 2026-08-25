import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { MOCK_BLUEPRINT } from "../dev/mockData";
import { setI18nLocale } from "../i18n/instance";
import { resolveLocale } from "../i18n/resolveLocale";
import type { Entity, Page, Params, User } from "../types";
import { applyDocumentTheme, resolveThemeMode } from "../utils/themeMode";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.port.io";
const MOCK_TOKEN = "dev-mock-token";

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>({
    blueprint: { type: "blueprint", value: MOCK_BLUEPRINT },
  });
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(undefined);
  const [mockEntity] = useState<Entity | undefined>(undefined);
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(
    DEV_MOCK ? MOCK_BASE_URL : null
  );

  const applyThemeCss = sdk.applyThemeCss;
  const hostTheme = sdk.theme;

  useEffect(() => {
    setI18nLocale(resolveLocale(DEV_MOCK ? undefined : (sdk.user as User)));
    if (!DEV_MOCK) {
      applyThemeCss();
    }
  }, [applyThemeCss, sdk.user]);

  useEffect(() => {
    const syncTheme = () => {
      const mode = DEV_MOCK
        ? resolveThemeMode(
            window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
          )
        : resolveThemeMode(hostTheme?.mode);
      applyDocumentTheme(mode);
    };

    syncTheme();

    if (DEV_MOCK) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", syncTheme);
      return () => mq.removeEventListener("change", syncTheme);
    }

    const raf = requestAnimationFrame(syncTheme);
    const t = window.setTimeout(syncTheme, 0);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [hostTheme?.mode, hostTheme?.css]);

  return useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: mockParams,
        page: mockPage,
        user: mockUser,
        entity: mockEntity,
        portToken: mockToken,
        portApiBaseUrl: mockBaseUrl,
      };
    }
    return {
      params: (sdk.params ?? {}) as Params,
      page: sdk.page as Page | undefined,
      user: sdk.user as User | undefined,
      entity: sdk.entity as Entity | undefined,
      portToken: sdk.portToken,
      portApiBaseUrl: sdk.portApiBaseUrl,
    };
  }, [
    sdk,
    mockParams,
    mockPage,
    mockUser,
    mockEntity,
    mockToken,
    mockBaseUrl,
  ]);
};
