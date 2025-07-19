
-- Crear tabla para las encuestas
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  participant_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para las preguntas de la encuesta
CREATE TABLE public.survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]'::jsonb,
  variable_name TEXT,
  order_number INTEGER NOT NULL,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para las respuestas de los estudiantes
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.survey_questions(id) ON DELETE CASCADE NOT NULL,
  participant_token TEXT NOT NULL,
  response_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para seguimiento de participantes
CREATE TABLE public.survey_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  participant_token TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(survey_id, participant_token)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para surveys (docentes solo ven las suyas)
CREATE POLICY "Users can view their own surveys" 
  ON public.surveys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own surveys" 
  ON public.surveys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys" 
  ON public.surveys FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas para survey_questions (docentes solo ven preguntas de sus encuestas)
CREATE POLICY "Users can view questions of their surveys" 
  ON public.survey_questions FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

CREATE POLICY "Users can create questions for their surveys" 
  ON public.survey_questions FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

CREATE POLICY "Users can update questions of their surveys" 
  ON public.survey_questions FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

-- Políticas para survey_responses (acceso público con token válido para insertar)
CREATE POLICY "Anyone can insert responses with valid token" 
  ON public.survey_responses FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE id = survey_id 
      AND participant_token = survey_responses.participant_token
      AND status = 'active'
    )
  );

CREATE POLICY "Survey owners can view all responses" 
  ON public.survey_responses FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

-- Políticas para survey_participants
CREATE POLICY "Anyone can create participant records with valid token" 
  ON public.survey_participants FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE id = survey_id 
      AND participant_token = survey_participants.participant_token
    )
  );

CREATE POLICY "Survey owners can view participants" 
  ON public.survey_participants FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

CREATE POLICY "Survey owners can update participants" 
  ON public.survey_participants FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM public.surveys WHERE id = survey_id));

-- Trigger para actualizar updated_at en surveys
CREATE TRIGGER update_surveys_updated_at 
  BEFORE UPDATE ON public.surveys 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar plantillas para el Acelerador 2
INSERT INTO public.templates (name, content) VALUES 
('acelerador_2_instrument_design', '{
  "title": "Plantilla 3: Diseño del Instrumento de Evaluación Diagnóstica",
  "description": "Configuración de la encuesta para estudiantes",
  "questions": [
    {
      "number": 1,
      "text": "¿En qué área(s) curricular(es) priorizará la educación en seguridad hídrica? (puede seleccionar más de una)",
      "type": "multiple_choice",
      "options": ["Ciencias Sociales", "Ciencia y Tecnología", "Comunicación", "Matemática", "Arte y Cultura", "Educación Física", "Educación Religiosa", "Educación para el Trabajo", "Tutoría"]
    },
    {
      "number": 2,
      "text": "¿Qué formato de encuesta prefiere para sus estudiantes?",
      "type": "single_choice",
      "options": ["Solo preguntas cerradas (opción múltiple)", "Preguntas cerradas con algunas abiertas", "Formato mixto equilibrado"]
    },
    {
      "number": 3,
      "text": "¿En qué momento del año escolar aplicará esta evaluación diagnóstica?",
      "type": "single_choice",
      "options": ["Inicio del año escolar", "Durante el primer bimestre", "Antes de iniciar unidades de seguridad hídrica", "Otro momento"]
    },
    {
      "number": 4,
      "text": "¿Cuánto tiempo máximo deberían tardar los estudiantes en completar la encuesta?",
      "type": "single_choice",
      "options": ["5-10 minutos", "10-15 minutos", "15-20 minutos", "20-25 minutos"]
    },
    {
      "number": 5,
      "text": "¿Con cuántos estudiantes planea aplicar la encuesta?",
      "type": "number",
      "placeholder": "Ingrese el número aproximado de estudiantes"
    },
    {
      "number": 6,
      "text": "¿Cómo convocará a los estudiantes para participar?",
      "type": "single_choice",
      "options": ["Durante clase presencial", "Tarea para completar en casa", "Actividad en sala de cómputo", "A través de WhatsApp/redes", "Otro método"]
    },
    {
      "number": 7,
      "text": "¿Requiere que las respuestas sean completamente anónimas?",
      "type": "single_choice",
      "options": ["Sí, completamente anónimas", "No, puedo identificar estudiantes", "Parcialmente (solo yo puedo identificar)"]
    },
    {
      "number": 8,
      "text": "¿Qué aspectos específicos quiere evaluar en sus estudiantes? (seleccione los más importantes)",
      "type": "multiple_choice",
      "options": ["Conocimientos sobre agua y saneamiento", "Prácticas de higiene personal", "Conciencia ambiental sobre el agua", "Comprensión de problemas hídricos locales", "Habilidades de investigación", "Capacidad de proponer soluciones", "Trabajo en equipo", "Pensamiento crítico"]
    },
    {
      "number": 9,
      "text": "¿Tiene alguna consideración especial o contexto particular de su institución que debería incluirse en la encuesta?",
      "type": "text",
      "placeholder": "Describa características especiales de su IE, estudiantes, o comunidad que sean relevantes"
    }
  ]
}'),
('acelerador_2_survey_structure', '{
  "title": "Plantilla 4: Estructura de Preguntas para Estudiantes",
  "description": "Formato estándar para definir preguntas de la encuesta",
  "schema": {
    "nro": "Número de pregunta",
    "pregunta": "Texto de la pregunta para el estudiante",
    "tipo": "multiple_choice | single_choice | text | scale | yes_no",
    "variable": "Nombre de la variable para análisis",
    "opciones": "Array de opciones (solo para preguntas cerradas)"
  },
  "example": [
    {
      "nro": 1,
      "pregunta": "¿Qué tan importante consideras el cuidado del agua en tu vida diaria?",
      "tipo": "scale",
      "variable": "importancia_agua",
      "opciones": ["Nada importante", "Poco importante", "Moderadamente importante", "Muy importante", "Extremadamente importante"]
    }
  ]
}'),
('acelerador_2_report_template', '{
  "title": "Plantilla 5: Estructura del Informe de Resultados",
  "description": "Template para generar el informe diagnóstico",
  "sections": [
    {
      "title": "Portada",
      "content": "Título, institución, docente, fecha, resumen ejecutivo"
    },
    {
      "title": "Metodología",
      "content": "Descripción del instrumento, muestra, proceso de aplicación"
    },
    {
      "title": "Resultados Descriptivos",
      "content": "Análisis de cada variable, gráficos, estadísticas básicas"
    },
    {
      "title": "Análisis de Brechas",
      "content": "Identificación de fortalezas y áreas de mejora por competencia"
    },
    {
      "title": "Perfiles de Estudiantes",
      "content": "Segmentación por nivel de competencias y características"
    },
    {
      "title": "Recomendaciones Pedagógicas",
      "content": "Estrategias específicas basadas en hallazgos, conexión con áreas curriculares"
    },
    {
      "title": "Anexos",
      "content": "Instrumento aplicado, datos adicionales, referencias"
    }
  ]
}');
