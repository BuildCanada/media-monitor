"use client";

import { useCallback, useEffect, useState } from "react";

import { EntityBadges } from "@/components/ui/entity-badges";

interface SearchResult {
  rssItemId: number;
  chunkSeq: number;
  title: string;
  author: string | null;
  publication: string;
  pubDate: string | null;
  category: string | null;
  articleUrl: string;
  chunkText: string;
  score: number;
  entitiesPeople: string[];
  entitiesOrganizations: string[];
  entitiesLocations: string[];
  entitiesTopics: string[];
}

type SearchMode = "hybrid" | "semantic" | "keyword";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("hybrid");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filters
  const [publications, setPublications] = useState<string[]>([]);
  const [publication, setPublication] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/rss/feeds")
      .then((res) => res.json())
      .then((feeds: unknown) => {
        const items = feeds as { publicationName: string }[];
        const names = [...new Set(items.map((f) => f.publicationName))].sort();
        setPublications(names);
      });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);

    const filters: Record<string, string> = {};
    if (publication) filters.publication = publication;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        mode,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limit: 20,
      }),
    });

    const data = (await res.json()) as { results?: SearchResult[] };
    setResults(data.results || []);
    setSearching(false);
  }, [query, mode, publication, dateFrom, dateTo]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Search Articles</h1>

      {/* Search bar */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search articles..."
            className="w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as SearchMode)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="hybrid">Hybrid</option>
          <option value="semantic">Semantic</option>
          <option value="keyword">Keyword</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="mt-4 flex gap-6">
        {/* Filters sidebar */}
        <div className="w-48 shrink-0 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase text-neutral-400">Publication</label>
            <select
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">All</option>
              {publications.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-neutral-400">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-neutral-400">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          {searched && !searching && results.length === 0 && (
            <p className="text-neutral-400">No results found.</p>
          )}
          {results.map((r) => (
            <div
              key={`${r.rssItemId}-${r.chunkSeq}`}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <a
                href={r.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {r.title}
              </a>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                <span>{r.publication}</span>
                {r.pubDate && (
                  <span>· {new Date(r.pubDate).toLocaleDateString()}</span>
                )}
                {r.author && <span>· {r.author}</span>}
                <span className="ml-auto text-neutral-400">
                  Score: {r.score.toFixed(3)}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                {r.chunkText.length > 300
                  ? r.chunkText.substring(0, 300) + "..."
                  : r.chunkText}
              </p>
              <div className="mt-2">
                <EntityBadges
                  people={r.entitiesPeople}
                  organizations={r.entitiesOrganizations}
                  locations={r.entitiesLocations}
                  topics={r.entitiesTopics}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
