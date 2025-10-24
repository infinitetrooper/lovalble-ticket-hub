import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { ChannelBadge } from "./ChannelBadge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  customer_name: string;
  customer_email: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  channel: "email" | "chat" | "phone" | "web" | "social";
  assignee: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

interface TicketTableProps {
  tickets: Ticket[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

export const TicketTable = ({ tickets, sortField, sortDirection, onSort }: TicketTableProps) => {
  const navigate = useNavigate();
  
  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-accent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[100px]">
              <SortButton field="ticket_number">#</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="subject">Subject</SortButton>
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="priority">Priority</SortButton>
            </TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>
              <SortButton field="created_at">Created</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow 
              key={ticket.id} 
              className="hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                #{ticket.ticket_number}
              </TableCell>
              <TableCell className="font-medium max-w-xs">
                <div className="truncate">{ticket.subject}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{ticket.customer_name}</span>
                  <span className="text-xs text-muted-foreground">{ticket.customer_email}</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell>
                <ChannelBadge channel={ticket.channel} />
              </TableCell>
              <TableCell>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ticket.assignee.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(ticket.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
