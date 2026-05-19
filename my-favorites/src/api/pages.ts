import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { PortPageSummary } from "../types";
import { MOCK_PAGES } from "../dev/mockData";
import { portFetch } from "./portFetch";

type PagesResponse = {
  pages?: PortPageSummary[];
};

export async function fetchPages(
  baseUrl: string,
  token: string
): Promise<PortPageSummary[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_PAGES;
  }

  const data = await portFetch<PagesResponse>(baseUrl, token, "/v1/pages");
  return (data.pages ?? []).filter((page) => {
    if (!page.identifier || !page.title) return false;
    if (page.sidebarType === "folder") return false;
    return true;
  });
}
