-- Add new columns to rubricas_evaluacion for source tracking and review flags
ALTER TABLE public.rubricas_evaluacion 
ADD COLUMN IF NOT EXISTS source_hash TEXT,
ADD COLUMN IF NOT EXISTS source_snapshot JSONB,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;

-- Create index for efficient hash lookups
CREATE INDEX IF NOT EXISTS idx_rubricas_source_hash ON public.rubricas_evaluacion(source_hash);

-- Add function to calculate source hash
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
$$ LANGUAGE plpgsql SECURITY DEFINER;