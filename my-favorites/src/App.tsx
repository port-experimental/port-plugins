import "./App.css";
import { useMemo, useState } from "react";
import { OverflowMenu } from "./components/OverflowMenu";
import { TabPanel } from "./components/TabPanel";
import { Tabs } from "./components/Tabs";
import { useFavorites } from "./hooks/useFavorites";
import {
  useActions,
  useBlueprintEntities,
  useBlueprints,
  usePages,
} from "./hooks/useCatalog";
import { usePostMessageData } from "./hooks/usePostMessageData";
import type {
  BlueprintParam,
  FavoriteTab,
  FavoritesData,
  Params,
  PluginConfig,
} from "./types";
import {
  DEFAULT_FAVORITES_PROPERTY,
  DEFAULT_USER_BLUEPRINT,
} from "./types";

const EMPTY_FAVORITES: FavoritesData = {
  pages: [],
  actions: [],
  entities: [],
};

function configFromParams(params: Params): PluginConfig {
  const favoritesProperty =
    String(params.favoritesProperty?.value ?? "").trim() ||
    DEFAULT_FAVORITES_PROPERTY;

  const userBlueprintParam = params.userBlueprint?.value as
    | BlueprintParam
    | string
    | undefined;
  const userBlueprint =
    (typeof userBlueprintParam === "string"
      ? userBlueprintParam
      : userBlueprintParam?.identifier) || DEFAULT_USER_BLUEPRINT;

  return { favoritesProperty, userBlueprint };
}

export function App() {
  const { params, user, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const [tab, setTab] = useState<FavoriteTab>("pages");
  const [entityBlueprint, setEntityBlueprint] = useState<string | null>(null);

  const {
    favorites,
    isLoading,
    isError,
    error,
    missingUserEntity,
    saveFavorites,
    isSaving,
    saveError,
  } = useFavorites(config, user?.email, portToken, portApiBaseUrl);

  const pagesQuery = usePages(portToken, portApiBaseUrl);
  const actionsQuery = useActions(portToken, portApiBaseUrl);
  const blueprintsQuery = useBlueprints(
    portToken,
    portApiBaseUrl,
    tab === "entities"
  );
  const entitiesQuery = useBlueprintEntities(
    portToken,
    portApiBaseUrl,
    entityBlueprint
  );

  const data = favorites ?? EMPTY_FAVORITES;
  const counts = useMemo(
    () => ({
      pages: data.pages.length,
      actions: data.actions.length,
      entities: data.entities.length,
    }),
    [data]
  );

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="mf-shell">
        <p className="mf-muted">
          Waiting for Port context… Add this widget to a dashboard in Port.
        </p>
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="mf-shell">
        <p className="mf-muted">
          Sign in to Port to manage your personal favorites.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mf-shell">
        <p className="mf-status">Loading favorites…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mf-shell">
        <pre className="mf-error" role="alert">
          {error instanceof Error ? error.message : "Failed to load favorites"}
        </pre>
      </div>
    );
  }

  if (missingUserEntity) {
    return (
      <div className="mf-shell">
        <p className="mf-setup-hint">
          No <code>{config.userBlueprint}</code> entity was found for{" "}
          <code>{user.email}</code>. Register your user in Port (Self-service →
          Register your user) or ensure your email matches the user entity
          identifier. Also add the <code>{config.favoritesProperty}</code> object
          property to the user blueprint (see plugin README).
        </p>
      </div>
    );
  }

  const clearTab = () => {
    const next = { ...data };
    if (tab === "pages") next.pages = [];
    if (tab === "actions") next.actions = [];
    if (tab === "entities") next.entities = [];
    void saveFavorites(next);
  };

  const clearAll = () => {
    void saveFavorites(EMPTY_FAVORITES);
  };

  return (
    <div className="mf-shell">
      <div className="mf-toolbar">
        <Tabs active={tab} counts={counts} onChange={setTab} />
        <OverflowMenu onClearTab={clearTab} onClearAll={clearAll} />
      </div>
      <div className="mf-body">
        {(pagesQuery.isError || actionsQuery.isError) && (
          <pre className="mf-error" role="alert">
            {pagesQuery.error instanceof Error
              ? pagesQuery.error.message
              : actionsQuery.error instanceof Error
                ? actionsQuery.error.message
                : "Failed to load catalog data"}
          </pre>
        )}
        <TabPanel
          tab={tab}
          favorites={data}
          disabled={isSaving}
          pages={pagesQuery.data ?? []}
          actions={actionsQuery.data ?? []}
          blueprints={blueprintsQuery.data ?? []}
          entities={entitiesQuery.data ?? []}
          entitiesLoading={entitiesQuery.isLoading}
          selectedBlueprint={entityBlueprint}
          onSelectBlueprint={setEntityBlueprint}
          onSave={saveFavorites}
        />
        {saveError && (
          <pre className="mf-error" role="alert">
            {saveError instanceof Error
              ? saveError.message
              : "Failed to save favorites"}
          </pre>
        )}
      </div>
    </div>
  );
}
