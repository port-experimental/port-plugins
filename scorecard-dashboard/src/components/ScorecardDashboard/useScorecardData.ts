import { useQuery } from '@tanstack/react-query';

interface EntityScorecard {
  level: string;
  rules?: Record<string, { status: string; level: string }>;
}

interface ServiceEntity {
  identifier: string;
  title: string;
  blueprint: string;
  team?: string[];
  scorecards: Record<string, EntityScorecard>;
  relations: Record<string, string | string[] | null>;
}

interface TeamEntity {
  identifier: string;
  title: string;
  relations: Record<string, string | string[] | null>;
}

interface ScorecardMeta {
  identifier: string;
  title: string;
  blueprint: string;
  levels: string[];
}

export interface ScorecardStat {
  identifier: string;
  title: string;
  levels: string[];
  compliance: number;
  grade: string;
  passing: number;
  failing: number;
  total: number;
}

export interface ServiceSummary {
  identifier: string;
  title: string;
  blueprint: string;
  overallCompliance: number;
  overallGrade: string;
  scorecards: Record<string, { compliance: number; grade: string; passing: number; failing: number; hasData: boolean }>;
}

export interface LeaderRow {
  leaderId: string;
  leaderTitle: string;
  totalServices: number;
  overallCompliance: number;
  overallGrade: string;
  scorecards: Record<string, { compliance: number; grade: string; passing: number; failing: number; total: number; hasData: boolean }>;
  services: ServiceSummary[];
}

export interface DashboardData {
  overallCompliance: number;
  overallGrade: string;
  totalServices: number;
  failedServices: number;
  scorecardStats: ScorecardStat[];
  leaderRows: LeaderRow[];
}

export interface GradeThresholds { a: number; b: number; c: number; }
export const DEFAULT_THRESHOLDS: GradeThresholds = { a: 100, b: 95, c: 90 };

export function getGrade(compliance: number, t: GradeThresholds = DEFAULT_THRESHOLDS): string {
  if (compliance >= t.a) return 'A';
  if (compliance >= t.b) return 'B';
  if (compliance >= t.c) return 'C';
  return 'F';
}

function rulesFor(entity: ServiceEntity, scorecardId: string): Array<{ status: string }> {
  return Object.values(entity.scorecards?.[scorecardId]?.rules ?? {});
}

function isPassed(status: string): boolean {
  const s = status.toUpperCase();
  return s === 'SUCCESS' || s === 'PASSED';
}

