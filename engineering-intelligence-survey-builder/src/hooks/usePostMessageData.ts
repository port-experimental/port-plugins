import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";

// ---------------------------------------------------------------------------
// Dev-mode mock - only active when the widget runs outside Port's iframe.
// Simulates a dashboard placement with the surveyBlueprint param set.
// ---------------------------------------------------------------------------
export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.port.io";
const MOCK_TOKEN = "dev-mock-token";
const MOCK_USER: User = { email: "builder@example.com", firstName: "Dev" };

const MOCK_PARAMS: Params = {
  surveyBlueprint: { type: "blueprint", value: { identifier: "survey" } },
};

/** "dark" | "light" from the resolved app background, for native control glyphs. */
function resolveColorScheme(): "dark" | "light" {
  try {
    const probe = document.createElement("div");
    probe.style.cssText =
      "background:var(--bg);position:absolute;width:0;height:0;pointer-events:none";
    document.documentElement.appendChild(probe);
    const rgb = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const m = rgb.match(/\d+(?:\.\d+)?/g);
    if (!m || m.length < 3) return "light";
    const [r, g, b] = m.map(Number);
    // Relative luminance; below the mid-point ⇒ a dark surface.
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5 ? "dark" : "light";
  } catch {
    return "light";
  }
}

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>(MOCK_PARAMS);
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(DEV_MOCK ? MOCK_USER : undefined);
  const [mockEntity] = useState<Entity | undefined>(undefined);
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(DEV_MOCK ? MOCK_BASE_URL : null);

  const applyThemeCss = sdk.applyThemeCss;

  // Always apply - Port injects theme on PLUGIN_DATA; skipping leaves low-contrast UI.
  // Then align `color-scheme` to the resolved background so native controls (the
  // date-picker icon, <select> arrows, scrollbars) render light-on-dark in dark
  // themes instead of a dark, near-invisible glyph.
  useEffect(() => {
    applyThemeCss();
    document.documentElement.style.colorScheme = resolveColorScheme();
  }, [applyThemeCss]);

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
  }, [sdk, mockParams, mockPage, mockUser, mockEntity, mockToken, mockBaseUrl]);
};
