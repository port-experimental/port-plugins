import type { Benchmark } from "./types";
import { DORA_2025 } from "./dora-2025";

/**
 * Benchmarks bundled with the plugin. These work out of the box - no org setup
 * required. Add a new benchmark (e.g. a future report year) by dropping a
 * definition next to dora-2025.ts and registering it here.
 */
export const BUILTIN_BENCHMARKS: Record<string, Benchmark> = {
  [DORA_2025.id]: DORA_2025,
};

/** Resolve a bundled benchmark by id. */
export function resolveBenchmark(id: string | undefined | null): Benchmark | null {
  if (!id) return null;
  return BUILTIN_BENCHMARKS[id] ?? null;
}
