import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Lock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConversationTimelineProps {
  ticketId: string;
}

export const ConversationTimeline = ({ ticketId }: ConversationTimelineProps) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["conversations", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ message, isInternal }: { message: string; isInternal: boolean }) => {
      const { error } = await supabase
        .from("conversations")
        .insert({
          ticket_id: ticketId,
          sender_type: "agent",
          sender_name: "Support Agent",
          sender_email: "agent@support.com",
          message: message.trim(),
          is_internal_note: isInternal,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", ticketId] });
      setMessage("");
      setError(null);
      toast.success(isInternalNote ? "Internal note added" : "Reply sent");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      setError(errorMessage);
      toast.error("Failed to send", {
        description: errorMessage,
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setError(null);
    sendMutation.mutate({ message, isInternal: isInternalNote });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Messages Timeline */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading messages...</p>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender_type === "agent" && !msg.is_internal_note ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback
                    className={`text-xs ${
                      msg.sender_type === "customer"
                        ? "bg-primary text-primary-foreground"
                        : msg.is_internal_note
                        ? "bg-amber-500 text-white"
                        : "bg-secondary"
                    }`}
                  >
                    {getInitials(msg.sender_name)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 space-y-1 ${
                    msg.sender_type === "agent" && !msg.is_internal_note ? "text-right" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.sender_name}</span>
                    {msg.is_internal_note && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Lock className="h-3 w-3" />
                        Internal Note
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.sender_type === "customer"
                        ? "bg-muted"
                        : msg.is_internal_note
                        ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "PPp")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
          )}
        </div>

        {/* Reply Form */}
        <div className="space-y-3 pt-4 border-t">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder={isInternalNote ? "Add an internal note..." : "Type your reply..."}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            rows={3}
            className={isInternalNote ? "border-amber-300 dark:border-amber-700" : ""}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="internal-note"
                checked={isInternalNote}
                onCheckedChange={setIsInternalNote}
              />
              <Label htmlFor="internal-note" className="text-sm cursor-pointer">
                Internal note (not visible to customer)
              </Label>
            </div>

            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || !message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? "Sending..." : isInternalNote ? "Add Note" : "Send Reply"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
