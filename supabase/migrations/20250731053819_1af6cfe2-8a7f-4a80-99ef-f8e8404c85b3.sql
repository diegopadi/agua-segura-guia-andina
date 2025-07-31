-- Funciones corregidas para el sistema de encuestas

-- 1. Función para generar tokens únicos por participante
CREATE OR REPLACE FUNCTION public.generate_unique_participant_token()
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Generar un token único de 12 caracteres
    new_token := 'p_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para contar participantes únicos desde survey_responses
CREATE OR REPLACE FUNCTION public.get_unique_participants_count(survey_id_param UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(DISTINCT participant_token)::INTEGER
    FROM survey_responses
    WHERE survey_id = survey_id_param;
$$ LANGUAGE sql STABLE;

-- 3. Función para sincronizar survey_participants con survey_responses
CREATE OR REPLACE FUNCTION public.sync_survey_participants(survey_id_param UUID)
RETURNS INTEGER AS $$
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
        FROM survey_responses sr
        WHERE sr.survey_id = survey_id_param
        AND NOT EXISTS (
            SELECT 1 FROM survey_participants sp 
            WHERE sp.participant_token = sr.participant_token 
            AND sp.survey_id = sr.survey_id
        )
        GROUP BY sr.participant_token, sr.survey_id
    LOOP
        INSERT INTO survey_participants (
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
$$ LANGUAGE plpgsql;

-- 4. Función para eliminar completamente un participante
CREATE OR REPLACE FUNCTION public.delete_participant_completely(
    survey_id_param UUID,
    participant_token_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Eliminar respuestas
    DELETE FROM survey_responses 
    WHERE survey_id = survey_id_param 
    AND participant_token = participant_token_param;
    
    -- Eliminar registro de participante
    DELETE FROM survey_participants 
    WHERE survey_id = survey_id_param 
    AND participant_token = participant_token_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;