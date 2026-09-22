import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";

// ---------------------------------------------------------------------------
// Dev-mode mock, only active when the widget runs outside Port's iframe.
// Customize the mock values below for local development.
// ---------------------------------------------------------------------------
export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";

// This is a dashboard-only widget (no entity page context).
const MOCK_ENTITY_ID: string | null = null;
const MOCK_ENTITY_BLUEPRINT = "service";
const MOCK_ENTITY_TITLE = "My Entity";

const MOCK_USER_EMAIL = "developer@example.com";

// Preview config: "Top contributors by number of skills contributed".
const MOCK_PARAMS: Params = {
  blueprint: { type: "blueprint", value: { identifier: "_user", title: "User" } },
  sortProperty: { type: "string", value: "skillsContributed" },
  sortDirection: { type: "string", value: "desc" },
  limit: { type: "number", value: 10 },
};

// ---------------------------------------------------------------------------

const mockEntity: Entity | undefined =
  DEV_MOCK && MOCK_ENTITY_ID
    ? {
        identifier: MOCK_ENTITY_ID,
        blueprint: MOCK_ENTITY_BLUEPRINT,
        title: MOCK_ENTITY_TITLE,
      }
    : undefined;

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>(DEV_MOCK ? MOCK_PARAMS : {});
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(
    DEV_MOCK ? { email: MOCK_USER_EMAIL } : undefined
  );
  const [mockEntity_] = useState<Entity | undefined>(mockEntity);
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(
    DEV_MOCK ? MOCK_BASE_URL : null
  );

  const applyThemeCss = sdk.applyThemeCss;

  // Always apply, Port injects theme on PLUGIN_DATA; skipping leaves invisible/low-contrast UI.
  useEffect(() => {
    applyThemeCss();
  }, [applyThemeCss]);

  const result = useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: mockParams,
        page: mockPage,
        user: mockUser,
        entity: mockEntity_,
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
    mockEntity_,
    mockToken,
    mockBaseUrl,
  ]);

  return result;
};
