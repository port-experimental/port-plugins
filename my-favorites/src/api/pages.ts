import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_PAGES } from "../dev/mockData";
import type { PortPage } from "../types";

export async function fetchPages(
  baseUrl: string,
  token: string
): Promise<PortPage[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_PAGES;
  }
  const res = await fetch(`${baseUrl}/v1/pages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.pages ?? []) as PortPage[];
}

export async function fetchPageByIdentifier(
  baseUrl: string,
  token: string,
  pageIdentifier: string
): Promise<PortPage | null> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_PAGES.find((p) => p.identifier === pageIdentifier) ?? null;
  }
  const res = await fetch(
    `${baseUrl}/v1/pages/${encodeURIComponent(pageIdentifier)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.page ?? data) as PortPage;
}
