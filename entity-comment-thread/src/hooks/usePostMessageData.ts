import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";
import { MOCK_SUBJECT_BLUEPRINT, MOCK_SUBJECT_IDENTIFIER } from "../dev/mockData";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";
const MOCK_USER_EMAIL = "alice@example.com";

const mockEntity: Entity | undefined = DEV_MOCK
  ? {
      identifier: MOCK_SUBJECT_IDENTIFIER,
      blueprint: MOCK_SUBJECT_BLUEPRINT,
      title: "Payment Service",
    }
  : undefined;

// subjectBlueprint is inferred from host entity at runtime — only commentBlueprint needed
const mockParams: Params = DEV_MOCK
  ? { commentBlueprint: { value: { identifier: "comment", title: "Comment" } } }
  : {};

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [devParams] = useState<Params>(mockParams);
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(
    DEV_MOCK
      ? { email: MOCK_USER_EMAIL, firstName: "Alice", lastName: "Chen" }
      : undefined
  );
  const [mockEntityState] = useState<Entity | undefined>(mockEntity);
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(
    DEV_MOCK ? MOCK_BASE_URL : null
  );

  const applyThemeCss = sdk.applyThemeCss;
  const themeMode = sdk.theme?.mode;

  useEffect(() => {
    applyThemeCss();
  }, [applyThemeCss]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      themeMode === "dark" ? "dark" : "light"
    );
  }, [themeMode]);

  const result = useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: devParams,
        page: mockPage,
        user: mockUser,
        entity: mockEntityState,
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
  }, [sdk, devParams, mockPage, mockUser, mockEntityState, mockToken, mockBaseUrl]);

  return result;
};
