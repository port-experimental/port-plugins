import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

type PaginationBarProps = {
  pageIndex: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function PaginationBar({
  pageIndex,
  hasNext,
  onPrevious,
  onNext,
  disabled,
}: PaginationBarProps) {
  const { t } = useI18n();
  const canPrev = pageIndex > 0 && !disabled;

  return (
    <nav className="pagination" aria-label={t("pagination.aria")}>
      <button
        type="button"
        className="btn btn--icon"
        onClick={onPrevious}
        disabled={!canPrev}
        aria-label={t("pagination.prevAria")}
      >
        <ChevronLeft size={16} aria-hidden />
      </button>
      <span className="pagination__label">
        {t("pagination.label", { page: pageIndex + 1 })}
      </span>
      <button
        type="button"
        className="btn btn--icon"
        onClick={onNext}
        disabled={!hasNext || disabled}
        aria-label={t("pagination.nextAria")}
      >
        <ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  );
}
