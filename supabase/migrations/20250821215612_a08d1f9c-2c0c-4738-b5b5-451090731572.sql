-- Fix security vulnerability: Add RLS policies to sesiones_clase_activas view
-- This view currently has no RLS policies and exposes all user session data

-- Enable RLS on the view
ALTER TABLE public.sesiones_clase_activas ENABLE ROW LEVEL SECURITY;

-- Add RLS policy to restrict access to only the session owner's data
-- This matches the policy on the underlying sesiones_clase table
CREATE POLICY "Users can view their own active sesiones" 
ON public.sesiones_clase_activas 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Since this is a view, we only need SELECT policy
-- INSERT, UPDATE, DELETE operations should be done on the underlying table