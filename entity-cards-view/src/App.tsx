import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { paginateCardEntities } from "./api/entities";
import { CardsGrid } from "./components/CardsGrid";
import { EmptyState } from "./components/EmptyState";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadingState } from "./components/LoadingState";
import { ManagePropertiesPanel } from "./components/ManagePropertiesPanel";
import { PaginationBar } from "./components/PaginationBar";
import { Toolbar } from "./components/Toolbar";
import { useCardEntityPool } from "./hooks/useCardEntityPool";
import { useI18n } from "./hooks/useI18n";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useVisibleProperties } from "./hooks/useVisibleProperties";
import { entityMatchesSearch } from "./utils/entitySearch";
import { configFromParams } from "./utils/config";

const SEARCH_DEBOUNCE_MS = 300;

export function App() {
  const { params, page, portToken, portApiBaseUrl } = usePostMessageData();
  const { t } = useI18n();
  const config = configFromParams(params);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([
    undefined,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPageIndex(0);
    setCursorStack([undefined]);
  }, [config?.blueprint.identifier, debouncedSearch]);

  const {
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
    isLoading: schemaLoading,
    isError: schemaError,
    error: schemaErrorDetail,
  } = useVisibleProperties(config, portToken, portApiBaseUrl);

  const poolQuery = useCardEntityPool(
    config,
    portToken,
    portApiBaseUrl,
    page,
    visibleIds
  );

  const cursorFrom = cursorStack[pageIndex];

  const filteredEntities = useMemo(() => {
    const pool = poolQuery.data ?? [];
    const term = debouncedSearch.trim();
    if (!term) return pool;
    return pool.filter((entity) =>
      entityMatchesSearch(entity, term, visibleIds)
    );
  }, [poolQuery.data, debouncedSearch, visibleIds]);

  const pageData = useMemo(
    () => paginateCardEntities(filteredEntities, cursorFrom),
    [filteredEntities, cursorFrom]
  );

  const entities = pageData.entities;
  const hasNext = !!pageData.next;

  const isLoading =
    schemaLoading || (poolQuery.isLoading && !poolQuery.isFetched);
  const isError = schemaError || poolQuery.isError;
  const error = schemaErrorDetail ?? poolQuery.error;

  const handleNext = useCallback(() => {
    if (!pageData.next) return;
    setCursorStack((prev) => {
      const copy = [...prev];
      copy[pageIndex + 1] = pageData.next ?? undefined;
      return copy.slice(0, pageIndex + 2);
    });
    setPageIndex((i) => i + 1);
  }, [pageData.next, pageIndex]);

  const handlePrevious = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleRefresh = useCallback(() => {
    void poolQuery.refetch();
  }, [poolQuery]);

  const isRefreshing = poolQuery.isFetching && !poolQuery.isLoading;

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <p className="muted">{t("waiting.context")}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="shell">
        <p className="muted">{t("waiting.blueprint")}</p>
      </div>
    );
  }

  const blueprintTitle = config.blueprint.title ?? "entities";

  return (
    <div className="shell">
      <Toolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onManageProperties={() => setManageOpen((o) => !o)}
        onRefresh={handleRefresh}
        manageOpen={manageOpen}
        blueprintTitle={blueprintTitle}
        isRefreshing={isRefreshing}
      />

      <div className="manage-props-anchor">
        <ManagePropertiesPanel
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          available={available}
          visibleIds={visibleIds}
          arrayDisplayModes={arrayDisplayModes}
          booleanDisplayModes={booleanDisplayModes}
          onToggle={toggleProperty}
          onArrayDisplayChange={setArrayDisplayMode}
          onBooleanDisplayChange={setBooleanDisplayMode}
          onSelectAll={() =>
            setVisiblePropertyIds(available.map((p) => p.identifier))
          }
          onClearAll={() => setVisiblePropertyIds([])}
        />
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorBanner error={error} onRetry={handleRefresh} />}

      {!isLoading && !isError && entities.length === 0 && (
        <EmptyState
          blueprintTitle={config.blueprint.title}
          hasSearch={!!debouncedSearch.trim()}
        />
      )}

      {!isLoading && !isError && entities.length > 0 && (
        <div className="cards-body scroll-area">
          <CardsGrid
            entities={entities}
            blueprintIdentifier={config.blueprint.identifier}
            visibleProperties={visibleProperties}
            getArrayDisplayMode={getDisplayModeForProperty}
            getBooleanDisplayMode={getBooleanDisplayModeForProperty}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      )}

      {!isLoading && !isError && (entities.length > 0 || pageIndex > 0) && (
        <PaginationBar
          pageIndex={pageIndex}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
          disabled={poolQuery.isFetching}
        />
      )}
    </div>
  );
}
