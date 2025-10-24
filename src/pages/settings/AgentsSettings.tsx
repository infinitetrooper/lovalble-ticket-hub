import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil } from "lucide-react";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  ticket_count: number;
}

const AgentsSettings = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      email: "",
      avatar_url: "",
      active: true,
    },
  });

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data: assignees, error: assigneesError } = await supabase
        .from("assignees")
        .select("*")
        .order("name");

      if (assigneesError) throw assigneesError;

      const agentsWithCount = await Promise.all(
        assignees.map(async (assignee) => {
          const { count } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("assignee_id", assignee.id);

          return {
            ...assignee,
            ticket_count: count || 0,
          };
        })
      );

      return agentsWithCount as Agent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const { error } = await supabase.from("assignees").insert({
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url || null,
        active: data.active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agent created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AgentFormData }) => {
      const { error } = await supabase
        .from("assignees")
        .update({
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url || null,
          active: data.active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agent updated successfully" });
      setIsDialogOpen(false);
      setEditingAgent(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("assignees")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agent status updated" });
    },
    onError: (error) => {
      toast({
        title: "Error updating agent status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgentFormData) => {
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    form.reset({
      name: agent.name,
      email: agent.email,
      avatar_url: agent.avatar_url || "",
      active: agent.active,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAgent(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Agents</h2>
          <p className="text-muted-foreground">Manage your support agents</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Agent can be assigned to tickets
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAgent ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>
                    <Switch
                      checked={agent.active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: agent.id, active: checked })
                      }
                      disabled={toggleActiveMutation.isPending}
                    />
                  </TableCell>
                  <TableCell>{agent.ticket_count}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(agent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AgentsSettings;
