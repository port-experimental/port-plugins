import { useState } from "react";
import {
  ChevronLeftIcon,
  XIcon,
  CheckIcon,
  LayersIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchEntitiesForBlueprint } from "../api/entities";
import { LoadingDots } from "./LoadingState";
import type {
  TabKey,
  PortPage,
  PortAction,
  PortBlueprint,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
} from "../types";

type Props = {
  tab: TabKey;
  pages: PortPage[];
  actions: PortAction[];
  blueprints: PortBlueprint[];
  alreadyAdded: Set<string>;
  portToken: string;
  portApiBaseUrl: string;
  search: string;
  onSearchReset: () => void;
  onAdd: (item: FavoritePage | FavoriteAction | FavoriteEntity) => void;
  onClose: () => void;
};

type Stage = "main" | "entities";

type ListItem = {
  identifier: string;
  title: string;
  subtitle?: string;
  isBlueprintPicker?: boolean;
};

export function AddDropdown({
  tab,
  pages,
  actions,
  blueprints,
  alreadyAdded,
  portToken,
  portApiBaseUrl,
  search,
  onSearchReset,
  onAdd,
  onClose,
}: Props) {
  const [stage, setStage] = useState<Stage>("main");
  const [selectedBp, setSelectedBp] = useState<PortBlueprint | null>(null);
  const entitiesQuery = useQuery({
    queryKey: ["entities", selectedBp?.identifier, portToken],
    queryFn: () =>
      fetchEntitiesForBlueprint(portApiBaseUrl, portToken, selectedBp!.identifier),
    enabled: tab === "entities" && stage === "entities" && !!selectedBp,
    staleTime: 60_000,
  });

  function handleGoBack() {
    setStage("main");
    setSelectedBp(null);
    onSearchReset();
  }

  function buildListItems(): ListItem[] {
    if (tab === "pages") {
      return pages.filter(p => p.type !== "entity" && p.showInSidebar !== false).map((p) => ({
        identifier: p.identifier,
        title: p.title ?? p.identifier,
        subtitle: p.type === "blueprint-entities" ? "catalog" : p.type,
      }));
    }
    if (tab === "selfService") {
      return actions.map((a) => ({
        identifier: a.identifier,
        title: a.title ?? a.identifier,
        subtitle: a.description,
      }));
    }
    if (stage === "main") {
      return blueprints.map((b) => ({
        identifier: b.identifier,
        title: b.title ?? b.identifier,
        isBlueprintPicker: true,
      }));
    }
    return (entitiesQuery.data ?? []).map((e) => ({
      identifier: e.identifier,
      title: e.title ?? e.identifier,
    }));
  }

  const q = search.trim().toLowerCase();
  const filtered = buildListItems().filter((item) => {
    if (!q) return true;
    return (
      (item.title ?? "").toLowerCase().includes(q) ||
      (item.identifier ?? "").toLowerCase().includes(q) ||
      ((item.subtitle ?? "").toLowerCase().includes(q))
    );
  });

  function handleSelect(identifier: string) {
    if (tab === "entities" && stage === "main") {
      const bp = blueprints.find((b) => b.identifier === identifier);
      if (bp) {
        setSelectedBp(bp);
        setStage("entities");
        onSearchReset();
      }
      return;
    }

    if (tab === "pages") {
      const page = pages.find((p) => p.identifier === identifier);
      if (page)
        onAdd({
          identifier: page.identifier,
          title: page.title,
          type: page.type === "blueprint-entities" ? "catalog" : page.type,
          icon: page.type === "blueprint-entities" ? 'table-2' : 'layout-dashboard',
        } satisfies FavoritePage);
    } else if (tab === "selfService") {
      const action = actions.find((a) => a.identifier === identifier);
      if (action)
        onAdd({
          identifier: action.identifier,
          title: action.title,
          description: action.description,
          blueprint: action.blueprint,
        } satisfies FavoriteAction);
    } else {
      const entity = entitiesQuery.data?.find((e) => e.identifier === identifier);
      if (entity && selectedBp)
        onAdd({
          identifier: entity.identifier,
          title: entity.title ?? entity.identifier,
          blueprint: selectedBp.identifier,
          blueprintTitle: selectedBp.title,
        } satisfies FavoriteEntity);
    }
  }

  const isEntityLoading =
    tab === "entities" &&
    stage === "entities" &&
    (entitiesQuery.isPending || entitiesQuery.isLoading);

  return (
    <div className="add-panel">
      {/* Header row — back (entity drill-down) + close button */}
      <div className="add-panel-header">
        {tab === "entities" && stage === "entities" ? (
          <button
            type="button"
            className="add-panel-back-btn"
            aria-label="Back to blueprints"
            onClick={handleGoBack}
          >
            <ChevronLeftIcon size={13} aria-hidden />
            <span>{selectedBp?.title ?? "Back"}</span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="add-panel-close-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <XIcon size={14} aria-hidden />
        </button>
      </div>

      {/* Results list */}
      <ul className="add-panel-list" role="listbox">
        {isEntityLoading ? (
          <li className="add-panel-status">
            <LoadingDots />
          </li>
        ) : filtered.length === 0 ? (
          <li className="add-panel-status add-panel-empty">
            No matching items
          </li>
        ) : (
          filtered.map((item) => {
            const isAdded =
              tab !== "entities" || stage === "entities"
                ? alreadyAdded.has(item.identifier)
                : false;

            return (
              <li key={item.identifier} role="option" aria-selected={false}>
                <button
                  type="button"
                  disabled={isAdded}
                  className={[
                    "add-panel-item",
                    isAdded ? "add-panel-item--added" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => !isAdded && handleSelect(item.identifier)}
                >
                  {item.isBlueprintPicker && (
                    <LayersIcon size={13} className="add-item-icon" aria-hidden />
                  )}
                  <span className="add-item-title">{item.title}</span>
                  {isAdded ? (
                    <CheckIcon size={13} className="add-item-check" aria-hidden />
                  ) : item.isBlueprintPicker ? (
                    <ChevronRightIcon size={13} className="add-item-chevron" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
