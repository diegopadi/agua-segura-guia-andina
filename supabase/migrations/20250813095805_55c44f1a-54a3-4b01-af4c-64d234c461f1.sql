-- Remove the insecure public read policy
DROP POLICY IF EXISTS "Public can view active surveys with token" ON public.surveys;

-- Create a secure function to get public survey data
CREATE OR REPLACE FUNCTION public.get_public_survey_data(token_param text)
RETURNS TABLE(
  survey_id uuid,
  title text,
  description text,
  status text
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT 
    id,
    title,
    description,
    status
  FROM public.surveys 
  WHERE participant_token = token_param 
    AND status = 'active'
    AND participant_token IS NOT NULL;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_survey_data(text) TO anon;