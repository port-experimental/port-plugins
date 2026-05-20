import { DEV_MOCK } from "../hooks/usePostMessageData";
import { relationIdList } from "../utils/relationIdList";
import type { TechDocEntity } from "../types";
import { MOCK_DOCS } from "../utils/mocks";
import { portFetch } from "./portFetch";

/** Matches Port entity scan / search pagination (`limit` + `from` cursor). */
const TECH_DOCS_SCAN_LIMIT = 200;

export type TechDocsPage = {
  entities: TechDocEntity[];
  /** Value from `next` in the API response; pass as `from` on the following request. */
  next: string | null;
};

function normalizeNext(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t === "" ? null : t;
}

export function mapSearchEntity(
  e: Record<string, unknown>,
  repositoryBlueprint: string
): TechDocEntity {
  const rel = (e.relations ?? {}) as Record<string, unknown>;
  const repository =
    relationIdList(rel[repositoryBlueprint])[0] ??
    relationIdList(rel.repository)[0] ??
    relationIdList(rel.githubRepository)[0] ??
    "";

  return {
    identifier: e.identifier as string,
    title: e.title as string,
    updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : undefined,
    properties: e.properties,
    relations: { ...rel, repository },
  } as TechDocEntity;
}

/**
 * One page of tech docs from `POST /v1/blueprints/:id/entities/search`,
 * same shape as `client.entities().scan(blueprint, query, { limit, from })`:
 * request uses `limit` and optional `from`; response returns `next` (use as `from` until falsy).
 */
export async function fetchTechDocsPage(
  baseUrl: string,
  token: string,
  techDocBlueprint: string,
  repositoryBlueprint: string,
  from?: string | null
): Promise<TechDocsPage> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const PAGE_SIZE = 2;
    const pageIndex =
      from == null || from === ""
        ? 0
        : Math.max(0, parseInt(from, 10) || 0);
    const start = pageIndex * PAGE_SIZE;
    const slice = MOCK_DOCS.slice(start, start + PAGE_SIZE);
    const more = start + PAGE_SIZE < MOCK_DOCS.length;
    return {
      entities: slice,
      next: more ? String(pageIndex + 1) : null,
    };
  }

  const path = `/v1/blueprints/${encodeURIComponent(techDocBlueprint)}/entities/search`;
  const body: Record<string, unknown> = {
    query: {
      combinator: "and",
      rules: [],
    },
    limit: TECH_DOCS_SCAN_LIMIT,
    ...(from && from.trim() ? { from: from.trim() } : {}),
  };

  const response = await portFetch(baseUrl, token, path, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch docs (${response.status}):\n${errorBody}`
    );
  }

  const data = await response.json();
  const entities = data.entities ?? [];
  const next = normalizeNext(data.next);

  return {
    entities: entities.map((e: Record<string, unknown>) =>
      mapSearchEntity(e, repositoryBlueprint)
    ),
    next,
  };
}
