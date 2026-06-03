export async function parsePortError(response: Response): Promise<never> {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}

export async function portFetch(
  baseUrl: string,
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) await parsePortError(res);
  return res;
}
