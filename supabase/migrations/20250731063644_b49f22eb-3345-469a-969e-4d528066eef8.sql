-- Fix RLS policy for survey_participants to allow anonymous users to create participants
-- for active surveys without token matching requirement

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Anyone can create participant records with valid token" ON public.survey_participants;

-- Create a new policy that allows creating participants for active surveys
CREATE POLICY "Anyone can create participants for active surveys" 
ON public.survey_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.surveys 
    WHERE surveys.id = survey_participants.survey_id 
    AND surveys.status = 'active'
  )
);