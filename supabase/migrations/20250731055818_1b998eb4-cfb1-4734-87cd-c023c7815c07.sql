-- Fix security warning: Set search_path for all functions
CREATE OR REPLACE FUNCTION public.generate_unique_participant_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Generar un token único de 12 caracteres
    new_token := 'p_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unique_participants_count(survey_id_param UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COUNT(DISTINCT participant_token)::INTEGER
    FROM public.survey_responses
    WHERE survey_id = survey_id_param;
$$;

CREATE OR REPLACE FUNCTION public.sync_survey_participants(survey_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    synced_count INTEGER := 0;
    response_record RECORD;
BEGIN
    -- Insertar participantes únicos desde survey_responses que no estén en survey_participants
    FOR response_record IN
        SELECT DISTINCT 
            sr.participant_token,
            sr.survey_id,
            MIN(sr.submitted_at) as first_response,
            MAX(sr.submitted_at) as last_response
        FROM public.survey_responses sr
        WHERE sr.survey_id = survey_id_param
        AND NOT EXISTS (
            SELECT 1 FROM public.survey_participants sp 
            WHERE sp.participant_token = sr.participant_token 
            AND sp.survey_id = sr.survey_id
        )
        GROUP BY sr.participant_token, sr.survey_id
    LOOP
        INSERT INTO public.survey_participants (
            survey_id,
            participant_token,
            started_at,
            completed_at,
            status
        ) VALUES (
            response_record.survey_id,
            response_record.participant_token,
            response_record.first_response,
            response_record.last_response,
            'completed'
        );
        
        synced_count := synced_count + 1;
    END LOOP;
    
    RETURN synced_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_participant_completely(
    survey_id_param UUID,
    participant_token_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Eliminar respuestas
    DELETE FROM public.survey_responses 
    WHERE survey_id = survey_id_param 
    AND participant_token = participant_token_param;
    
    -- Eliminar registro de participante
    DELETE FROM public.survey_participants 
    WHERE survey_id = survey_id_param 
    AND participant_token = participant_token_param;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_unique_participant(survey_id_param UUID)
RETURNS TABLE(participant_id UUID, participant_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_participant_id UUID;
    new_token TEXT;
BEGIN
    -- Insertar nuevo participante (token se genera automáticamente)
    INSERT INTO public.survey_participants (survey_id, status, started_at)
    VALUES (survey_id_param, 'active', now())
    RETURNING id, participant_token INTO new_participant_id, new_token;
    
    RETURN QUERY SELECT new_participant_id, new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_survey_participants_count(survey_id_param UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COUNT(DISTINCT id)::INTEGER
    FROM public.survey_participants
    WHERE survey_id = survey_id_param;
$$;