"use client";

import { use, useEffect, useState } from "react";
import Markdown from "react-markdown";

import { Badge, statusBadge } from "@/components/ui/badge";

interface RssItemDetail {
  id: number;
  title: string;
  author: string | null;
  link: string;
  pubDate: string | null;
  description: string | null;
  processingStatus: string;
  processingError: string | null;
  processedAt: string | null;
  contentMarkdown: string | null;
  defuddleTitle: string | null;
  defuddleAuthor: string | null;
  defuddleDescription: string | null;
  defuddleDomain: string | null;
  defuddlePublished: string | null;
  defuddleWordCount: number | null;
  publicationName: string;
  category: string | null;
  entities: Array<{
    entityType: string;
    entityValue: string;
    confidence: string;
  }>;
}

const ENTITY_COLORS: Record<string, string> = {
  person: "blue",
  organization: "green",
  location: "yellow",
  topic: "gray",
};

export default function RssItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = use(params);
  const [item, setItem] = useState<RssItemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rss/items/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data as RssItemDetail);
        setLoading(false);
      });
  }, [itemId]);

  if (loading) {
    return <div className="text-neutral-500">Loading article...</div>;
  }

  if (!item) {
    return <div className="text-red-500">Article not found.</div>;
  }

  const grouped = item.entities.reduce(
    (acc, e) => {
      if (!acc[e.entityType]) acc[e.entityType] = [];
      acc[e.entityType].push(e);
      return acc;
    },
    {} as Record<string, typeof item.entities>,
  );

  // Use defuddle author/title if available, fallback to RSS
  const displayAuthor = item.defuddleAuthor || item.author;
  const displayDescription = item.defuddleDescription || item.description;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{item.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.publicationName}</span>
        {item.category && <span>· {item.category}</span>}
        {displayAuthor && <span>· {displayAuthor}</span>}
        {item.pubDate && (
          <span>· {new Date(item.pubDate).toLocaleDateString()}</span>
        )}
        {item.defuddleWordCount && (
          <span>· {item.defuddleWordCount.toLocaleString()} words</span>
        )}
        <span>· {statusBadge(item.processingStatus)}</span>
      </div>

      {displayDescription && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 italic">
          {displayDescription}
        </p>
      )}

      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        View original →
      </a>

      {item.processingError && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {item.processingError}
        </div>
      )}

      {/* Metadata comparison */}
      {item.processingStatus === "completed" && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            Metadata (RSS vs Defuddle)
          </summary>
          <div className="mt-2 grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 text-sm rounded-md bg-neutral-50 p-4 dark:bg-neutral-900">
            <span className="font-medium text-neutral-400">Field</span>
            <span className="font-medium text-neutral-400">RSS</span>
            <span className="font-medium text-neutral-400">Defuddle</span>

            <span className="text-neutral-500">Title</span>
            <span>{item.title}</span>
            <span>{item.defuddleTitle || "—"}</span>

            <span className="text-neutral-500">Author</span>
            <span>{item.author || "—"}</span>
            <span>{item.defuddleAuthor || "—"}</span>

            <span className="text-neutral-500">Published</span>
            <span>{item.pubDate ? new Date(item.pubDate).toLocaleString() : "—"}</span>
            <span>{item.defuddlePublished || "—"}</span>

            <span className="text-neutral-500">Description</span>
            <span className="truncate max-w-xs">{item.description || "—"}</span>
            <span className="truncate max-w-xs">{item.defuddleDescription || "—"}</span>

            <span className="text-neutral-500">Domain</span>
            <span>—</span>
            <span>{item.defuddleDomain || "—"}</span>

            <span className="text-neutral-500">Word count</span>
            <span>—</span>
            <span>{item.defuddleWordCount?.toLocaleString() || "—"}</span>
          </div>
        </details>
      )}

      {/* Entities */}
      {Object.keys(grouped).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium">Entities</h2>
          <div className="mt-2 space-y-2">
            {Object.entries(grouped).map(([type, entities]) => (
              <div key={type}>
                <span className="text-xs font-medium uppercase text-neutral-400">
                  {type}s
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {entities.map((e, i) => (
                    <Badge
                      key={i}
                      label={e.entityValue}
                      variant={ENTITY_COLORS[type] || "gray"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {item.contentMarkdown && (
        <article className="mt-6 prose prose-neutral dark:prose-invert max-w-none">
          <Markdown>{item.contentMarkdown}</Markdown>
        </article>
      )}
    </div>
  );
}
