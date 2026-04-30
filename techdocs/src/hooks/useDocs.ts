import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTechDocsPage } from "../api/fetchDocs";
import type { PluginConfig, TechDocEntity } from "../types";
import { usePostMessageData } from "./usePostMessageData";
import { fetchTechDocsRelatedToEntityPage } from "../api/fetchRelatedTechDocSearch";

export function useDocs(config: PluginConfig) {
    const { portApiBaseUrl, portToken, entity } = usePostMessageData();
    const entityBlueprintId =
        entity?.blueprint?.trim() || undefined;
    const entityIdentifier =
        entity?.identifier?.trim() || undefined;

    const isEntityPage = useMemo(
        () => !!entityBlueprintId && !!entityIdentifier,
        [entityBlueprintId, entityIdentifier]
    );

    const docsQuery = useInfiniteQuery({
        queryKey: ["techDocs", config.techDocBlueprint, config.techdocsSourceBlueprint],
        queryFn: ({ pageParam }) =>
            fetchTechDocsPage(
                portApiBaseUrl!,
                portToken!,
                config.techDocBlueprint,
                config.techdocsSourceBlueprint,
                pageParam as string | undefined
            ),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        enabled: !isEntityPage && !!portToken && !!portApiBaseUrl,
        staleTime: 5 * 60 * 1000,
    });

    const relatedDocsQuery = useInfiniteQuery({
        queryKey: [
            "techDocsRelatedToEntity",
            entityIdentifier,
            entityBlueprintId,
            config.techDocBlueprint,
            config.techdocsSourceBlueprint,
            config.relatedToDirection,
        ],
        queryFn: ({ pageParam }) =>
            fetchTechDocsRelatedToEntityPage(
                portApiBaseUrl!,
                portToken!,
                {
                    hostEntityIdentifier: entityIdentifier!,
                    hostBlueprint: entityBlueprintId!,
                    techDocBlueprint: config.techDocBlueprint,
                    techdocsSourceBlueprint: config.techdocsSourceBlueprint,
                    direction: config.relatedToDirection,
                },
                pageParam as string | undefined
            ),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        enabled: isEntityPage && !!portToken && !!portApiBaseUrl,
        staleTime: 5 * 60 * 1000,
    });

    const activeQuery = isEntityPage ? relatedDocsQuery : docsQuery;

    const docs = useMemo(() => {
        const pages = activeQuery.data?.pages ?? [];
        const seen = new Set<string>();
        const out: TechDocEntity[] = [];
        for (const p of pages) {
            for (const e of p.entities) {
                if (!seen.has(e.identifier)) {
                    seen.add(e.identifier);
                    out.push(e);
                }
            }
        }
        return out;
    }, [activeQuery.data]);

    return {
        docs,
        isLoading: activeQuery.isLoading,
        error: activeQuery.error,
        fetchMoreDocs: activeQuery.fetchNextPage,
        hasMoreDocs: Boolean(activeQuery.hasNextPage),
        isFetchingMoreDocs: activeQuery.isFetchingNextPage,
    };
}