async function fetchDashboardData(
  portApiBaseUrl: string,
  portToken: string,
  serviceBlueprints: string[],
  teamBlueprint: string,
  teamServicesRelation: string,
  teamManagerRelation: string,
  serviceTeamRelation: string,
  filterScorecardIds: string[],
  thresholds: GradeThresholds,
  aggregateSimilar: boolean,
): Promise<DashboardData> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${portToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const searchBody = JSON.stringify({ query: { combinator: 'and', rules: [] } });

  const [scRes, teamRes, ...svcResponses] = await Promise.all([
    fetch(`${portApiBaseUrl}/v1/scorecards`, { headers }),
    fetch(`${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(teamBlueprint)}/entities/search`, {
      method: 'POST', headers, body: searchBody,
    }),
    ...serviceBlueprints.map(bp =>
      fetch(`${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(bp)}/entities/search`, {
        method: 'POST', headers, body: searchBody,
      })
    ),
  ]);

  if (!scRes.ok) throw new Error(`Scorecards ${scRes.status}: ${await scRes.text()}`);
  if (!teamRes.ok) throw new Error(`${teamBlueprint} entities ${teamRes.status}: ${await teamRes.text()}`);
  for (let i = 0; i < svcResponses.length; i++) {
    if (!svcResponses[i].ok) {
      throw new Error(`${serviceBlueprints[i]} entities ${svcResponses[i].status}: ${await svcResponses[i].text()}`);
    }
  }

  const { scorecards: allScorecards } = (await scRes.json()) as { scorecards: ScorecardMeta[] };
  const { entities: teamEntities } = (await teamRes.json()) as { entities: TeamEntity[] };
  const svcEntityArrays = await Promise.all(
    svcResponses.map(r => r.json() as Promise<{ entities: ServiceEntity[] }>)
  );
  const serviceEntities = svcEntityArrays.flatMap(r => r.entities);

  let relevantScorecards = allScorecards.filter(s => serviceBlueprints.includes(s.blueprint));
  if (filterScorecardIds.length > 0) {
    relevantScorecards = relevantScorecards.filter(s => filterScorecardIds.includes(s.identifier));
  }

  // Build teamId → manager map
  const teamToManager: Record<string, { id: string; title: string }> = {};
  for (const team of teamEntities) {
    const managerRaw = team.relations?.[teamManagerRelation];
    if (!managerRaw) continue;
    const managerId = Array.isArray(managerRaw) ? managerRaw[0] : managerRaw;
    if (managerId) teamToManager[team.identifier] = { id: managerId, title: managerId };
  }

  // Build service → manager lookup
  // Forward: team entity has a relation listing its services (teamServicesRelation)
  // Reverse: service entity has a relation pointing to its team (serviceTeamRelation)
  const serviceToManager: Record<string, { id: string; title: string }> = {};
  if (teamServicesRelation) {
    for (const team of teamEntities) {
      const mgr = teamToManager[team.identifier];
      if (!mgr) continue;
      const servicesRaw = team.relations?.[teamServicesRelation];
      if (!servicesRaw) continue;
      const serviceIds = Array.isArray(servicesRaw) ? servicesRaw : [servicesRaw];
      for (const svcId of serviceIds) {
        if (svcId) serviceToManager[svcId] = mgr;
      }
    }
  }
  if (serviceTeamRelation) {
    for (const svc of serviceEntities) {
      if (serviceToManager[svc.identifier]) continue;
      const teamRaw = svc.relations?.[serviceTeamRelation];
      if (!teamRaw) continue;
      const teamId = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
      if (!teamId) continue;
      const mgr = teamToManager[teamId];
      if (mgr) serviceToManager[svc.identifier] = mgr;
    }
  }
  // Port native ownership: entity.team[] contains _team identifiers directly
  for (const svc of serviceEntities) {
    if (serviceToManager[svc.identifier]) continue;
    for (const teamId of svc.team ?? []) {
      const mgr = teamToManager[teamId];
      if (mgr) { serviceToManager[svc.identifier] = mgr; break; }
    }
  }

  // Global scorecard stats — rules-based compliance (passed rules / total rules)
  const scorecardStats: ScorecardStat[] = relevantScorecards.map(sc => {
    const withSc = serviceEntities.filter(e => e.scorecards?.[sc.identifier] !== undefined);
    let totalRules = 0, passedRules = 0;
    for (const e of withSc) {
      const rules = rulesFor(e, sc.identifier);
      totalRules += rules.length;
      passedRules += rules.filter(r => isPassed(r.status)).length;
    }
    const compliance = totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
    return { identifier: sc.identifier, title: sc.title, levels: sc.levels, compliance, grade: getGrade(compliance, thresholds), passing: passedRules, failing: totalRules - passedRules, total: withSc.length };
  });

  // Group services by manager
  const byManager: Record<string, { info: { id: string; title: string }; services: ServiceEntity[] }> = {};
  for (const svc of serviceEntities) {
    const mgr = serviceToManager[svc.identifier] ?? { id: '__unassigned__', title: 'Unassigned' };
    if (!byManager[mgr.id]) byManager[mgr.id] = { info: mgr, services: [] };
    byManager[mgr.id].services.push(svc);
  }

  // Leader rows
  const leaderRows: LeaderRow[] = Object.entries(byManager).map(([, { info, services }]) => {
    const rowScorecards: LeaderRow['scorecards'] = {};
    let totalPassing = 0, totalCount = 0;

    for (const sc of relevantScorecards) {
      const withSc = services.filter(e => e.scorecards?.[sc.identifier] !== undefined);
      if (withSc.length === 0) {
        rowScorecards[sc.identifier] = { compliance: 0, grade: 'F', passing: 0, failing: 0, total: 0, hasData: false };
        continue;
      }
      let totalRules = 0, passedRules = 0;
      for (const e of withSc) {
        const rules = rulesFor(e, sc.identifier);
        totalRules += rules.length;
        passedRules += rules.filter(r => isPassed(r.status)).length;
      }
      const compliance = totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
      rowScorecards[sc.identifier] = { compliance, grade: getGrade(compliance, thresholds), passing: passedRules, failing: totalRules - passedRules, total: withSc.length, hasData: totalRules > 0 };
      totalPassing += passedRules;
      totalCount += totalRules;
    }

    // Per-service summaries for drill-down
    const serviceSummaries: ServiceSummary[] = services.map(svc => {
      let svcPassing = 0, svcFailing = 0;
      const scData: ServiceSummary['scorecards'] = {};
      for (const sc of relevantScorecards) {
        const rules = rulesFor(svc, sc.identifier);
        if (rules.length === 0) {
          scData[sc.identifier] = { compliance: 0, grade: 'F', passing: 0, failing: 0, hasData: false };
          continue;
        }
        const passed = rules.filter(r => isPassed(r.status)).length;
        const failed = rules.length - passed;
        const compliance = (passed / rules.length) * 100;
        scData[sc.identifier] = { compliance, grade: getGrade(compliance, thresholds), passing: passed, failing: failed, hasData: true };
        svcPassing += passed;
        svcFailing += failed;
      }
      const totalRules = svcPassing + svcFailing;
      const overallCompliance = totalRules > 0 ? (svcPassing / totalRules) * 100 : 0;
      return { identifier: svc.identifier, title: svc.title || svc.identifier, blueprint: svc.blueprint, overallCompliance, overallGrade: getGrade(overallCompliance, thresholds), scorecards: scData };
    });

    const overallCompliance = totalCount > 0 ? (totalPassing / totalCount) * 100 : 0;
    return { leaderId: info.id, leaderTitle: info.title, totalServices: services.length, overallCompliance, overallGrade: getGrade(overallCompliance, thresholds), scorecards: rowScorecards, services: serviceSummaries };
  });

  leaderRows.sort((a, b) => a.leaderTitle.localeCompare(b.leaderTitle));

  // Overall KPIs — rules-based
  const totalPass = scorecardStats.reduce((s, sc) => s + sc.passing, 0);
  const totalAll  = scorecardStats.reduce((s, sc) => s + sc.failing + sc.passing, 0);
  const overallCompliance = totalAll > 0 ? (totalPass / totalAll) * 100 : 0;

  const failedServices = serviceEntities.filter(svc =>
    relevantScorecards.some(sc => rulesFor(svc, sc.identifier).some(r => !isPassed(r.status)))
  ).length;

  // Aggregate scorecards with the same title across blueprints
  const idToTitle = new Map(relevantScorecards.map(sc => [sc.identifier, sc.title]));

  const finalStats = aggregateSimilar ? mergeStatsByTitle(scorecardStats, thresholds) : scorecardStats;
  const finalRows = aggregateSimilar
    ? leaderRows.map(row => ({
        ...row,
        scorecards: mergeScorecardsByTitle(row.scorecards, idToTitle, thresholds),
        services: row.services.map(s => ({
          ...s,
          scorecards: remapScorecardKeys(s.scorecards, idToTitle, thresholds),
        })),
      }))
    : leaderRows;

  return { overallCompliance, overallGrade: getGrade(overallCompliance, thresholds), totalServices: serviceEntities.length, failedServices, scorecardStats: finalStats, leaderRows: finalRows };
}

