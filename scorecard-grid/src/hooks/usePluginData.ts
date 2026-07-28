import { useEffect, useMemo } from "react";
import { Params, usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { CounterConfig, DrillDownConfig, PluginConfig } from "../types";
import { DEFAULT_POLL_SECONDS } from "../constants";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

// ─── Local dev params ────────────────────────────────────────────────────────
// Edit this object to simulate the values you'd set in the Port widget UI.
// Only used when running locally (DEV_MOCK = true).
const DEV_PARAMS: Record<string, unknown> = {
  blueprint: { type: "blueprint", value: { identifier: "Service" } },
  scorecardIdentifier: { type: "string", value: "score" },
  counters: {
    type: "array",
    value: [
      { emoji: "🪲", label: "Counter 1", property: "counter_1" },
      { emoji: "🐛", label: "Counter 2", property: "counter_2" },
      { emoji: "🐞", label: "Counter 3", property: "counter_3" },
    ],
  },
  drillDown: {
    type: "array",
    value: [
      {
        label: "Service",
        blueprint: "Service",
        include: ["$title", "$identifier"],
        query: {
          combinator: "and",
          rules: [],
        },
      },
    ],
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export function usePluginData() {
  const sdk = usePortPluginData();
  const applyThemeCss = sdk.applyThemeCss;
  const themeMode = sdk.theme?.mode;

  useEffect(() => {
    if (DEV_MOCK) return;
    applyThemeCss();
    const root = document.documentElement;
    const mode = typeof themeMode === "string" ? themeMode.toLowerCase() : "";
    if (mode === "light" || mode === "dark") {
      root.style.colorScheme = mode;
    } else {
      root.style.removeProperty("color-scheme");
    }
  }, [applyThemeCss, themeMode]);

  return useMemo(() => {
    const raw = (
      DEV_MOCK ? DEV_PARAMS : sdk.params ?? {}
    ) as Params<PluginConfig>;

    const bp = raw.blueprint?.value;
    const blueprintIdentifier =
      typeof bp === "object" && bp !== null
        ? (bp as { identifier: string }).identifier
        : String(bp ?? "");

    const scorecardIdentifier = raw.scorecardIdentifier?.value as string;
    const counters = Array.isArray(raw.counters?.value)
      ? (raw.counters?.value as CounterConfig[])
      : null;
    const drillDown = Array.isArray(raw.drillDown?.value)
      ? (raw.drillDown?.value as DrillDownConfig[])
      : null;

    if (
      !blueprintIdentifier ||
      !raw.scorecardIdentifier ||
      !counters ||
      !drillDown
    ) {
      return { config: null, portToken: null, portApiBaseUrl: null };
    }

    const config: PluginConfig = {
      blueprintIdentifier,
      scorecardIdentifier,
      pollIntervalSeconds: raw.pollIntervalSeconds
        ? Number(raw.pollIntervalSeconds)
        : DEFAULT_POLL_SECONDS,
      counters,
      drillDown,
      iconProperty: raw.iconProperty?.value
        ? String(raw.iconProperty.value)
        : undefined,
    };

    return {
      config,
      portToken: DEV_MOCK ? process.env.PORT_TOKEN : sdk.portToken,
      portApiBaseUrl: DEV_MOCK
        ? process.env.PORT_API_BASE_URL
        : sdk.portApiBaseUrl,
    };
  }, [sdk.params, sdk.portToken, sdk.portApiBaseUrl]);
}
