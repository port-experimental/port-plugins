/**
 * Example hook for Port entity search. Copy or adapt it to match your plugin’s
 * queries, options, and merge behavior — it is not meant to be used as-is in production.
 */
import { useQuery } from "@tanstack/react-query";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { mergeWidgetQueryWithPageQuery } from "../utils/mergeWidgetQueryWithPageQuery";

/** Leaf rule: property + operator + value */
export interface EntitySearchRule {
	property: string;
	operator: string;
	value: unknown;
}

/** Nested rule group: combinator + rules (can be leaf rules or more groups) */
export interface EntitySearchRuleGroup {
	combinator: "and" | "or";
	rules: EntitySearchRuleOrGroup[];
}

export type EntitySearchRuleOrGroup = EntitySearchRule | EntitySearchRuleGroup;

/** Top-level body for POST /v1/entities/search */
export interface EntitySearchBody {
	combinator: "and" | "or";
	rules: EntitySearchRuleOrGroup[];
}

export interface EntitySearchOptions {
	exclude_calculated_properties?: boolean;
	attach_title_to_relation?: boolean;
	attach_identifier_to_title_mirror_properties?: boolean;
	allow_partial_results?: boolean;
	/** When false, the query does not run (e.g. until required inputs exist). */
	enabled?: boolean;
}

async function fetchEntitiesSearch(
	token: string,
	portApiBaseUrl: string | null,
	body: EntitySearchBody,
	options: EntitySearchOptions = {}
) {
	const url = new URL(`${portApiBaseUrl}/v1/entities/search`);
	url.searchParams.set("exclude_calculated_properties", String(options.exclude_calculated_properties ?? false));
	url.searchParams.set("attach_title_to_relation", String(options.attach_title_to_relation ?? false));
	url.searchParams.set("attach_identifier_to_title_mirror_properties", String(options.attach_identifier_to_title_mirror_properties ?? false));
	url.searchParams.set("allow_partial_results", String(options.allow_partial_results ?? false));

	const res = await fetch(url.toString(), {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) { const body = await res.text(); throw new Error(`Port API ${res.status}: ${body}`); }
	return res.json();
}

export function entitiesSearch(blueprint: Record<string, unknown>, searchBody: EntitySearchBody, options?: EntitySearchOptions) {
	const { portApiBaseUrl, portToken, page } = usePortPluginData();
	const mergedSearchBody = mergeWidgetQueryWithPageQuery(searchBody, page?.pageFilters, blueprint);
	return useQuery({
		queryKey: ["entities", "search", portToken, mergedSearchBody, options],
		queryFn: () => fetchEntitiesSearch(portToken!, portApiBaseUrl, mergedSearchBody!, options),
		enabled: !!portToken && !!mergedSearchBody && (options?.enabled ?? true),
	});
}
