"use client";

import { use, useEffect, useState } from "react";

import { statusBadge } from "@/components/ui/badge";

interface ScrapeTask {
  id: number;
  publicationCid: string;
  issueDate: string;
  issueKey: string | null;
  status: string;
  attempt: number | null;
  errorMessage: string | null;
  articlesFound: number | null;
  articlesSaved: number | null;
  imagesFound: number | null;
  imagesSaved: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [tasks, setTasks] = useState<ScrapeTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scrape/jobs/${jobId}/tasks`)
      .then((r) => r.json() as Promise<ScrapeTask[]>)
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  }, [jobId]);

  if (loading) {
    return <div className="text-neutral-500">Loading tasks...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Job #{jobId} Tasks</h1>
      <p className="mt-1 text-sm text-neutral-500">{tasks.length} tasks</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">CID</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Attempt</th>
              <th className="pb-2 pr-4 font-medium">Articles</th>
              <th className="pb-2 pr-4 font-medium">Images</th>
              <th className="pb-2 font-medium">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4 font-mono text-xs">{task.publicationCid}</td>
                <td className="py-2 pr-4">{task.issueDate}</td>
                <td className="py-2 pr-4">{statusBadge(task.status)}</td>
                <td className="py-2 pr-4 text-neutral-500">{task.attempt ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {task.articlesSaved ?? 0}/{task.articlesFound ?? 0}
                </td>
                <td className="py-2 pr-4 text-neutral-500">
                  {task.imagesSaved ?? 0}/{task.imagesFound ?? 0}
                </td>
                <td className="max-w-xs truncate py-2 text-xs text-red-500">
                  {task.errorMessage ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
