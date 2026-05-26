import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import { Entity } from '../types';

type SearchBody = { combinator: 'or' | 'and'; rules: unknown[] };

async function fetchEntitiesWithBody(
  token: string,
  portApiBaseUrl: string | null,
  body: SearchBody,
): Promise<Entity[]> {
  const url = new URL(`${portApiBaseUrl}/v1/entities/search`);
  url.searchParams.set('exclude_calculated_properties', 'true');
  url.searchParams.set('allow_partial_results', 'true');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const body = await res.text(); throw new Error(`Port API ${res.status}: ${body}`); }
  const { entities } = await res.json();
  return entities ?? [];
}

// Kept for backward compatibility (used in tests).
export async function fetchEntities(
  token: string,
  portApiBaseUrl: string | null,
  blueprintIds: string[],
): Promise<Entity[]> {
  if (blueprintIds.length === 0) return [];
  const body: SearchBody = {
    combinator: 'or',
    rules: blueprintIds.map(id => ({ property: '$blueprint', operator: '=', value: id })),
  };
  return fetchEntitiesWithBody(token, portApiBaseUrl, body);
}

export function useEntities(blueprintIds: string[]) {
  const { portApiBaseUrl, portToken, page } = usePortPluginData();

  const body = useMemo<SearchBody>(() => {
    const blueprintQuery: SearchBody = {
      combinator: 'or',
      rules: blueprintIds.map(id => ({ property: '$blueprint', operator: '=', value: id })),
    };

    // Extract rules from page filters (dashboard-wide + team filters).
    const pageRules = (page?.pageFilters ?? []).flatMap((f: Record<string, unknown>) =>
      Array.isArray(f.rules) ? (f.rules as unknown[]) : [],
    );

    if (pageRules.length === 0) return blueprintQuery;

    return {
      combinator: 'and',
      rules: [blueprintQuery, ...pageRules],
    };
  }, [blueprintIds, page?.pageFilters]);

  return useQuery({
    queryKey: ['entities', portToken, blueprintIds, page?.pageFilters],
    queryFn: () => fetchEntitiesWithBody(portToken!, portApiBaseUrl, body),
    enabled: !!portToken && blueprintIds.length > 0,
    refetchInterval: 1000 * 60 * 5,
  });
}
