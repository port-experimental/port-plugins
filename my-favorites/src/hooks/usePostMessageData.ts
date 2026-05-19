import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Page, Params, User } from "../types";
import { MOCK_USER_EMAIL } from "../dev/mockData";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";

export const usePostMessageData = () => {
  const sdk = usePortPluginData();
  const [mockParams] = useState<Params>({});
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(
    DEV_MOCK ? { email: MOCK_USER_EMAIL, firstName: "Alice" } : undefined
  );
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

  return useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: mockParams,
        page: mockPage,
        user: mockUser,
        portToken: mockToken,
        portApiBaseUrl: mockBaseUrl,
      };
    }
    return {
      params: (sdk.params ?? {}) as Params,
      page: sdk.page as Page | undefined,
      user: sdk.user as User | undefined,
      portToken: sdk.portToken,
      portApiBaseUrl: sdk.portApiBaseUrl,
    };
  }, [sdk, mockParams, mockPage, mockUser, mockToken, mockBaseUrl]);
};
