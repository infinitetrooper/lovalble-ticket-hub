-- Add active status to assignees table
ALTER TABLE public.assignees ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Add ticket_count computed column via a view would be inefficient, we'll calculate in the query

-- Update RLS policies for assignees to allow INSERT and UPDATE
CREATE POLICY "Allow public insert access to assignees"
ON public.assignees
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to assignees"
ON public.assignees
FOR UPDATE
USING (true);

-- Create index for better performance when counting tickets
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON public.tickets(assignee_id);