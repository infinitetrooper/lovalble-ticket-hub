-- Create enum types for ticket properties
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_channel AS ENUM ('email', 'chat', 'phone', 'web', 'social');

-- Create assignees table
CREATE TABLE public.assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  channel ticket_channel NOT NULL DEFAULT 'email',
  assignee_id UUID REFERENCES public.assignees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (suitable for internal tools)
CREATE POLICY "Allow public read access to assignees"
  ON public.assignees FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tickets"
  ON public.tickets FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_channel ON public.tickets(channel);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample assignees
INSERT INTO public.assignees (name, email, avatar_url) VALUES
  ('Sarah Johnson', 'sarah.johnson@company.com', null),
  ('Mike Chen', 'mike.chen@company.com', null),
  ('Emily Rodriguez', 'emily.rodriguez@company.com', null);

-- Insert sample tickets with proper enum casting
INSERT INTO public.tickets (subject, customer_name, customer_email, status, priority, channel, assignee_id) 
VALUES
  ('Login issues after password reset', 'John Doe', 'john.doe@example.com', 'open'::ticket_status, 'high'::ticket_priority, 'email'::ticket_channel, (SELECT id FROM public.assignees WHERE email = 'sarah.johnson@company.com')),
  ('Feature request: Dark mode', 'Jane Smith', 'jane.smith@example.com', 'in_progress'::ticket_status, 'medium'::ticket_priority, 'web'::ticket_channel, (SELECT id FROM public.assignees WHERE email = 'mike.chen@company.com')),
  ('Billing inquiry about recent charge', 'Robert Brown', 'robert.brown@example.com', 'waiting'::ticket_status, 'low'::ticket_priority, 'chat'::ticket_channel, (SELECT id FROM public.assignees WHERE email = 'emily.rodriguez@company.com')),
  ('Unable to export data', 'Lisa Anderson', 'lisa.anderson@example.com', 'resolved'::ticket_status, 'urgent'::ticket_priority, 'phone'::ticket_channel, (SELECT id FROM public.assignees WHERE email = 'sarah.johnson@company.com')),
  ('Integration not working', 'Michael Wilson', 'michael.wilson@example.com', 'open'::ticket_status, 'high'::ticket_priority, 'email'::ticket_channel, null);