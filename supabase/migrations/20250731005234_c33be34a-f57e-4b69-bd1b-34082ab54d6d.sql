-- Update RLS policy for survey_participants to allow creation with survey token
DROP POLICY IF EXISTS "Anyone can create participant records with valid token" ON public.survey_participants;

CREATE POLICY "Anyone can create participant records with valid token" 
ON public.survey_participants 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM surveys 
  WHERE surveys.id = survey_participants.survey_id 
  AND surveys.participant_token = survey_participants.participant_token 
  AND surveys.status = 'active'
));