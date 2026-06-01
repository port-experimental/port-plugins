import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

type ToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onManageProperties: () => void;
  onRefresh: () => void;
  manageOpen: boolean;
  blueprintTitle: string;
  isRefreshing?: boolean;
};

export function Toolbar({
  searchValue,
  onSearchChange,
  onManageProperties,
  onRefresh,
  manageOpen,
  blueprintTitle,
  isRefreshing,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="toolbar">
      <div className="search-field">
        <Search size={16} className="search-field__icon" aria-hidden />
        <input
          type="search"
          className="search-field__input"
          placeholder={t("search.placeholder", { blueprint: blueprintTitle })}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={t("search.ariaLabel")}
        />
      </div>
      <div className="toolbar__actions">
        <button
          type="button"
          className="btn btn--secondary btn--icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t("toolbar.refresh")}
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? "spin" : undefined}
            aria-hidden
          />
        </button>
        <button
          type="button"
          className={`btn btn--secondary${manageOpen ? " btn--active" : ""}`}
          onClick={onManageProperties}
          aria-expanded={manageOpen}
          aria-haspopup="dialog"
          data-manage-properties-trigger
        >
          <SlidersHorizontal size={14} aria-hidden />
        {t("toolbar.manageProperties")}
      </button>
      </div>
    </div>
  );
}
