const VARIANTS: Record<string, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  gray: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function Badge({ label, variant = "gray" }: { label: string; variant?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.gray}`}
    >
      {label}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: string }> = {
    completed: { label: "Completed", variant: "green" },
    running: { label: "Running", variant: "blue" },
    extracting: { label: "Extracting", variant: "blue" },
    embedding: { label: "Embedding", variant: "blue" },
    failed: { label: "Failed", variant: "red" },
    pending: { label: "Pending", variant: "yellow" },
    queued: { label: "Queued", variant: "yellow" },
    skipped: { label: "Skipped", variant: "gray" },
    none: { label: "Not scraped", variant: "gray" },
  };
  const info = map[status] ?? { label: status, variant: "gray" };
  return <Badge label={info.label} variant={info.variant} />;
}
