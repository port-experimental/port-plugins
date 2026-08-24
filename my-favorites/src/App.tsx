import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { RefreshCwIcon } from "lucide-react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useFavoriteData, parseFavorites } from "./hooks/useFavoriteData";
import { TabContent } from "./components/TabContent";
import { TabTypeIcon } from "./components/TabTypeIcon";
import { LoadingState } from "./components/LoadingState";
import { ErrorBanner } from "./components/ErrorBanner";
import { MissingFavoritesProperty } from "./components/MissingFavoritesProperty";
import { isPortAdmin } from "./utils/portUser";
import type { TabKey, FavoritesData } from "./types";

const TAB_LABELS: Record<TabKey, string> = {
  pages: "Pages",
  selfService: "Self service",
  entities: "Entities",
};

const TABS: TabKey[] = ["pages", "entities", "selfService"];
const EMPTY_FAVORITES: FavoritesData = { pages: [], selfService: [], entities: [] };

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

export function App() {
  const [favorites, setFavorites] = useState<FavoritesData>(EMPTY_FAVORITES);
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const initialRefreshStarted = useRef(false);

  // Tab drag state
  const [tabDragIdx, setTabDragIdx]     = useState<number | null>(null);
  const [tabInsertIdx, setTabInsertIdx] = useState<number | null>(null);

  // Active tab — defaults to first in order
  const tabOrder: TabKey[] = favorites.tabOrder ?? TABS;
  const [activeTab, setActiveTab] = useState<TabKey>(tabOrder[0] ?? "pages");

  const { portToken, portApiBaseUrl, user } = usePostMessageData();

  const {
    userEntityQuery,
    userBlueprintQuery,
    pagesQuery,
    actionsQuery,
    workflowsQuery,
    blueprintsQuery,
    hasFavoritesProperty,
    supportsFavoritesIdentifiers,
    saveMutation,
    refreshFavorites,
  } = useFavoriteData(portToken, portApiBaseUrl, user?.email);

  const applyFavorites = useCallback((next: FavoritesData) => {
    setFavorites(next);
    if (next.tabOrder && next.tabOrder.length > 0) {
      setActiveTab(next.tabOrder[0]);
    }
  }, []);

  const runRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { reconciled, changed } = await refreshFavorites();
      applyFavorites(reconciled);
      if (changed && userEntityQuery.data) {
        saveMutation.mutate({
          favorites: reconciled,
          userIdentifier: userEntityQuery.data.identifier,
          syncIdentifiers: supportsFavoritesIdentifiers,
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to refresh favorites:", error);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshFavorites,
    applyFavorites,
    userEntityQuery.data,
    saveMutation,
    supportsFavoritesIdentifiers,
  ]);

  // Sync favorites against Port on initial load
  useEffect(() => {
    if (
      initialRefreshStarted.current ||
      initialized ||
      !userEntityQuery.isSuccess ||
      !userEntityQuery.data ||
      !userBlueprintQuery.isSuccess ||
      !hasFavoritesProperty
    ) {
      return;
    }
    initialRefreshStarted.current = true;
    const userEntity = userEntityQuery.data;

    void (async () => {
      const ok = await runRefresh();
      if (!ok) {
        applyFavorites(parseFavorites(userEntity.properties?.favorites));
      }
      setInitialized(true);
    })();
  }, [
    initialized,
    userEntityQuery.isSuccess,
    userEntityQuery.data,
    userBlueprintQuery.isSuccess,
    hasFavoritesProperty,
    runRefresh,
    applyFavorites,
  ]);

  const updateFavorites = useCallback(
    (next: FavoritesData) => {
      setFavorites(next);
      if (userEntityQuery.data) {
        saveMutation.mutate({
          favorites: next,
          userIdentifier: userEntityQuery.data.identifier,
          syncIdentifiers: supportsFavoritesIdentifiers,
        });
      }
    },
    [userEntityQuery.data, saveMutation, supportsFavoritesIdentifiers]
  );

  const handleRefresh = useCallback(async () => {
    await runRefresh();
  }, [runRefresh]);

  if (!portApiBaseUrl || !portToken) {
    return (
      <ShellMessage>
        Waiting for Port context… If this persists, check the browser console.
      </ShellMessage>
    );
  }

  if (
    userEntityQuery.isPending ||
    userEntityQuery.isLoading ||
    userBlueprintQuery.isPending ||
    userBlueprintQuery.isLoading
  ) {
    return (
      <div className="shell">
        <LoadingState message="Loading your favorites…" />
      </div>
    );
  }

  if (userBlueprintQuery.isError) {
    return (
      <div className="shell">
        <ErrorBanner
          message="Could not load the _user blueprint."
          error={userBlueprintQuery.error}
          onRetry={() => userBlueprintQuery.refetch()}
        />
      </div>
    );
  }

  if (userBlueprintQuery.isSuccess && !hasFavoritesProperty) {
    return (
      <div className="shell shell--message">
        <MissingFavoritesProperty
          isAdmin={isPortAdmin(user)}
          onRetry={() => userBlueprintQuery.refetch()}
        />
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="shell">
        <LoadingState message="Loading your favorites…" />
      </div>
    );
  }

  if (userEntityQuery.isError) {
    return (
      <div className="shell">
        <ErrorBanner
          message="Could not load your user profile."
          error={userEntityQuery.error}
          onRetry={() => userEntityQuery.refetch()}
        />
      </div>
    );
  }

  if (!userEntityQuery.data) {
    return (
      <ShellMessage>
        User profile not found. Ensure your Port account has a matching{" "}
        <code>_user</code> entity.
      </ShellMessage>
    );
  }

  const tabCounts: Record<TabKey, number> = {
    pages: favorites.pages.length,
    selfService: favorites.selfService.length,
    entities: favorites.entities.length,
  };

  return (
    <div className="shell">
      {/* Tab bar */}
      <div className="fav-header">
        <div
          className="fav-tabs"
          role="tablist"
          aria-label="Favorites categories"
          onDragOver={(e) => e.preventDefault()}
        >
          {tabOrder.map((tab, idx) => (
            <div
              key={tab}
              className={`fav-tab-wrap${tabInsertIdx === idx && tabDragIdx !== null ? " fav-tab-wrap--before" : ""}${tabInsertIdx === idx + 1 && tabDragIdx !== null ? " fav-tab-wrap--after" : ""}`}
            >
              <button
                role="tab"
                draggable
                aria-selected={activeTab === tab}
                aria-controls={`tabpanel-${tab}`}
                id={`tab-${tab}`}
                className={`fav-tab${activeTab === tab ? " fav-tab--active" : ""}${tabDragIdx === idx ? " fav-tab--dragging" : ""}`}
                onClick={() => setActiveTab(tab)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setTabDragIdx(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTabInsertIdx(e.clientX < rect.left + rect.width / 2 ? idx : idx + 1);
                }}
                onDragEnd={() => {
                  if (tabDragIdx !== null && tabInsertIdx !== null) {
                    let target = tabInsertIdx > tabDragIdx ? tabInsertIdx - 1 : tabInsertIdx;
                    if (target !== tabDragIdx) {
                      const next = [...tabOrder] as TabKey[];
                      const [moved] = next.splice(tabDragIdx, 1);
                      next.splice(target, 0, moved);
                      updateFavorites({ ...favorites, tabOrder: next });
                    }
                  }
                  setTabDragIdx(null);
                  setTabInsertIdx(null);
                }}
              >
                <span className="fav-tab-icon" aria-hidden>
                  <TabTypeIcon tab={tab} size={18} />
                </span>
                {TAB_LABELS[tab]}
                <span className="fav-tab-badge">{tabCounts[tab]}</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`fav-refresh-btn${refreshing ? " fav-refresh-btn--spinning" : ""}`}
          aria-label="Refresh favorites"
          disabled={refreshing || saveMutation.isPending}
          onClick={() => void handleRefresh()}
        >
          <RefreshCwIcon size={16} aria-hidden />
        </button>
      </div>

      {/* Tab panels */}
      {TABS.map((tab) => (  // always render all three panels regardless of order
        <div
          key={tab}
          id={`tabpanel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          hidden={activeTab !== tab}
          className="fav-tabpanel"
        >
          <TabContent
            tab={tab}
            favorites={favorites}
            pages={pagesQuery.data ?? []}
            actions={actionsQuery.data ?? []}
            workflows={workflowsQuery.data ?? []}
            blueprints={blueprintsQuery.data ?? []}
            portToken={portToken}
            portApiBaseUrl={portApiBaseUrl}
            onUpdate={updateFavorites}
          />
        </div>
      ))}

    </div>
  );
}
