/**
 * Merges widget entity-search queries with Port page filters passed from the host.
 */
import { EntitySearchBody, EntitySearchRuleOrGroup } from "../hooks/entitiesSearch";

export const DASHBOARD_FILTERS_META_BLUEPRINT = 'dashboard-filters-meta-blueprint';

/**
 * Combines `widgetQuery` (the widget’s search body for POST /v1/entities/search) with the
 * page filters applied on the Port page that hosts the plugin. Those filters usually come from
 * `PLUGIN_DATA.page.pageFilters` as `pageQuery`. The result AND-combines the widget query with
 * the relevant page rules so results respect both the widget and the page context. Page rules
 * are narrowed by blueprint (and dashboard-wide filters); if the blueprint has no `ownership`
 * field, `$team` rules from the page are dropped.
 */
export function mergeWidgetQueryWithPageQuery(
	widgetQuery: EntitySearchBody,
	pageQuery?: Record<string, unknown>[],
	blueprint?: Record<string, unknown>,
): EntitySearchBody {
	if (!pageQuery || pageQuery.length === 0) return widgetQuery;

	const relevantPageQueriesRules = pageQuery
		.filter(
			(query) =>
				query.blueprint === blueprint?.identifier ||
				query.blueprint === DASHBOARD_FILTERS_META_BLUEPRINT ||
				query.blueprint === undefined,
		)
		.flatMap((query) => (Array.isArray(query.rules) ? query.rules : []) as Record<string, unknown>[]);

	if (relevantPageQueriesRules.length === 0) return widgetQuery;

	if (!blueprint || !('ownership' in blueprint)) {
		return {
			combinator: 'and',
			rules: [widgetQuery, ...relevantPageQueriesRules.filter((rule) => !('property' in rule && rule.property === '$team'))] as EntitySearchRuleOrGroup[],
		} satisfies EntitySearchBody;
	}

	return {
		combinator: 'and',
		rules: [widgetQuery, ...relevantPageQueriesRules] as EntitySearchRuleOrGroup[],
	} satisfies EntitySearchBody;
}
