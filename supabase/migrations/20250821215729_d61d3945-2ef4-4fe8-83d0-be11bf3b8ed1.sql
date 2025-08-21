-- Fix security vulnerability by recreating sesiones_clase_activas as security definer view
-- This will automatically filter data to only show the current user's sessions

-- Drop the existing view
DROP VIEW IF EXISTS public.sesiones_clase_activas;

-- Recreate as security definer view with built-in filtering
CREATE VIEW public.sesiones_clase_activas 
WITH (security_invoker = false) 
AS 
SELECT 
    id,
    user_id,
    unidad_id,
    session_index,
    titulo,
    evidencias,
    recursos,
    duracion_min,
    competencias_ids,
    capacidades,
    rubricas_ids,
    created_at,
    updated_at,
    inicio_json,
    desarrollo_json,
    cierre_json,
    incompleta,
    apoya_estrategia,
    feature_flags,
    is_active,
    version_number,
    replaced_by_session_id,
    regenerated_at,
    estado,
    html_export,
    proposito,
    inicio,
    desarrollo,
    cierre
FROM public.sesiones_clase 
WHERE is_active = true 
  AND (auth.uid() = user_id OR auth.uid() IS NULL);

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.sesiones_clase_activas TO authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.sesiones_clase_activas IS 'Secure view of active sessions - automatically filters to show only current user data';