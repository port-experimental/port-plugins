import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";
import { MOCK_PARAMS } from "../dev/mockData";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.port.io";
const MOCK_TOKEN = "dev-mock-token";
const MOCK_USER: User = { email: "developer@example.com", firstName: "Dev" };

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>(MOCK_PARAMS);
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(DEV_MOCK ? MOCK_USER : undefined);
  const [mockEntity] = useState<Entity | undefined>();
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(DEV_MOCK ? MOCK_BASE_URL : null);

  const applyThemeCss = sdk.applyThemeCss;

  useEffect(() => {
    applyThemeCss();
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
