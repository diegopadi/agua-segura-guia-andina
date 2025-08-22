-- Fix security warning by setting immutable search_path for the function
DROP FUNCTION IF EXISTS public.calculate_unidad_hash(jsonb);

CREATE OR REPLACE FUNCTION public.calculate_unidad_hash(unidad_data JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            jsonb_build_object(
                'titulo', unidad_data->>'titulo',
                'area_curricular', unidad_data->>'area_curricular', 
                'grado', unidad_data->>'grado',
                'numero_sesiones', unidad_data->>'numero_sesiones',
                'duracion_min', unidad_data->>'duracion_min',
                'proposito', unidad_data->>'proposito',
                'evidencias', unidad_data->>'evidencias',
                'competencias_ids', unidad_data->'competencias_ids'
            )::text,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';