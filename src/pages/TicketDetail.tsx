import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Mail, Tag, Package, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { ChannelBadge } from "@/components/tickets/ChannelBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ConversationTimeline } from "@/components/tickets/ConversationTimeline";
import { TagsInput } from "@/components/tickets/TagsInput";

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          assignee:assignees!tickets_assignee_id_fkey(id, name, email, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: assignees } = useQuery({
    queryKey: ["assignees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignees")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: activityLog } = useQuery({
    queryKey: ["activity-log", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ field, value, oldValue }: { field: string; value: any; oldValue: any }) => {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ [field]: value })
        .eq("id", id);

      if (updateError) throw updateError;

      // Log the activity
      const fieldNames: Record<string, string> = {
        subject: "Subject",
        status: "Status",
        priority: "Priority",
        assignee_id: "Assignee",
        description: "Description",
        tags: "Tags",
      };

      let displayOldValue = oldValue;
      let displayNewValue = value;

      if (field === "assignee_id") {
        const oldAssignee = assignees?.find((a) => a.id === oldValue);
        const newAssignee = assignees?.find((a) => a.id === value);
        displayOldValue = oldAssignee?.name || "Unassigned";
        displayNewValue = newAssignee?.name || "Unassigned";
      } else if (field === "tags") {
        displayOldValue = Array.isArray(oldValue) ? oldValue.join(", ") : "";
        displayNewValue = Array.isArray(value) ? value.join(", ") : "";
      }

      const { error: logError } = await supabase
        .from("activity_log")
        .insert({
          ticket_id: id,
          action: "updated",
          field_name: fieldNames[field] || field,
          old_value: displayOldValue?.toString() || "",
          new_value: displayNewValue?.toString() || "",
        });

      if (logError) throw logError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["activity-log", id] });
      setEditingField(null);
      toast.success("Ticket updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update ticket", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket not found</h2>
          <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground font-mono">#{ticket.ticket_number}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <ChannelBadge channel={ticket.channel} />
            </div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation Timeline */}
            <ConversationTimeline ticketId={id!} />

            {/* Editable Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  {editingField === "subject" ? (
                    <div className="flex gap-2">
                      <Input
                        defaultValue={ticket.subject}
                        onBlur={(e) => {
                          if (e.target.value !== ticket.subject) {
                            updateMutation.mutate({
                              field: "subject",
                              value: e.target.value,
                              oldValue: ticket.subject,
                            });
                          } else {
                            setEditingField(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                          if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className="p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => setEditingField("subject")}
                    >
                      {ticket.subject}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => {
                      updateMutation.mutate({
                        field: "status",
                        value,
                        oldValue: ticket.status,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => {
                      updateMutation.mutate({
                        field: "priority",
                        value,
                        oldValue: ticket.priority,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignee</label>
                  <Select
                    value={ticket.assignee_id || "unassigned"}
                    onValueChange={(value) => {
                      updateMutation.mutate({
                        field: "assignee_id",
                        value: value === "unassigned" ? null : value,
                        oldValue: ticket.assignee_id,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {assignees?.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          {assignee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  {editingField === "description" ? (
                    <Textarea
                      defaultValue={ticket.description || ""}
                      onBlur={(e) => {
                        if (e.target.value !== ticket.description) {
                          updateMutation.mutate({
                            field: "description",
                            value: e.target.value || null,
                            oldValue: ticket.description,
                          });
                        } else {
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      rows={5}
                    />
                  ) : (
                    <div
                      className="p-2 rounded-md hover:bg-muted cursor-pointer min-h-[100px]"
                      onClick={() => setEditingField("description")}
                    >
                      {ticket.description || (
                        <span className="text-muted-foreground italic">Click to add description</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{ticket.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm">{format(new Date(ticket.created_at), "PPp")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm">{format(new Date(ticket.updated_at), "PPp")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            {ticket.order_number && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Order Number</p>
                      <p className="text-sm font-mono">{ticket.order_number}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <TagsInput
                  value={ticket.tags || []}
                  onChange={(tags) => {
                    updateMutation.mutate({
                      field: "tags",
                      value: tags,
                      oldValue: ticket.tags || [],
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog && activityLog.length > 0 ? (
                    activityLog.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-muted">
                            {getInitials(log.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{log.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.action} {log.field_name}
                            {log.old_value && log.new_value && (
                              <>
                                {" "}
                                from <span className="font-medium text-foreground">{log.old_value}</span> to{" "}
                                <span className="font-medium text-foreground">{log.new_value}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
