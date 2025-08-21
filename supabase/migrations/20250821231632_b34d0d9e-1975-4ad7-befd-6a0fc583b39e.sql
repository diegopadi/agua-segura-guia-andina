-- ETAPA 3 V2 REDESIGN - FIXED MIGRATION
-- Step 1: Drop existing indexes that might conflict
DROP INDEX IF EXISTS public.idx_sesiones_clase_user_id;
DROP INDEX IF EXISTS public.idx_sesiones_clase_unidad_id;

-- Step 2: Rename existing tables to legacy (if not already done)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sesiones_clase') THEN
        ALTER TABLE public.sesiones_clase RENAME TO sesiones_clase_legacy;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'instrumentos_evaluacion') THEN
        ALTER TABLE public.instrumentos_evaluacion RENAME TO instrumentos_evaluacion_legacy;
    END IF;
END $$;

-- Step 3: Drop the active sessions view if exists
DROP VIEW IF EXISTS public.sesiones_clase_activas;

-- Step 4: Create new unidades_aprendizaje table (A6)
CREATE TABLE IF NOT EXISTS public.unidades_aprendizaje (
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

-- Step 5: Create new rubricas_evaluacion table (A7)
CREATE TABLE IF NOT EXISTS public.rubricas_evaluacion (
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

-- Step 6: Create new simplified sesiones_clase table (A8)
CREATE TABLE IF NOT EXISTS public.sesiones_clase (
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

-- Step 7: Enable RLS on all new tables
ALTER TABLE public.unidades_aprendizaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubricas_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_clase ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for unidades_aprendizaje
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'unidades_aprendizaje' AND policyname = 'Users can view their own unidades') THEN
        CREATE POLICY "Users can view their own unidades" ON public.unidades_aprendizaje FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'unidades_aprendizaje' AND policyname = 'Users can create their own unidades') THEN
        CREATE POLICY "Users can create their own unidades" ON public.unidades_aprendizaje FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'unidades_aprendizaje' AND policyname = 'Users can update their own unidades') THEN
        CREATE POLICY "Users can update their own unidades" ON public.unidades_aprendizaje FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'unidades_aprendizaje' AND policyname = 'Users can delete their own unidades') THEN
        CREATE POLICY "Users can delete their own unidades" ON public.unidades_aprendizaje FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 9: Create RLS policies for rubricas_evaluacion
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rubricas_evaluacion' AND policyname = 'Users can view their own rubricas') THEN
        CREATE POLICY "Users can view their own rubricas" ON public.rubricas_evaluacion FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rubricas_evaluacion' AND policyname = 'Users can create their own rubricas') THEN
        CREATE POLICY "Users can create their own rubricas" ON public.rubricas_evaluacion FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rubricas_evaluacion' AND policyname = 'Users can update their own rubricas') THEN
        CREATE POLICY "Users can update their own rubricas" ON public.rubricas_evaluacion FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rubricas_evaluacion' AND policyname = 'Users can delete their own rubricas') THEN
        CREATE POLICY "Users can delete their own rubricas" ON public.rubricas_evaluacion FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 10: Create RLS policies for sesiones_clase
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sesiones_clase' AND policyname = 'Users can view their own sesiones') THEN
        CREATE POLICY "Users can view their own sesiones" ON public.sesiones_clase FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sesiones_clase' AND policyname = 'Users can create their own sesiones') THEN
        CREATE POLICY "Users can create their own sesiones" ON public.sesiones_clase FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sesiones_clase' AND policyname = 'Users can update their own sesiones') THEN
        CREATE POLICY "Users can update their own sesiones" ON public.sesiones_clase FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sesiones_clase' AND policyname = 'Users can delete their own sesiones') THEN
        CREATE POLICY "Users can delete their own sesiones" ON public.sesiones_clase FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 11: Create updated_at triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_unidades_aprendizaje_updated_at') THEN
        CREATE TRIGGER update_unidades_aprendizaje_updated_at
            BEFORE UPDATE ON public.unidades_aprendizaje
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_rubricas_evaluacion_updated_at') THEN
        CREATE TRIGGER update_rubricas_evaluacion_updated_at
            BEFORE UPDATE ON public.rubricas_evaluacion
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_sesiones_clase_updated_at') THEN
        CREATE TRIGGER update_sesiones_clase_updated_at
            BEFORE UPDATE ON public.sesiones_clase
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Step 12: Add indexes for performance (with new names to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_unidades_user_id ON public.unidades_aprendizaje(user_id);
CREATE INDEX IF NOT EXISTS idx_unidades_estado ON public.unidades_aprendizaje(estado);
CREATE INDEX IF NOT EXISTS idx_rubricas_user_id ON public.rubricas_evaluacion(user_id);
CREATE INDEX IF NOT EXISTS idx_rubricas_unidad_id ON public.rubricas_evaluacion(unidad_id);
CREATE INDEX IF NOT EXISTS idx_new_sesiones_user_id ON public.sesiones_clase(user_id);
CREATE INDEX IF NOT EXISTS idx_new_sesiones_unidad_id ON public.sesiones_clase(unidad_id);