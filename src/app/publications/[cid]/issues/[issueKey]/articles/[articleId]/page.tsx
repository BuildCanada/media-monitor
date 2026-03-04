"use client";

import { use, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

interface ArticleDetail {
  id: number;
  title: string | null;
  subtitle: string | null;
  byline: string | null;
  sectionName: string | null;
  page: number | null;
  pageName: string | null;
  language: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  authors: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; displayName: string; weight: number | null }>;
  images: Array<{
    id: number;
    r2Key: string | null;
    caption: string | null;
    width: number | null;
    height: number | null;
  }>;
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = use(params);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${articleId}`)
      .then((r) => r.json() as Promise<ArticleDetail>)
      .then((data) => {
        setArticle(data);
        setLoading(false);
      });
  }, [articleId]);

  if (loading) {
    return <div className="text-neutral-500">Loading article...</div>;
  }

  if (!article) {
    return <div className="text-red-500">Article not found</div>;
  }

  return (
    <article className="max-w-3xl">
      <header>
        {article.sectionName && (
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {article.sectionName}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-semibold leading-tight">{article.title}</h1>
        {article.subtitle && (
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            {article.subtitle}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          {article.authors.length > 0 && (
            <span>By {article.authors.map((a) => a.name).join(", ")}</span>
          )}
          {article.page && <span>Page {article.page}</span>}
          {article.language && <span>({article.language})</span>}
        </div>
      </header>

      {article.images.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {article.images.map((img) => (
            <figure key={img.id} className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
              {img.r2Key ? (
                <img
                  src={`/api/images/${img.r2Key}`}
                  alt={img.caption || "Article image"}
                  className="max-h-64 w-auto"
                />
              ) : (
                <div className="flex h-32 w-48 items-center justify-center bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800">
                  No image
                </div>
              )}
              {img.caption && (
                <figcaption className="p-2 text-xs text-neutral-500">{img.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {article.bodyText && (
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
          {article.bodyText}
        </div>
      )}

      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Badge key={tag.id} label={tag.displayName} variant="blue" />
          ))}
        </div>
      )}
    </article>
  );
}
