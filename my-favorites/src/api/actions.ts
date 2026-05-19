import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { PortActionSummary } from "../types";
import { MOCK_ACTIONS } from "../dev/mockData";
import { portFetch } from "./portFetch";

type ActionsResponse = {
  actions?: PortActionSummary[];
};

export async function fetchActions(
  baseUrl: string,
  token: string
): Promise<PortActionSummary[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_ACTIONS;
  }

  const data = await portFetch<ActionsResponse>(baseUrl, token, "/v1/actions");
  return (data.actions ?? []).filter(
    (action) => action.trigger?.type === "self-service"
  );
}
