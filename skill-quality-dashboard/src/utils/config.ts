import type { DimConfig, NormalisedEntity, PluginParams } from "../types";

export function parseDims(params: PluginParams): DimConfig[] {
  const dims: DimConfig[] = [];
  for (let i = 1; i <= 4; i++) {
    const labelKey = `dim${i}_label` as keyof PluginParams;
    const propKey = `dim${i}_property` as keyof PluginParams;
    const label = (params[labelKey] as { value?: string } | undefined)?.value;
    const property = (params[propKey] as { value?: string } | undefined)?.value;
    if (label && property) {
      dims.push({ key: `dim${i}`, label, property });
    }
  }
  return dims;
}

export function parseBlueprint(params: PluginParams): string | null {
  return params.blueprint?.value ?? null;
}

export function parseGroupRelation(params: PluginParams): string {
  return params.group_relation?.value ?? "";
}

export function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

export function scoreCls(n: number): string {
  return n >= 80 ? "great" : n >= 60 ? "good" : n >= 40 ? "ok" : "poor";
}

export function barCls(n: number): string {
  return n >= 80 ? "bar-great" : n >= 60 ? "bar-good" : n >= 40 ? "bar-ok" : "bar-poor";
}

export function scoreLabel(n: number): string {
  return n >= 80 ? "Great" : n >= 60 ? "Good" : n >= 40 ? "Needs work" : "Poor";
}
