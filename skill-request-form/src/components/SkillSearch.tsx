import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { fetchSkillsBySearch, type SkillSearchResult } from "../api/skills";
import type { PluginConfig } from "../types";

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  onBack: () => void;
  onSelect: (skill: SkillSearchResult) => void;
};

export function SkillSearch({ baseUrl, token, config, onBack, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await fetchSkillsBySearch({ baseUrl, token }, config, q);
        setResults(res);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, token, config]
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void doSearch(query.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  return (
    <div className="skill-search">
      <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden /> Back
      </button>

      <div>
        <h2 className="picker-title">Update an existing skill</h2>
        <p className="muted-block">
          Search for the skill you want to update. You'll be able to edit its
          files and submit the changes for review.
        </p>
      </div>

      <div className="search-input-wrap">
        <Search size={15} aria-hidden className="search-icon" />
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills by name…"
          autoFocus
        />
        {loading && <Loader2 size={15} aria-hidden className="spinner search-spinner" />}
      </div>

      <div className="search-results">
        {results.map((skill) => (
          <button
            key={skill.identifier}
            type="button"
            className="search-result"
            onClick={() => onSelect(skill)}
          >
            <span className="search-result-title">{skill.title}</span>
            <span className="search-result-meta">
              {skill.location && (
                <span className="search-result-tag">{skill.location}</span>
              )}
              <span className="search-result-id">{skill.identifier}</span>
            </span>
          </button>
        ))}
        {searched && results.length === 0 && !loading && (
          <p className="muted search-empty">No skills found matching "{query}"</p>
        )}
      </div>
    </div>
  );
}
