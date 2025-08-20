-- Phase 1: Database Migration - Add new jsonb columns without breaking existing functionality

-- Add new jsonb columns for structured session blocks
ALTER TABLE public.sesiones_clase 
ADD COLUMN inicio_json jsonb,
ADD COLUMN desarrollo_json jsonb,
ADD COLUMN cierre_json jsonb,
ADD COLUMN incompleta boolean DEFAULT false,
ADD COLUMN apoya_estrategia jsonb DEFAULT '{"inicio": false, "desarrollo": false, "cierre": false}'::jsonb;

-- Backfill existing text data to new jsonb structure with heuristic timeboxes
UPDATE public.sesiones_clase 
SET 
  inicio_json = jsonb_build_object(
    'timebox_min', 10,
    'steps', CASE 
      WHEN inicio IS NOT NULL AND trim(inicio) != '' 
      THEN array[trim(inicio)]
      ELSE array['Actividad de inicio por definir']
    END,
    'apoya_estrategia', false
  ),
  desarrollo_json = jsonb_build_object(
    'timebox_min', GREATEST(duracion_min - 15, 25),
    'steps', CASE 
      WHEN desarrollo IS NOT NULL AND trim(desarrollo) != '' 
      THEN array[trim(desarrollo)]
      ELSE array['Actividad de desarrollo por definir']
    END,
    'apoya_estrategia', false
  ),
  cierre_json = jsonb_build_object(
    'timebox_min', 5,
    'steps', CASE 
      WHEN cierre IS NOT NULL AND trim(cierre) != '' 
      THEN array[trim(cierre)]
      ELSE array['Actividad de cierre por definir']
    END,
    'apoya_estrategia', false
  )
WHERE inicio_json IS NULL;

-- Create indexes for better performance on jsonb queries
CREATE INDEX IF NOT EXISTS idx_sesiones_clase_inicio_json ON public.sesiones_clase USING GIN (inicio_json);
CREATE INDEX IF NOT EXISTS idx_sesiones_clase_desarrollo_json ON public.sesiones_clase USING GIN (desarrollo_json);
CREATE INDEX IF NOT EXISTS idx_sesiones_clase_cierre_json ON public.sesiones_clase USING GIN (cierre_json);

-- Add feature flag column for gradual rollout
ALTER TABLE public.sesiones_clase 
ADD COLUMN feature_flags jsonb DEFAULT '{"a6_json_blocks_v1": false}'::jsonb;