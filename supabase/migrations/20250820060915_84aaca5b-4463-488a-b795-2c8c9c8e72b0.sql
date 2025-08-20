-- Crear tabla sesiones_clase para el Acelerador 6
CREATE TABLE public.sesiones_clase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  unidad_id UUID,
  session_index INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  proposito TEXT NOT NULL,
  inicio TEXT NOT NULL,
  desarrollo TEXT NOT NULL,
  cierre TEXT NOT NULL,
  evidencias JSONB DEFAULT '[]'::jsonb,
  recursos JSONB DEFAULT '[]'::jsonb,
  duracion_min INTEGER NOT NULL DEFAULT 45,
  competencias_ids JSONB DEFAULT '[]'::jsonb,
  capacidades JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'BORRADOR'::text,
  html_export TEXT,
  rubricas_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla instrumentos_evaluacion para las 3 rúbricas por sesión
CREATE TABLE public.instrumentos_evaluacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pedagogica', 'satisfaccion_estudiante', 'autoevaluacion_docente')),
  estructura_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_nombre TEXT,
  html_contenido TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sesiones_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrumentos_evaluacion ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sesiones_clase
CREATE POLICY "Users can view their own sesiones"
ON public.sesiones_clase FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sesiones"
ON public.sesiones_clase FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sesiones"
ON public.sesiones_clase FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sesiones"
ON public.sesiones_clase FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para instrumentos_evaluacion
CREATE POLICY "Users can view instrumentos of their sesiones"
ON public.instrumentos_evaluacion FOR SELECT
USING (sesion_id IN (SELECT id FROM public.sesiones_clase WHERE user_id = auth.uid()));

CREATE POLICY "Users can create instrumentos for their sesiones"
ON public.instrumentos_evaluacion FOR INSERT
WITH CHECK (sesion_id IN (SELECT id FROM public.sesiones_clase WHERE user_id = auth.uid()));

CREATE POLICY "Users can update instrumentos of their sesiones"
ON public.instrumentos_evaluacion FOR UPDATE
USING (sesion_id IN (SELECT id FROM public.sesiones_clase WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete instrumentos of their sesiones"
ON public.instrumentos_evaluacion FOR DELETE
USING (sesion_id IN (SELECT id FROM public.sesiones_clase WHERE user_id = auth.uid()));

-- Índices para mejor rendimiento
CREATE INDEX idx_sesiones_clase_user_id ON public.sesiones_clase(user_id);
CREATE INDEX idx_sesiones_clase_unidad_id ON public.sesiones_clase(unidad_id);
CREATE INDEX idx_instrumentos_evaluacion_sesion_id ON public.instrumentos_evaluacion(sesion_id);

-- Trigger para updated_at
CREATE TRIGGER update_sesiones_clase_updated_at
BEFORE UPDATE ON public.sesiones_clase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instrumentos_evaluacion_updated_at
BEFORE UPDATE ON public.instrumentos_evaluacion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();