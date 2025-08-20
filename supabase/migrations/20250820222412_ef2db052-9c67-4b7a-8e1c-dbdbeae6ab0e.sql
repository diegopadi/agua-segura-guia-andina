-- FASE 1: Migración Crítica - Versionado Seguro A6
-- Agregar columnas de versionado a sesiones_clase
ALTER TABLE public.sesiones_clase 
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN version_number INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN replaced_by_session_id UUID REFERENCES public.sesiones_clase(id) DEFERRABLE INITIALLY DEFERRED,
ADD COLUMN regenerated_at TIMESTAMP WITH TIME ZONE;

-- Índice único parcial: solo 1 sesión activa por session_index+unidad
CREATE UNIQUE INDEX uniq_active_session 
ON public.sesiones_clase(unidad_id, session_index) 
WHERE is_active = true;

-- Índices para optimización
CREATE INDEX idx_sesiones_active ON public.sesiones_clase(unidad_id, user_id, is_active);
CREATE INDEX idx_sesiones_version ON public.sesiones_clase(session_index, version_number);

-- Función extendida check_a7_data_exists con detalles
CREATE OR REPLACE FUNCTION public.check_a7_data_exists(unidad_id_param UUID, user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    result JSON;
    rubrica_count INTEGER;
    instrumento_count INTEGER;
    sesion_count INTEGER;
BEGIN
    -- Contar sesiones activas
    SELECT COUNT(*) INTO sesion_count
    FROM public.sesiones_clase sc
    WHERE sc.unidad_id = unidad_id_param 
    AND sc.user_id = user_id_param
    AND sc.is_active = true;
    
    -- Contar instrumentos de evaluación vinculados
    SELECT COUNT(*) INTO instrumento_count
    FROM public.instrumentos_evaluacion ie
    JOIN public.sesiones_clase sc ON ie.sesion_id = sc.id
    WHERE sc.unidad_id = unidad_id_param 
    AND sc.user_id = user_id_param
    AND sc.is_active = true;
    
    -- Contar rúbricas (asumiendo que las rubricas_ids están en sesiones_clase)
    SELECT COUNT(*) INTO rubrica_count
    FROM public.sesiones_clase sc
    WHERE sc.unidad_id = unidad_id_param 
    AND sc.user_id = user_id_param
    AND sc.is_active = true
    AND jsonb_array_length(COALESCE(sc.rubricas_ids, '[]'::jsonb)) > 0;
    
    result := json_build_object(
        'has_a7_data', (instrumento_count > 0 OR rubrica_count > 0),
        'sesion_count', sesion_count,
        'instrumento_count', instrumento_count,
        'rubrica_count', rubrica_count,
        'warning_level', CASE 
            WHEN instrumento_count > 0 THEN 'critical'
            WHEN rubrica_count > 0 THEN 'high'
            ELSE 'none'
        END
    );
    
    RETURN result;
END;
$$;

-- Vista optimizada para consultas A7/A8
CREATE VIEW public.sesiones_clase_activas AS
SELECT *
FROM public.sesiones_clase
WHERE is_active = true;

-- Función advisory lock para control de concurrencia por unidad
CREATE OR REPLACE FUNCTION public.acquire_unit_lock(unidad_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    lock_key BIGINT;
BEGIN
    -- Convertir UUID a BIGINT para pg_advisory_lock
    lock_key := ('x' || substring(unidad_id_param::text from 1 for 16))::bit(64)::bigint;
    
    -- Intentar obtener lock (no bloquear si no está disponible)
    RETURN pg_try_advisory_lock(lock_key);
END;
$$;

-- Función para liberar advisory lock
CREATE OR REPLACE FUNCTION public.release_unit_lock(unidad_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    lock_key BIGINT;
BEGIN
    lock_key := ('x' || substring(unidad_id_param::text from 1 for 16))::bit(64)::bigint;
    RETURN pg_advisory_unlock(lock_key);
END;
$$;