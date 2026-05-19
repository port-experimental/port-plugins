import { parsePortError } from "./portError";

export async function portFetch<T>(
  baseUrl: string,
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    await parsePortError(res);
  }
  return res.json() as Promise<T>;
}
