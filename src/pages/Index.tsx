import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TicketFilters, FilterState } from "@/components/tickets/TicketFilters";
import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketTableSkeleton } from "@/components/tickets/TicketTableSkeleton";
import { TicketPagination } from "@/components/tickets/TicketPagination";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";
import { AlertCircle, Ticket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    priority: "all",
    channel: "all",
    assignee: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets", filters, currentPage, pageSize, sortField, sortDirection],
    queryFn: async () => {
      // Type assertion needed until Supabase types are regenerated
      let query = (supabase as any)
        .from("tickets")
        .select(
          `
          *,
          assignee:assignees!tickets_assignee_id_fkey(name, email, avatar_url)
        `,
          { count: "exact" }
        );

      // Apply filters
      if (filters.search) {
        query = query.or(
          `subject.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
        );
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }
      if (filters.channel !== "all") {
        query = query.eq("channel", filters.channel);
      }
      if (filters.assignee !== "all") {
        if (filters.assignee === "unassigned") {
          query = query.is("assignee_id", null);
        }
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        tickets: data || [],
        count: count || 0,
      };
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Ticket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
              <p className="text-muted-foreground">Manage and track customer support tickets</p>
            </div>
          </div>
          <NewTicketForm />
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-6">
          <TicketFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading tickets</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load tickets. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <TicketTableSkeleton />
          ) : data && data.tickets.length > 0 ? (
            <>
              <TicketTable
                tickets={data.tickets}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TicketPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={data.count}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-sm text-muted-foreground">
                {filters.search || filters.status !== "all" || filters.priority !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "There are no tickets in the system yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
