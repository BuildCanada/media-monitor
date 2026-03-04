import { Badge } from "./badge";

const TYPE_COLORS: Record<string, string> = {
  person: "blue",
  organization: "green",
  location: "yellow",
  topic: "gray",
};

interface EntityBadgesProps {
  people?: string[];
  organizations?: string[];
  locations?: string[];
  topics?: string[];
}

export function EntityBadges({ people, organizations, locations, topics }: EntityBadgesProps) {
  const all: Array<{ label: string; variant: string }> = [];

  for (const p of people || []) all.push({ label: p, variant: TYPE_COLORS.person });
  for (const o of organizations || []) all.push({ label: o, variant: TYPE_COLORS.organization });
  for (const l of locations || []) all.push({ label: l, variant: TYPE_COLORS.location });
  for (const t of topics || []) all.push({ label: t, variant: TYPE_COLORS.topic });

  if (all.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {all.slice(0, 10).map((e, i) => (
        <Badge key={i} label={e.label} variant={e.variant} />
      ))}
      {all.length > 10 && (
        <span className="text-xs text-neutral-400">+{all.length - 10} more</span>
      )}
    </div>
  );
}
