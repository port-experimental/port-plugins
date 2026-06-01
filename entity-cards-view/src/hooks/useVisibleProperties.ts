import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlueprintProperties } from "../api/blueprint";
import type { ArrayDisplayMode, BlueprintPropertyMeta, BooleanDisplayMode, PluginConfig } from "../types";
import {
  getArrayDisplayMode,
  readArrayDisplayModes,
  writeArrayDisplayModes,
} from "../utils/arrayDisplayStorage";
import {
  getBooleanDisplayMode,
  readBooleanDisplayModes,
  writeBooleanDisplayModes,
} from "../utils/booleanDisplayStorage";
import {
  defaultVisiblePropertyIds,
  readVisiblePropertyIds,
  writeVisiblePropertyIds,
} from "../utils/visiblePropertiesStorage";

export function useVisibleProperties(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const blueprintId = config?.blueprint.identifier ?? "";

  const schemaQuery = useQuery({
    queryKey: ["blueprint-properties", blueprintId, portApiBaseUrl],
    queryFn: () =>
      fetchBlueprintProperties(
        portApiBaseUrl!,
        portToken!,
        blueprintId
      ),
    enabled: !!config && !!portToken && !!portApiBaseUrl,
  });

  const available = schemaQuery.data ?? [];

  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [arrayDisplayModes, setArrayDisplayModes] = useState<
    Record<string, ArrayDisplayMode>
  >({});
  const [booleanDisplayModes, setBooleanDisplayModes] = useState<
    Record<string, BooleanDisplayMode>
  >({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!blueprintId || available.length === 0) return;
    if (initialized) return;

    const stored = readVisiblePropertyIds(blueprintId);
    const validStored = stored?.filter((id) =>
      available.some((p) => p.identifier === id)
    );
    setVisibleIds(
      validStored?.length
        ? validStored
        : defaultVisiblePropertyIds(available)
    );

    const storedModes = readArrayDisplayModes(blueprintId);
    const arrayIds = new Set(
      available.filter((p) => p.kind === "array").map((p) => p.identifier)
    );
    const validModes: Record<string, ArrayDisplayMode> = {};
    for (const [id, mode] of Object.entries(storedModes)) {
      if (arrayIds.has(id)) validModes[id] = mode;
    }
    setArrayDisplayModes(validModes);

    const storedBooleanModes = readBooleanDisplayModes(blueprintId);
    const booleanIds = new Set(
      available.filter((p) => p.kind === "boolean").map((p) => p.identifier)
    );
    const validBooleanModes: Record<string, BooleanDisplayMode> = {};
    for (const [id, mode] of Object.entries(storedBooleanModes)) {
      if (booleanIds.has(id)) validBooleanModes[id] = mode;
    }
    setBooleanDisplayModes(validBooleanModes);
    setInitialized(true);
  }, [blueprintId, available, initialized]);

  useEffect(() => {
    setInitialized(false);
    setVisibleIds([]);
    setArrayDisplayModes({});
    setBooleanDisplayModes({});
  }, [blueprintId]);

  const visibleProperties = useMemo(() => {
    const byId = new Map(available.map((p) => [p.identifier, p]));
    return visibleIds
      .map((id) => byId.get(id))
      .filter((p): p is BlueprintPropertyMeta => !!p);
  }, [available, visibleIds]);

  const setVisiblePropertyIds = useCallback(
    (ids: string[]) => {
      const valid = ids.filter((id) =>
        available.some((p) => p.identifier === id)
      );
      setVisibleIds(valid);
      if (blueprintId) writeVisiblePropertyIds(blueprintId, valid);
    },
    [available, blueprintId]
  );

  const toggleProperty = useCallback(
    (propertyId: string) => {
      setVisiblePropertyIds(
        visibleIds.includes(propertyId)
          ? visibleIds.filter((id) => id !== propertyId)
          : [...visibleIds, propertyId]
      );
    },
    [visibleIds, setVisiblePropertyIds]
  );

  const setArrayDisplayMode = useCallback(
    (propertyId: string, mode: ArrayDisplayMode) => {
      const prop = available.find((p) => p.identifier === propertyId);
      if (!prop || prop.kind !== "array") return;

      setArrayDisplayModes((prev) => {
        const next = { ...prev, [propertyId]: mode };
        if (blueprintId) writeArrayDisplayModes(blueprintId, next);
        return next;
      });
    },
    [available, blueprintId]
  );

  const setBooleanDisplayMode = useCallback(
    (propertyId: string, mode: BooleanDisplayMode) => {
      const prop = available.find((p) => p.identifier === propertyId);
      if (!prop || prop.kind !== "boolean") return;

      setBooleanDisplayModes((prev) => {
        const next = { ...prev, [propertyId]: mode };
        if (blueprintId) writeBooleanDisplayModes(blueprintId, next);
        return next;
      });
    },
    [available, blueprintId]
  );

  const getDisplayModeForProperty = useCallback(
    (propertyId: string) => getArrayDisplayMode(propertyId, arrayDisplayModes),
    [arrayDisplayModes]
  );

  const getBooleanDisplayModeForProperty = useCallback(
    (propertyId: string) =>
      getBooleanDisplayMode(propertyId, booleanDisplayModes),
    [booleanDisplayModes]
  );

  return {
    available,
    visibleIds,
    visibleProperties,
    arrayDisplayModes,
    booleanDisplayModes,
    getDisplayModeForProperty,
    getBooleanDisplayModeForProperty,
    setVisiblePropertyIds,
    toggleProperty,
    setArrayDisplayMode,
    setBooleanDisplayMode,
    isLoading: schemaQuery.isLoading,
    isError: schemaQuery.isError,
    error: schemaQuery.error,
  };
}
