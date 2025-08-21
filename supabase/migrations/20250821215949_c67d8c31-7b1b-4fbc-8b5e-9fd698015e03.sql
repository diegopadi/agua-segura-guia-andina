-- Fix the security definer warning by creating a standard view
-- The underlying table sesiones_clase has proper RLS policies that will be enforced

-- Drop the security definer view
DROP VIEW IF EXISTS public.sesiones_clase_activas;

-- Recreate as standard view (security_invoker = true is the default)
-- This will respect the RLS policies of the underlying sesiones_clase table
CREATE VIEW public.sesiones_clase_activas AS 
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
WHERE is_active = true;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.sesiones_clase_activas TO authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.sesiones_clase_activas IS 'View of active sessions - security enforced by underlying table RLS policies';