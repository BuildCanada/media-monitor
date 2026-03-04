"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { statusBadge } from "@/components/ui/badge";

interface ScrapeJob {
  id: number;
  jobType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  publicationsTotal: number | null;
  issuesTotal: number | null;
  issuesScraped: number | null;
  articlesScraped: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function ScrapePage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/scrape/jobs");
    const data = (await res.json()) as ScrapeJob[];
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleTrigger() {
    setTriggering(true);
    await fetch("/api/scrape/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "daily" }),
    });
    await fetchJobs();
    setTriggering(false);
  }

  function formatDuration(start: string | null, end: string | null) {
    if (!start) return "—";
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const secs = Math.round((e - s) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  if (loading) {
    return <div className="text-neutral-500">Loading scrape jobs...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scrape Jobs</h1>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {triggering ? "Triggering..." : "Trigger Daily Scrape"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">ID</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Publications</th>
              <th className="pb-2 pr-4 font-medium">Issues</th>
              <th className="pb-2 pr-4 font-medium">Articles</th>
              <th className="pb-2 pr-4 font-medium">Duration</th>
              <th className="pb-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4">
                  <Link
                    href={`/scrape/${job.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    #{job.id}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-neutral-500">{job.jobType}</td>
                <td className="py-2 pr-4">{statusBadge(job.status)}</td>
                <td className="py-2 pr-4 text-neutral-500">{job.publicationsTotal ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {job.issuesScraped ?? 0}/{job.issuesTotal ?? 0}
                </td>
                <td className="py-2 pr-4 text-neutral-500">{job.articlesScraped ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {formatDuration(job.startedAt, job.completedAt)}
                </td>
                <td className="py-2 text-neutral-500">
                  {job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="mt-4 text-center text-neutral-400">No scrape jobs yet.</p>
        )}
      </div>
    </div>
  );
}
