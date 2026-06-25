import type {
  DrillDownConfig,
  Entity,
  PluginConfig,
  Rule,
  ScorecardLevel,
  WorkItem,
} from "./types";
import { PORT_COLOR_HEX } from "./constants";
import { DEV_MOCK } from "./hooks/usePluginData";

/** Derive the Port app base URL from the API base URL (api. → app., strip /v1). */
export function appBaseUrl(apiUrl: string): string {
  if (DEV_MOCK) {
    return "http://localhost:3001";
  }

  return apiUrl.replace(/(\/\/|^)api\./, "$1app.").replace(/\/v1\/?$/, "");
}

export async function fetchAll(
  baseUrl: string,
  token: string,
  config: PluginConfig
): Promise<{ rules: Rule[]; entities: Entity[]; levels: ScorecardLevel[] }> {
  const h = { Authorization: `Bearer ${token}` };
  const { blueprintIdentifier: bp, scorecardIdentifier: sc } = config;

  const [scRes, listRes] = await Promise.all([
    fetch(`${baseUrl}/v1/blueprints/${bp}/scorecards/${sc}`, { headers: h }),
    fetch(`${baseUrl}/v1/blueprints/${bp}/entities`, { headers: h }),
  ]);

  if (!scRes.ok) {
    const body = await scRes.text();
    throw new Error(`Scorecard fetch failed (${scRes.status}):\n${body}`);
  }
  if (!listRes.ok) {
    const body = await listRes.text();
    throw new Error(`Entities fetch failed (${listRes.status}):\n${body}`);
  }

  const [scData, listData] = await Promise.all([scRes.json(), listRes.json()]);

  const scorecard = scData.scorecard ?? scData;

  // Port orders levels from lowest (most critical) to highest (best health),
  // so index 0 maps directly to rank 0 (most critical).
  const rawLevels: Array<{ title: string; color: string }> =
    scorecard.levels ?? [];
  const levels: ScorecardLevel[] = rawLevels.map((l, idx) => ({
    title: l.title,
    color: l.color,
    hex: PORT_COLOR_HEX[l.color] ?? "#94A3B8",
    rank: idx,
  }));

  if (levels.length === 0) {
    levels.push({
      title: "Unknown",
      color: "lightGray",
      hex: "#94A3B8",
      rank: 0,
    });
  }

  const levelRankMap: Record<string, number> = Object.fromEntries(
    levels.map((l) => [l.title, l.rank])
  );

  const rules: Rule[] = (scorecard.rules ?? []).map((r: any) => ({
    identifier: r.identifier,
    title: r.title,
    description: r.description ?? "",
    level: r.level,
  }));

  const identifiers: string[] = (listData.entities ?? [])
    .map((e: any) => e.identifier)
    .filter(Boolean);

  const entityResults = await Promise.all(
    identifiers.map((id) =>
      fetch(`${baseUrl}/v1/blueprints/${bp}/entities/${id}`, { headers: h })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  const entities: Entity[] = entityResults
    .map((data: any) => data?.entity ?? data)
    .filter((e: any) => !!e?.identifier)
    .map((e: any) => {
      const props = e.properties ?? {};
      const scEnt = e.scorecards?.[sc] ?? {};
      const ruleMap: Record<string, boolean> = {};
      (scEnt.rules ?? []).forEach((r: any) => {
        ruleMap[r.identifier] = r.status === "SUCCESS";
      });
      const v = props.component_title;
      const component = !v
        ? null
        : typeof v === "string"
        ? v
        : typeof v === "object" && v?.title
        ? String(v.title)
        : null;

      const iconRaw = config.iconProperty ? props[config.iconProperty] : undefined;
      const iconValue =
        iconRaw == null
          ? null
          : typeof iconRaw === "string"
          ? iconRaw
          : typeof iconRaw === "object" && (iconRaw as any)?.title
          ? String((iconRaw as any).title)
          : String(iconRaw);

      return {
        id: e.identifier,
        title: e.title ?? e.identifier,
        level: scEnt.level ?? levels[0].title,
        portIcon: e.icon ?? null,
        iconValue: iconValue ?? null,
        counters: config.counters.map((c) => ({
          emoji: c.emoji,
          label: c.label,
          value: Number(props[c.property] ?? 0),
        })),
        component,
        rules: ruleMap,
      };
    });

  // Sort by level rank (rank 0 first), then by total counter severity.
  entities.sort((a, b) => {
    const ld = (levelRankMap[a.level] ?? 0) - (levelRankMap[b.level] ?? 0);
    if (ld !== 0) return ld;
    const aScore = a.counters.reduce((s, c) => s + c.value, 0);
    const bScore = b.counters.reduce((s, c) => s + c.value, 0);
    return bScore - aScore;
  });

  return { rules, entities, levels };
}

/**
 * Fetch work-items for the drill-down panel.
 * Always injects a "relatedTo" filter for the selected entity.
 * Extra rules from drillConfig.rules are merged in.
 */
export async function fetchDrillDownItems(
  baseUrl: string,
  token: string,
  entityId: string,
  mainBlueprint: string,
  drillConfig: DrillDownConfig
): Promise<WorkItem[]> {
  const h = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const portBase = appBaseUrl(baseUrl);

  const relatedFilter = {
    blueprint: mainBlueprint,
    operator: "relatedTo",
    value: entityId,
  };

  const include = Array.from(
    new Set(["$identifier", "$title", ...(drillConfig.include ?? [])])
  );

  const query = {
    combinator: "and",
    rules: drillConfig.query
      ? [relatedFilter, drillConfig.query]
      : [relatedFilter],
  };

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${drillConfig.blueprint}/entities/search`,
    {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        query,
        include,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }

  const json = await res.json();

  return (json?.entities ?? []).map((e: any) => ({
    id: e.identifier,
    title: e.title ?? e.identifier,
    url: `${portBase}/${drillConfig.blueprint}Entity?identifier=${e.identifier}`,
    properties: { ...(e.properties ?? {}), ...(e.relations ?? {}) } as Record<
      string,
      unknown
    >,
  }));
}
