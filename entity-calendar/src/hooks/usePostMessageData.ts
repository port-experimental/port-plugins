import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";

// ---------------------------------------------------------------------------
// Dev-mode mock — only active when the widget runs outside Port's iframe.
// Customize the mock values below for local development.
// ---------------------------------------------------------------------------
export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";

const MOCK_USER_EMAIL = "developer@example.com";

const MOCK_BLUEPRINT = {
  identifier: "service",
  title: "Service",
};

// ---------------------------------------------------------------------------

const mockEntity: Entity | undefined = undefined;

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>({
    blueprint: { type: "blueprint", value: MOCK_BLUEPRINT },
  });
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

  useEffect(() => {
    if (!DEV_MOCK) {
      applyThemeCss();
    }
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
