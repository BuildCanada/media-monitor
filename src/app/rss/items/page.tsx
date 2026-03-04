"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, statusBadge } from "@/components/ui/badge";

interface RssItem {
  id: number;
  title: string;
  author: string | null;
  pubDate: string | null;
  processingStatus: string;
  publicationName: string;
  category: string | null;
  entityCount: number;
}

export default function RssItemsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publication, setPublication] = useState(searchParams.get("publication") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (publication) params.set("publication", publication);
    if (status) params.set("status", status);
    // Pass through category from URL if present
    const cat = searchParams.get("category");
    if (cat) params.set("category", cat);

    const res = await fetch(`/api/rss/items?${params}`);
    setItems(await res.json());
    setLoading(false);
  }, [publication, status, searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return <div className="text-neutral-500">Loading RSS items...</div>;
  }

  // Build title from filters
  const cat = searchParams.get("category");
  const pageTitle = publication
    ? `${publication}${cat ? ` — ${cat}` : ""}`
    : "RSS Items";

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link href="/rss" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
          ← Feeds
        </Link>
        <h1 className="text-2xl font-semibold">{pageTitle}</h1>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-3">
        <select
          value={publication}
          onChange={(e) => setPublication(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All publications</option>
          <option value="Build Canada">Build Canada</option>
          <option value="National Post">National Post</option>
          <option value="Globe and Mail">Globe and Mail</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="extracting">Extracting</option>
          <option value="embedding">Embedding</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Items table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">Title</th>
              <th className="pb-2 pr-4 font-medium">Publication</th>
              <th className="pb-2 pr-4 font-medium">Category</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Entities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4">
                  <Link
                    href={`/rss/items/${item.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {item.title.length > 80
                      ? item.title.substring(0, 80) + "..."
                      : item.title}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-neutral-500">{item.publicationName}</td>
                <td className="py-2 pr-4 text-neutral-500">{item.category || "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {item.pubDate
                    ? new Date(item.pubDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="py-2 pr-4">{statusBadge(item.processingStatus)}</td>
                <td className="py-2">
                  {item.entityCount > 0 ? (
                    <Badge label={String(item.entityCount)} variant="blue" />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="mt-4 text-center text-neutral-400">No RSS items found.</p>
        )}
      </div>
    </div>
  );
}
