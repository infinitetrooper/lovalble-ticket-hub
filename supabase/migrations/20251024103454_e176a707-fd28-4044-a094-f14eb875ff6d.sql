-- Add missing columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS order_number text;

-- Add RLS policy to allow public insert access to tickets
CREATE POLICY "Allow public insert access to tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (true);