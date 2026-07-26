import type { BidStatus } from "@/db/schema";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  BidStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  ready: { label: "Ready", variant: "outline" },
  submitted: { label: "Submitted", variant: "default" },
  viewed: { label: "Viewed", variant: "success" },
  responded: { label: "Responded", variant: "success" },
  hired: { label: "Hired", variant: "success" },
  lost: { label: "Lost", variant: "destructive" },
  canceled: { label: "Canceled", variant: "secondary" },
  no_response: { label: "No Response", variant: "warning" },
};

export function StatusBadge({ status }: { status: BidStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function SourceBadge({
  name,
  color,
}: {
  name: string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color ?? "#22c55e" }}
    >
      {name}
    </span>
  );
}

export function PersonAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full" />
        ) : (
          initials
        )}
      </div>
      <span className="text-sm">{name}</span>
    </div>
  );
}
