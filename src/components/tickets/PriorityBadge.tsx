import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDown, Minus, TrendingUp } from "lucide-react";

type TicketPriority = "low" | "medium" | "high" | "urgent";

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const variants: Record<TicketPriority, { label: string; className: string; icon: React.ReactNode }> = {
    low: {
      label: "Low",
      className: "bg-[hsl(var(--priority-low))] text-white hover:bg-[hsl(var(--priority-low))]",
      icon: <ArrowDown className="h-3 w-3" />,
    },
    medium: {
      label: "Medium",
      className: "bg-[hsl(var(--priority-medium))] text-white hover:bg-[hsl(var(--priority-medium))]",
      icon: <Minus className="h-3 w-3" />,
    },
    high: {
      label: "High",
      className: "bg-[hsl(var(--priority-high))] text-white hover:bg-[hsl(var(--priority-high))]",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    urgent: {
      label: "Urgent",
      className: "bg-[hsl(var(--priority-urgent))] text-white hover:bg-[hsl(var(--priority-urgent))]",
      icon: <AlertCircle className="h-3 w-3" />,
    },
  };

  const { label, className, icon } = variants[priority];

  return (
    <Badge className={`${className} gap-1`}>
      {icon}
      {label}
    </Badge>
  );
};
