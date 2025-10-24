import { Badge } from "@/components/ui/badge";

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

interface StatusBadgeProps {
  status: TicketStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants: Record<TicketStatus, { label: string; className: string }> = {
    open: {
      label: "Open",
      className: "bg-[hsl(var(--status-open))] text-white hover:bg-[hsl(var(--status-open))]",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-[hsl(var(--status-in-progress))] text-white hover:bg-[hsl(var(--status-in-progress))]",
    },
    waiting: {
      label: "Waiting",
      className: "bg-[hsl(var(--status-waiting))] text-white hover:bg-[hsl(var(--status-waiting))]",
    },
    resolved: {
      label: "Resolved",
      className: "bg-[hsl(var(--status-resolved))] text-white hover:bg-[hsl(var(--status-resolved))]",
    },
    closed: {
      label: "Closed",
      className: "bg-[hsl(var(--status-closed))] text-white hover:bg-[hsl(var(--status-closed))]",
    },
  };

  const { label, className } = variants[status];

  return <Badge className={className}>{label}</Badge>;
};