function mergeStatsByTitle(stats: ScorecardStat[], t: GradeThresholds): ScorecardStat[] {
  const merged = new Map<string, ScorecardStat>();
  for (const stat of stats) {
    const existing = merged.get(stat.title);
    if (!existing) {
      merged.set(stat.title, { ...stat, identifier: stat.title });
    } else {
      existing.passing += stat.passing;
      existing.failing += stat.failing;
      existing.total += stat.total;
      const totalRules = existing.passing + existing.failing;
      existing.compliance = totalRules > 0 ? (existing.passing / totalRules) * 100 : 0;
      existing.grade = getGrade(existing.compliance, t);
    }
  }
  return [...merged.values()];
}

function mergeScorecardsByTitle(
  rowScorecards: LeaderRow['scorecards'],
  idToTitle: Map<string, string>,
  t: GradeThresholds,
): LeaderRow['scorecards'] {
  const merged: LeaderRow['scorecards'] = {};
  for (const [id, cell] of Object.entries(rowScorecards)) {
    const key = idToTitle.get(id) ?? id;
    const existing = merged[key];
    if (!existing) {
      merged[key] = { ...cell };
    } else {
      const passing = existing.passing + cell.passing;
      const failing = existing.failing + cell.failing;
      const totalRules = passing + failing;
      const compliance = totalRules > 0 ? (passing / totalRules) * 100 : 0;
      merged[key] = { compliance, grade: getGrade(compliance, t), passing, failing, total: existing.total + cell.total, hasData: existing.hasData || cell.hasData };
    }
  }
  return merged;
}

function remapScorecardKeys(
  scorecards: ServiceSummary['scorecards'],
  idToTitle: Map<string, string>,
  t: GradeThresholds,
): ServiceSummary['scorecards'] {
  const out: ServiceSummary['scorecards'] = {};
  for (const [id, cell] of Object.entries(scorecards)) {
    const key = idToTitle.get(id) ?? id;
    const existing = out[key];
    if (!existing) {
      out[key] = { ...cell };
    } else {
      const passing = existing.passing + cell.passing;
      const failing = existing.failing + cell.failing;
      const totalRules = passing + failing;
      const compliance = totalRules > 0 ? (passing / totalRules) * 100 : 0;
      out[key] = { compliance, grade: getGrade(compliance, t), passing, failing, hasData: existing.hasData || cell.hasData };
    }
  }
  return out;
}

export function useScorecardData(
  portToken: string | null,
  portApiBaseUrl: string,
  serviceBlueprints: string[],
  teamBlueprint: string,
  teamServicesRelation: string,
  teamManagerRelation: string,
  serviceTeamRelation: string,
  filterScorecardIds: string[],
  thresholds: GradeThresholds,
  aggregateSimilar: boolean,
) {
  const bpKey = serviceBlueprints.join(',');
  const tKey = `${thresholds.a},${thresholds.b},${thresholds.c}`;
  return useQuery({
    queryKey: ['scorecard-dashboard', bpKey, teamBlueprint, teamServicesRelation, teamManagerRelation, serviceTeamRelation, filterScorecardIds.join(','), tKey, aggregateSimilar],
    queryFn: () => fetchDashboardData(portApiBaseUrl, portToken!, serviceBlueprints, teamBlueprint, teamServicesRelation, teamManagerRelation, serviceTeamRelation, filterScorecardIds, thresholds, aggregateSimilar),
    enabled: !!portToken && !!portApiBaseUrl && serviceBlueprints.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
