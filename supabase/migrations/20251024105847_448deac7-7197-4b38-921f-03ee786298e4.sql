-- Create conversations table for ticket messages
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to conversations" 
ON public.conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_conversations_ticket_id ON public.conversations(ticket_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);