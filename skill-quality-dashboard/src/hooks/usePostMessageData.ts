import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { MOCK_PARAMS } from "../dev/mockData";
import type { PluginParams } from "../types";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";

export const usePostMessageData = () => {
  const sdk = usePortPluginData();
  const applyThemeCss = sdk.applyThemeCss;

  useEffect(() => {
    if (!DEV_MOCK) applyThemeCss();
  }, [applyThemeCss]);

  return useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: MOCK_PARAMS as PluginParams,
        portToken: MOCK_TOKEN,
        portApiBaseUrl: MOCK_BASE_URL,
      };
    }
    return {
      params: (sdk.params ?? {}) as PluginParams,
      portToken: sdk.portToken,
      portApiBaseUrl: sdk.portApiBaseUrl,
    };
  }, [sdk]);
};
