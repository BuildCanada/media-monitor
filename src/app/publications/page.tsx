"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Toggle } from "@/components/ui/toggle";

interface Publication {
  id: number;
  cid: string;
  type: string | null;
  name: string;
  displayName: string | null;
  language: string | null;
  schedule: string | null;
  enabled: boolean;
  latestIssueDate: string | null;
  issueCount: number;
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchPublications = useCallback(async () => {
    const res = await fetch("/api/publications");
    const data = (await res.json()) as Publication[];
    setPublications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  async function handleToggle(cid: string, enabled: boolean) {
    await fetch(`/api/publications/${cid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setPublications((prev) =>
      prev.map((p) => (p.cid === cid ? { ...p, enabled } : p)),
    );
  }

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/publications/sync", { method: "POST" });
    await fetchPublications();
    setSyncing(false);
  }

  if (loading) {
    return <div className="text-neutral-500">Loading publications...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Publications</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {syncing ? "Syncing..." : "Sync Catalog"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">Enabled</th>
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Language</th>
              <th className="pb-2 pr-4 font-medium">Schedule</th>
              <th className="pb-2 pr-4 font-medium">Latest Issue</th>
              <th className="pb-2 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {publications.map((pub) => (
              <tr key={pub.cid} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="py-2 pr-4">
                  <Toggle
                    enabled={pub.enabled}
                    onToggle={(val) => handleToggle(pub.cid, val)}
                  />
                </td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/publications/${pub.cid}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {pub.displayName || pub.name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-neutral-500">{pub.type}</td>
                <td className="py-2 pr-4 text-neutral-500">{pub.language}</td>
                <td className="py-2 pr-4 text-neutral-500">{pub.schedule}</td>
                <td className="py-2 pr-4 text-neutral-500">{pub.latestIssueDate ?? "—"}</td>
                <td className="py-2 text-neutral-500">{pub.issueCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {publications.length === 0 && (
          <p className="mt-4 text-center text-neutral-400">
            No publications yet. Click &quot;Sync Catalog&quot; to fetch from PressReader.
          </p>
        )}
      </div>
    </div>
  );
}
