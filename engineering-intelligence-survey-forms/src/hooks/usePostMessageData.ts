import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";
import { MOCK_SURVEY_ENTITY } from "../dev/mockData";

// ---------------------------------------------------------------------------
// Dev-mode mock - only active when the widget runs outside Port's iframe.
// Simulates landing on the seeded `survey` entity page with both params set.
// ---------------------------------------------------------------------------
export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.port.io";
const MOCK_TOKEN = "dev-mock-token";
const MOCK_USER: User = { email: "developer@example.com", firstName: "Dev" };

// In dev we mimic the entity-page surface: host entity is the survey itself,
// and both blueprint params are pre-filled.
const MOCK_PARAMS: Params = {
  responseBlueprint: { type: "blueprint", value: { identifier: "surveyResponse" } },
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
  const [mockEntity] = useState<Entity | undefined>(
    DEV_MOCK ? MOCK_SURVEY_ENTITY : undefined
  );
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(DEV_MOCK ? MOCK_BASE_URL : null);

  const applyThemeCss = sdk.applyThemeCss;

  // Always apply - Port injects theme on PLUGIN_DATA; skipping leaves low-contrast UI.
  // Then align `color-scheme` to the resolved background so native controls and
  // default surfaces render light-on-dark in dark themes (otherwise question
  // frames / inputs render as dark/near-black boxes).
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
