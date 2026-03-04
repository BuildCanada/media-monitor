"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import { statusBadge } from "@/components/ui/badge";

interface Issue {
  id: number;
  issueKey: string;
  issueDate: string;
  pageCount: number | null;
  articleCount: number | null;
  scrapeStatus: string;
}

export default function PublicationDetailPage({
  params,
}: {
  params: Promise<{ cid: string }>;
}) {
  const { cid } = use(params);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfillFrom, setBackfillFrom] = useState("");
  const [backfillTo, setBackfillTo] = useState("");
  const [triggering, setTriggering] = useState(false);

  const fetchIssues = useCallback(async () => {
    const res = await fetch(`/api/publications/${cid}/issues`);
    const data = (await res.json()) as Issue[];
    setIssues(data);
    setLoading(false);
  }, [cid]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function handleBackfill() {
    if (!backfillFrom || !backfillTo) return;
    setTriggering(true);
    await fetch("/api/scrape/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "backfill", cid, from: backfillFrom, to: backfillTo }),
    });
    await fetchIssues();
    setTriggering(false);
  }

  if (loading) {
    return <div className="text-neutral-500">Loading issues...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{cid}</h1>

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500">Backfill</h2>
        <div className="mt-2 flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            From
            <input
              type="date"
              value={backfillFrom}
              onChange={(e) => setBackfillFrom(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            To
            <input
              type="date"
              value={backfillTo}
              onChange={(e) => setBackfillTo(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            onClick={handleBackfill}
            disabled={triggering || !backfillFrom || !backfillTo}
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {triggering ? "Triggering..." : "Backfill"}
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Pages</th>
              <th className="pb-2 pr-4 font-medium">Articles</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4">
                  <Link
                    href={`/publications/${cid}/issues/${issue.issueKey}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {issue.issueDate}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-neutral-500">{issue.pageCount ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">{issue.articleCount ?? "—"}</td>
                <td className="py-2">{statusBadge(issue.scrapeStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length === 0 && (
          <p className="mt-4 text-center text-neutral-400">
            No issues found. Use backfill to scrape past issues.
          </p>
        )}
      </div>
    </div>
  );
}
