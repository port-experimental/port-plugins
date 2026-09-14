import type { PortSoftwareEntity } from './utils/radar';

async function portPost(url: string, body: unknown, token: string) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Port API error ${resp.status}`);
  return resp.json();
}

export async function fetchEntitiesByBlueprint(
  portApiBaseUrl: string,
  portToken: string,
  blueprintId: string,
): Promise<PortSoftwareEntity[]> {
  const all: PortSoftwareEntity[] = [];
  let after: string | null = null;

  while (true) {
    const body: Record<string, unknown> = {
      combinator: 'and',
      rules: [{ property: '$blueprint', operator: '=', value: blueprintId }],
    };
    if (after) body.after = after;

    const data = await portPost(`${portApiBaseUrl}/v1/entities/search`, body, portToken);
    all.push(...(data.entities ?? []));
    after = data.next_page ?? null;
    if (!after) break;
  }
  return all;
}
