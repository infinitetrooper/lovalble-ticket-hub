-- Create activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to activity logs
CREATE POLICY "Allow public read access to activity_log"
  ON public.activity_log
  FOR SELECT
  USING (true);

-- Allow public insert access to activity logs
CREATE POLICY "Allow public insert access to activity_log"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (true);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_log_ticket_id ON public.activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Update tickets table to allow public updates
DROP POLICY IF EXISTS "Allow public update access to tickets" ON public.tickets;
CREATE POLICY "Allow public update access to tickets"
  ON public.tickets
  FOR UPDATE
  USING (true);