-- Fix malformed unidad_id in existing session
UPDATE acelerador_sessions 
SET session_data = jsonb_set(
  session_data, 
  '{unidadData,unidad_id}', 
  to_jsonb(gen_random_uuid()::text)
)
WHERE id = '646180c3-2842-43da-a24d-513ece9d4fcf'
  AND session_data->'unidadData'->>'unidad_id' LIKE '%unidad_%_%';

-- Clean up any existing sessions with malformed UUIDs (cast to text first)
DELETE FROM sesiones_clase 
WHERE unidad_id::text ~ '^unidad_.*_[0-9]+$';