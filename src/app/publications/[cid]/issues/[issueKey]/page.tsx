"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface Article {
  id: number;
  title: string | null;
  subtitle: string | null;
  byline: string | null;
  sectionName: string | null;
  page: number | null;
  language: string | null;
  articleType: string | null;
  textLength: number | null;
}

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ cid: string; issueKey: string }>;
}) {
  const { cid, issueKey } = use(params);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/issues/${issueKey}/articles`)
      .then((r) => r.json() as Promise<Article[]>)
      .then((data) => {
        setArticles(data);
        setLoading(false);
      });
  }, [issueKey]);

  if (loading) {
    return <div className="text-neutral-500">Loading articles...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Issue: {issueKey}</h1>
      <p className="mt-1 text-sm text-neutral-500">{articles.length} articles</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
            <tr>
              <th className="pb-2 pr-4 font-medium">Title</th>
              <th className="pb-2 pr-4 font-medium">Section</th>
              <th className="pb-2 pr-4 font-medium">Page</th>
              <th className="pb-2 pr-4 font-medium">Author</th>
              <th className="pb-2 font-medium">Words</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="max-w-md truncate py-2 pr-4">
                  <Link
                    href={`/publications/${cid}/issues/${issueKey}/articles/${article.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {article.title || "Untitled"}
                  </Link>
                  {article.subtitle && (
                    <span className="ml-2 text-neutral-400">{article.subtitle}</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-neutral-500">{article.sectionName ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">{article.page ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">{article.byline ?? "—"}</td>
                <td className="py-2 text-neutral-500">
                  {article.textLength ? Math.round(article.textLength / 5) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
