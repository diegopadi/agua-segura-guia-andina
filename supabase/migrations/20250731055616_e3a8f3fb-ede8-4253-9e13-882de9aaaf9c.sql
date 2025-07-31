-- Fase 1: Refactorización completa del schema para encuestas

-- 1. Agregar columna participant_id (FK) en survey_responses
ALTER TABLE survey_responses 
ADD COLUMN participant_id UUID REFERENCES survey_participants(id) ON DELETE CASCADE;

-- 2. Configurar DEFAULT en survey_participants.participant_token
ALTER TABLE survey_participants 
ALTER COLUMN participant_token SET DEFAULT generate_unique_participant_token();

-- 3. Crear índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_participants_unique_token 
ON survey_participants (survey_id, participant_token);

-- 4. Función RPC para crear participante con token único
CREATE OR REPLACE FUNCTION public.create_unique_participant(survey_id_param UUID)
RETURNS TABLE(participant_id UUID, participant_token TEXT) AS $$
DECLARE
    new_participant_id UUID;
    new_token TEXT;
BEGIN
    -- Insertar nuevo participante (token se genera automáticamente)
    INSERT INTO survey_participants (survey_id, status, started_at)
    VALUES (survey_id_param, 'active', now())
    RETURNING id, participant_token INTO new_participant_id, new_token;
    
    RETURN QUERY SELECT new_participant_id, new_token;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para contar participantes desde survey_participants (no survey_responses)
CREATE OR REPLACE FUNCTION public.get_survey_participants_count(survey_id_param UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(DISTINCT id)::INTEGER
    FROM survey_participants
    WHERE survey_id = survey_id_param;
$$ LANGUAGE sql STABLE;

-- 6. Migración de datos existentes: crear participante consolidado por survey
INSERT INTO survey_participants (survey_id, participant_token, started_at, completed_at, status)
SELECT DISTINCT 
    sr.survey_id,
    'legacy_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) as participant_token,
    MIN(sr.submitted_at) as started_at,
    MAX(sr.submitted_at) as completed_at,
    'completed' as status
FROM survey_responses sr
WHERE NOT EXISTS (
    SELECT 1 FROM survey_participants sp 
    WHERE sp.survey_id = sr.survey_id
)
GROUP BY sr.survey_id;

-- 7. Actualizar survey_responses existentes con participant_id
UPDATE survey_responses 
SET participant_id = (
    SELECT sp.id 
    FROM survey_participants sp 
    WHERE sp.survey_id = survey_responses.survey_id 
    AND sp.participant_token LIKE 'legacy_%'
    LIMIT 1
)
WHERE participant_id IS NULL;