import { SearchIcon } from "lucide-react";

export function SearchNoResults() {
  return (
    <div className="search-no-results">
      <SearchIcon size={40} className="search-no-results-icon" strokeWidth={1.5} aria-hidden />
      <p className="search-no-results-title">No results found</p>
      <p className="search-no-results-hint">
        Please try using a different search term
      </p>
    </div>
  );
}
