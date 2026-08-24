import { Settings2Icon, RefreshCwIcon } from "lucide-react";

const SETUP_README_URL =
  "https://github.com/port-experimental/port-plugins/blob/main/favorites/README.md#catalog";

type Props = {
  isAdmin: boolean;
  onRetry?: () => void;
};

export function MissingFavoritesProperty({ isAdmin, onRetry }: Props) {
  return (
    <div className="empty-state-wrap">
      <div className="setup-state" role="status">
        <Settings2Icon size={44} className="empty-state-icon" strokeWidth={1.5} aria-hidden />
        <p className="empty-state-title">Setup required</p>
        <p className="empty-state-hint">
          {isAdmin
            ? "This widget needs a favorites property on the _user blueprint. Add it to the schema to continue."
            : "This widget needs a small setup step from your Port admin. Ask them to add a favorites property to the _user blueprint."}
        </p>
        {isAdmin && (
          <a
            className="setup-state-link"
            href={SETUP_README_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View setup instructions →
          </a>
        )}
        {onRetry && (
          <button type="button" className="setup-state-retry" onClick={onRetry}>
            <RefreshCwIcon size={14} aria-hidden />
            Check again
          </button>
        )}
      </div>
    </div>
  );
}
