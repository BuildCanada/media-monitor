"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { statusBadge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

interface RssFeed {
  id: number;
  publicationName: string;
  feedUrl: string;
  category: string | null;
  enabled: boolean;
  lastFetchedAt: string | null;
  lastFetchError: string | null;
  itemCount: number;
}

interface IngestJob {
  id: number;
  status: string;
  feedsFetched: number | null;
  newItems: number | null;
  itemsProcessed: number | null;
  itemsFailed: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function RssPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [feedsRes, jobsRes] = await Promise.all([
      fetch("/api/rss/feeds"),
      fetch("/api/rss/ingest/jobs"),
    ]);
    setFeeds(await feedsRes.json());
    setJobs(await jobsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggle(feedId: number, enabled: boolean) {
    await fetch(`/api/rss/feeds/${feedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, enabled } : f)),
    );
  }

  async function handleSeed() {
    setSeeding(true);
    await fetch("/api/rss/feeds/seed", { method: "POST" });
    await fetchData();
    setSeeding(false);
  }

  async function handleTrigger() {
    setTriggering(true);
    await fetch("/api/rss/ingest/trigger", { method: "POST" });
    await fetchData();
    setTriggering(false);
  }

  async function handleProcess() {
    setProcessing(true);
    setProcessResult(null);
    const res = await fetch("/api/rss/process", { method: "POST" });
    const data: { queued?: number; error?: string } = await res.json();
    setProcessResult(data.queued != null ? `${data.queued} items queued` : data.error || "Failed");
    setProcessing(false);
  }

  if (loading) {
    return <div className="text-neutral-500">Loading RSS data...</div>;
  }

  // Group feeds by publication
  const publications = new Map<string, RssFeed[]>();
  for (const feed of feeds) {
    const group = publications.get(feed.publicationName) || [];
    group.push(feed);
    publications.set(feed.publicationName, group);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">RSS Feeds</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {seeding ? "Seeding..." : "Seed Feeds"}
          </button>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {processing ? "Queueing..." : "Process Pending"}
          </button>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {triggering ? "Ingesting..." : "Trigger RSS Ingest"}
          </button>
        </div>
      </div>

      {processResult && (
        <p className="mt-2 text-right text-sm text-neutral-500">{processResult}</p>
      )}

      {feeds.length === 0 && (
        <p className="mt-6 text-center text-neutral-400">
          No feeds configured. Click &quot;Seed Feeds&quot; to add default feeds.
        </p>
      )}

      {/* Publications */}
      <div className="mt-6 space-y-6">
        {Array.from(publications.entries()).map(([pubName, pubFeeds]) => {
          const totalItems = pubFeeds.reduce((sum, f) => sum + f.itemCount, 0);
          const mostRecent = pubFeeds
            .map((f) => f.lastFetchedAt)
            .filter(Boolean)
            .sort()
            .pop();

          return (
            <div
              key={pubName}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              {/* Publication header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <Link
                  href={`/rss/items?publication=${encodeURIComponent(pubName)}`}
                  className="group flex items-center gap-3"
                >
                  <h2 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {pubName}
                  </h2>
                  <span className="text-sm text-neutral-400">
                    {totalItems} items
                  </span>
                </Link>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  {mostRecent && (
                    <span title={new Date(mostRecent).toLocaleString()}>
                      Fetched {timeAgo(mostRecent)}
                    </span>
                  )}
                </div>
              </div>

              {/* Feed rows */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pubFeeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center gap-4 px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <Toggle
                      enabled={feed.enabled}
                      onToggle={(val) => handleToggle(feed.id, val)}
                    />
                    <Link
                      href={`/rss/items?publication=${encodeURIComponent(feed.publicationName)}${feed.category ? `&category=${encodeURIComponent(feed.category)}` : ""}`}
                      className="flex-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {feed.category || "Main Feed"}
                    </Link>
                    <span className="text-neutral-400 tabular-nums">
                      {feed.itemCount}
                    </span>
                    <span
                      className="w-20 text-right text-neutral-400"
                      title={feed.lastFetchedAt ? new Date(feed.lastFetchedAt).toLocaleString() : undefined}
                    >
                      {feed.lastFetchedAt ? timeAgo(feed.lastFetchedAt) : "Never"}
                    </span>
                    {feed.lastFetchError && (
                      <span className="text-xs text-red-500" title={feed.lastFetchError}>
                        Error
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingest jobs table */}
      <h2 className="mt-8 text-lg font-medium">Ingest Jobs</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">ID</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Feeds</th>
              <th className="pb-2 pr-4 font-medium">New Items</th>
              <th className="pb-2 pr-4 font-medium">Processed</th>
              <th className="pb-2 pr-4 font-medium">Failed</th>
              <th className="pb-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4 font-medium">#{job.id}</td>
                <td className="py-2 pr-4">{statusBadge(job.status)}</td>
                <td className="py-2 pr-4 text-neutral-500">{job.feedsFetched ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">{job.newItems ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">{job.itemsProcessed ?? 0}</td>
                <td className="py-2 pr-4 text-neutral-500">{job.itemsFailed ?? 0}</td>
                <td className="py-2 text-neutral-500">
                  {job.startedAt ? timeAgo(job.startedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="mt-4 text-center text-neutral-400">No ingest jobs yet.</p>
        )}
      </div>
    </div>
  );
}
