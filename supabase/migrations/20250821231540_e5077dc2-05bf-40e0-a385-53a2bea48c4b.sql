-- ETAPA 3 V2 REDESIGN - COMPLETE MIGRATION
-- Step 1: Rename existing tables to legacy
ALTER TABLE public.sesiones_clase RENAME TO sesiones_clase_legacy;
ALTER TABLE public.instrumentos_evaluacion RENAME TO instrumentos_evaluacion_legacy;

-- Step 2: Drop the active sessions view since we're changing the structure
DROP VIEW IF EXISTS public.sesiones_clase_activas;

-- Step 3: Create new unidades_aprendizaje table (A6)
CREATE TABLE public.unidades_aprendizaje (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    
    -- Basic unit information
    titulo text NOT NULL,
    area_curricular text NOT NULL,
    grado text NOT NULL,
    numero_sesiones integer NOT NULL CHECK (numero_sesiones >= 1 AND numero_sesiones <= 12),
    duracion_min integer NOT NULL CHECK (duracion_min >= 30 AND duracion_min <= 120),
    proposito text NOT NULL,
    
    -- Separate fields as requested
    competencias_ids text[] CHECK (array_length(competencias_ids, 1) <= 2),
    capacidades jsonb DEFAULT '[]'::jsonb,
    evidencias text NOT NULL,
    estandares jsonb DEFAULT '[]'::jsonb,
    desempenos jsonb DEFAULT '[]'::jsonb,
    
    -- Optional fields
    estrategias_ids text[] DEFAULT '{}',
    enfoques_ids text[] DEFAULT '{}',
    
    -- Diagnosis and AI analysis
    diagnostico_pdf_url text,
    diagnostico_text text,
    ia_recomendaciones text,
    
    -- State and control
    estado text NOT NULL CHECK (estado IN ('BORRADOR', 'CERRADO')) DEFAULT 'BORRADOR',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone
);

-- Step 4: Create new rubricas_evaluacion table (A7)
CREATE TABLE public.rubricas_evaluacion (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    unidad_id uuid NOT NULL REFERENCES public.unidades_aprendizaje(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    
    -- Rubric structure (flexible JSON)
    estructura jsonb NOT NULL DEFAULT '{"levels": ["Inicio", "Proceso", "Logro"], "criteria": []}'::jsonb,
    
    -- State and control
    estado text NOT NULL CHECK (estado IN ('BORRADOR', 'CERRADO')) DEFAULT 'BORRADOR',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone
);

-- Step 5: Create new simplified sesiones_clase table (A8)
CREATE TABLE public.sesiones_clase (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    unidad_id uuid NOT NULL REFERENCES public.unidades_aprendizaje(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    
    -- Session basic info
    session_index integer NOT NULL,
    titulo text NOT NULL,
    
    -- Session content (AI suggestions, editable)
    inicio text,
    desarrollo text,
    cierre text,
    
    -- Session specific data
    evidencias text[] DEFAULT '{}',
    rubrica_json jsonb DEFAULT '{"criteria": []}'::jsonb,
    
    -- State and control
    estado text NOT NULL CHECK (estado IN ('BORRADOR', 'CERRADO')) DEFAULT 'BORRADOR',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone,
    
    -- Ensure unique session index per unit
    UNIQUE(unidad_id, session_index)
);

-- Step 6: Enable RLS on all new tables
ALTER TABLE public.unidades_aprendizaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubricas_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_clase ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for unidades_aprendizaje
CREATE POLICY "Users can view their own unidades" ON public.unidades_aprendizaje
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unidades" ON public.unidades_aprendizaje
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unidades" ON public.unidades_aprendizaje
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unidades" ON public.unidades_aprendizaje
    FOR DELETE USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for rubricas_evaluacion
CREATE POLICY "Users can view their own rubricas" ON public.rubricas_evaluacion
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rubricas" ON public.rubricas_evaluacion
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rubricas" ON public.rubricas_evaluacion
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rubricas" ON public.rubricas_evaluacion
    FOR DELETE USING (auth.uid() = user_id);

-- Step 9: Create RLS policies for sesiones_clase
CREATE POLICY "Users can view their own sesiones" ON public.sesiones_clase
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sesiones" ON public.sesiones_clase
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sesiones" ON public.sesiones_clase
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sesiones" ON public.sesiones_clase
    FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create updated_at triggers
CREATE TRIGGER update_unidades_aprendizaje_updated_at
    BEFORE UPDATE ON public.unidades_aprendizaje
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rubricas_evaluacion_updated_at
    BEFORE UPDATE ON public.rubricas_evaluacion
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sesiones_clase_updated_at
    BEFORE UPDATE ON public.sesiones_clase
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 11: Add indexes for performance
CREATE INDEX idx_unidades_aprendizaje_user_id ON public.unidades_aprendizaje(user_id);
CREATE INDEX idx_unidades_aprendizaje_estado ON public.unidades_aprendizaje(estado);
CREATE INDEX idx_rubricas_evaluacion_user_id ON public.rubricas_evaluacion(user_id);
CREATE INDEX idx_rubricas_evaluacion_unidad_id ON public.rubricas_evaluacion(unidad_id);
CREATE INDEX idx_sesiones_clase_user_id ON public.sesiones_clase(user_id);
CREATE INDEX idx_sesiones_clase_unidad_id ON public.sesiones_clase(unidad_id);