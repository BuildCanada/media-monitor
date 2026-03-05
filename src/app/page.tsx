import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Media Monitor</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Canadian media monitoring for Build Canada. Ingest RSS feeds and search
        across all indexed articles.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/rss"
          className="rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <h2 className="font-medium">RSS Feeds</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage RSS feeds, ingest articles, and track processing.
          </p>
        </Link>
        <Link
          href="/search"
          className="rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <h2 className="font-medium">Search</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Search across all indexed articles with hybrid vector + keyword search.
          </p>
        </Link>
      </div>
    </div>
  );
}
