-- Fix security issue: Recreate view with SECURITY INVOKER
DROP VIEW public.sesiones_clase_activas;

CREATE VIEW public.sesiones_clase_activas 
WITH (security_invoker=on)
AS
SELECT *
FROM public.sesiones_clase
WHERE is_active = true;