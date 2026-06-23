/** Minimal authenticated wrapper around the Port REST API. */
export type PortCtx = { baseUrl: string; token: string };

export async function portFetch<T>(
  ctx: PortCtx,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${ctx.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    // Always surface the response body - it carries Port's validation detail.
    const body = await res.text();
    throw new Error(`Port API ${res.status} ${res.statusText}:\n${body}`);
  }

  return (await res.json()) as T;
}

export const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
