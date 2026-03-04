"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return (
      <span key={href} className="flex items-center gap-1">
        <span className="text-neutral-400">/</span>
        {isLast ? (
          <span className="text-neutral-900 dark:text-neutral-100">{label}</span>
        ) : (
          <Link
            href={href}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {label}
          </Link>
        )}
      </span>
    );
  });

  return <div className="flex items-center gap-1 text-sm">{crumbs}</div>;
}
