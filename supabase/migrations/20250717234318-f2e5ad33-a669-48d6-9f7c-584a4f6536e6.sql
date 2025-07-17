-- Create templates table for storing accelerator templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates are read-only for all authenticated users
CREATE POLICY "Templates are viewable by authenticated users" 
ON public.templates 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create acelerador_sessions table for tracking user progress
CREATE TABLE public.acelerador_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  acelerador_number INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  session_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, acelerador_number)
);

-- Enable RLS
ALTER TABLE public.acelerador_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions
CREATE POLICY "Users can view their own sessions" 
ON public.acelerador_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.acelerador_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.acelerador_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create form_responses table for storing user responses
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.acelerador_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  response_text TEXT,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_number)
);

-- Enable RLS
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Users can manage responses for their own sessions
CREATE POLICY "Users can view their own responses" 
ON public.form_responses 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.acelerador_sessions WHERE id = session_id));

CREATE POLICY "Users can create their own responses" 
ON public.form_responses 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.acelerador_sessions WHERE id = session_id));

CREATE POLICY "Users can update their own responses" 
ON public.form_responses 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.acelerador_sessions WHERE id = session_id));

-- Create diagnostic_reports table for generated reports
CREATE TABLE public.diagnostic_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.acelerador_sessions(id) ON DELETE CASCADE,
  document_number INTEGER NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_reports ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reports
CREATE POLICY "Users can view their own reports" 
ON public.diagnostic_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.diagnostic_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.diagnostic_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acelerador_sessions_updated_at
BEFORE UPDATE ON public.acelerador_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_responses_updated_at
BEFORE UPDATE ON public.form_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diagnostic_reports_updated_at
BEFORE UPDATE ON public.diagnostic_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Template 1: Preguntas orientadoras
INSERT INTO public.templates (name, content) VALUES ('plantilla1', '[
  {
    "nro": 1,
    "focoTematico": "Entorno hídrico local",
    "pregunta": "¿Cómo describirías la fuente principal de agua que abastece a tu comunidad (río, manantial, red pública, etc.) y qué cambios recientes has notado?",
    "tipoRespuesta": "Narrativa corta"
  },
  {
    "nro": 2,
    "focoTematico": "Entorno hídrico local",
    "pregunta": "En tu opinión, ¿qué tan segura es esa fuente de agua frente a sequías, contaminación u otros riesgos?",
    "tipoRespuesta": "Escala 1-5 + explicación breve"
  },
  {
    "nro": 3,
    "focoTematico": "Prácticas cotidianas de uso del agua",
    "pregunta": "¿Qué hábitos de consumo responsable ya practican tus estudiantes en casa o en la escuela?",
    "tipoRespuesta": "Lista de ejemplos"
  },
  {
    "nro": 4,
    "focoTematico": "Prácticas cotidianas de uso del agua",
    "pregunta": "¿Cuáles de esos hábitos crees que podrían mejorarse con apoyo del colegio?",
    "tipoRespuesta": "Prioriza 1-2 acciones"
  },
  {
    "nro": 5,
    "focoTematico": "Salud y bienestar",
    "pregunta": "¿Has observado problemas de salud (gastrointestinales, dermatológicos, etc.) que pudieran relacionarse con la calidad del agua que consumen los estudiantes?",
    "tipoRespuesta": "Sí/No + caso(s)"
  },
  {
    "nro": 6,
    "focoTematico": "Infraestructura escolar",
    "pregunta": "¿Cómo calificas el estado de los servicios de agua y saneamiento de tu IE (grifos, bebederos, baños) y qué mantenimiento reciben?",
    "tipoRespuesta": "Bueno/Regular/Malo + comentario"
  },
  {
    "nro": 7,
    "focoTematico": "Gestión de riesgos y cambio climático",
    "pregunta": "¿Qué eventos climáticos extremos (lluvias intensas, huaicos, sequías) afectaron la escuela en los últimos 3 años y cómo respondieron?",
    "tipoRespuesta": "Descripción breve"
  },
  {
    "nro": 8,
    "focoTematico": "Biodiversidad y territorio",
    "pregunta": "¿Qué especies locales (plantas, animales) dependen del mismo recurso hídrico que usan tus estudiantes y cómo se valoran en clase?",
    "tipoRespuesta": "Ejemplos + valoración"
  },
  {
    "nro": 9,
    "focoTematico": "Igualdad de género",
    "pregunta": "¿Hay diferencias en la participación de chicas, chicos o estudiantes con discapacidad cuando se discuten temas de agua? ¿Por qué?",
    "tipoRespuesta": "Reflexión breve"
  },
  {
    "nro": 10,
    "focoTematico": "Inclusión",
    "pregunta": "¿Hay diferencias en la participación de estudiantes con discapacidad cuando se discuten temas de agua? ¿Por qué?",
    "tipoRespuesta": "Reflexión breve"
  },
  {
    "nro": 11,
    "focoTematico": "Interculturalidad",
    "pregunta": "¿Qué saberes ancestrales o prácticas culturales sobre el agua poseen las familias de tu comunidad que podrían incorporarse a las sesiones?",
    "tipoRespuesta": "Ejemplos"
  },
  {
    "nro": 12,
    "focoTematico": "Currículo y competencias",
    "pregunta": "¿Qué competencias/áreas curriculares planeas reforzar al trabajar seguridad hídrica (Ciencia y Tecnología, Ciudadanía, etc.)? Toma en cuenta que deben ser áreas a tu cargo.",
    "tipoRespuesta": "Selecciona 1-3"
  },
  {
    "nro": 13,
    "focoTematico": "Compromisos de Gestión Escolar (CGE)",
    "pregunta": "Si integras seguridad hídrica en clases, ¿a qué CGE actuales de tu PEI ayudarías a avanzar (p.e. convivencia, aprendizaje, gestión de riesgos)?",
    "tipoRespuesta": "Indicar los compromisos + breve justificación"
  },
  {
    "nro": 14,
    "focoTematico": "Aliados y redes de apoyo",
    "pregunta": "¿Con qué instituciones locales (Empresas de Agua, municipalidad, ONG, comunidades campesinas) ya colaboras o quisieras colaborar para proyectos de agua?",
    "tipoRespuesta": "Lista"
  },
  {
    "nro": 15,
    "focoTematico": "Recursos disponibles",
    "pregunta": "¿Qué materiales digitales o físicos tienes para enseñar sobre seguridad hídrica, gestión del agua, etc.?",
    "tipoRespuesta": "Inventario rápido"
  }
]');

-- Insert Template 2: Estructura del documento de diagnóstico
INSERT INTO public.templates (name, content) VALUES ('plantilla2', '[
  {
    "bloque": "Portada y metadatos",
    "proposito": "Identificar el informe",
    "subSecciones": [
      { "titulo": "Título del informe", "detalle": "" },
      { "titulo": "Nombre completo del docente", "detalle": "" },
      { "titulo": "Institución Educativa", "detalle": "" },
      { "titulo": "Fecha de descarga (auto)", "detalle": "" },
      { "titulo": "N.º correlativo de documento (auto)", "detalle": "" }
    ],
    "indicaciones": "Los campos entre {{llaves}} se rellenan automáticamente. Ej.: {{docente_nombre}}"
  },
  {
    "bloque": "Sumilla ejecutiva",
    "proposito": "Dar visión rápida a directivos",
    "subSecciones": [
      { "titulo": "Objetivo del diagnóstico", "detalle": "" },
      { "titulo": "Metodología base (análisis documental + encuesta Plantilla 1)", "detalle": "" },
      { "titulo": "3 hallazgos clave y 3 recomendaciones clave", "detalle": "" }
    ],
    "indicaciones": "Máx. 180 palabras"
  },
  {
    "bloque": "Introducción y marco metodológico",
    "proposito": "Explicar alcance",
    "subSecciones": [
      { "titulo": "Objetivo del documento", "detalle": "" },
      { "titulo": "Fuentes revisadas (PEI, Plantilla 1)", "detalle": "" },
      { "titulo": "Criterios de análisis (enfoque ambiental, género, inclusión, interculturalidad)", "detalle": "" }
    ],
    "indicaciones": "Texto continuo; insertar citas numéricas a evidencias"
  },
  {
    "bloque": "Análisis del contexto pedagógico (PEI)",
    "proposito": "Sintetizar hallazgos PEI",
    "subSecciones": [
      { "titulo": "Visión y metas institucionales", "detalle": "" },
      { "titulo": "Situaciones significativas y CGE priorizados", "detalle": "" },
      { "titulo": "Brechas pedagógicas relevantes", "detalle": "" }
    ],
    "indicaciones": "1-1½ páginas; integrar datos cuantitativos (%) dentro del párrafo"
  },
  {
    "bloque": "Análisis del contexto de seguridad hídrica",
    "proposito": "Sintetizar hallazgos de Plantilla 1",
    "subSecciones": [
      { "titulo": "Entorno hídrico local", "detalle": "" },
      { "titulo": "Prácticas de uso del agua", "detalle": "" },
      { "titulo": "Infraestructura escolar", "detalle": "" },
      { "titulo": "Riesgos climáticos y salud", "detalle": "" },
      { "titulo": "Saberes locales y enfoque intercultural", "detalle": "" },
      { "titulo": "Igualdad de género e inclusión", "detalle": "" }
    ],
    "indicaciones": "2-2½ páginas; conectar ejemplos y cifras aportadas por el docente"
  },
  {
    "bloque": "Matriz FODA integrada",
    "proposito": "Visualizar síntesis",
    "subSecciones": [
      { "titulo": "Fortalezas", "detalle": "" },
      { "titulo": "Oportunidades", "detalle": "" },
      { "titulo": "Debilidades", "detalle": "" },
      { "titulo": "Amenazas", "detalle": "" }
    ],
    "indicaciones": "Tabla 2×2 con nota interpretativa (≈120 palabras)"
  },
  {
    "bloque": "Esquema complementario",
    "proposito": "Enriquecer la visualización",
    "subSecciones": [
      { "titulo": "Gráfico \"semáforo de riesgos\" u otro esquema pertinente", "detalle": "" }
    ],
    "indicaciones": "Incluir como tabla simple o diagramación textual; no gráficos externos"
  },
  {
    "bloque": "Prioridades pedagógico-ambientales",
    "proposito": "Alinear necesidades y currículo",
    "subSecciones": [
      { "titulo": "Sub-temas de seguridad hídrica por área curricular", "detalle": "" },
      { "titulo": "Criterios de priorización", "detalle": "" }
    ],
    "indicaciones": "Listas con viñetas; justificar cada prioridad en 1-2 líneas"
  },
  {
    "bloque": "Aportes al PEI y al CNEB",
    "proposito": "Mostrar alineación estratégica",
    "subSecciones": [
      { "titulo": "Cómo los sub-temas fortalecen los CGE y objetivos PEI", "detalle": "" },
      { "titulo": "Competencias y capacidades potenciadas (CNEB)", "detalle": "" }
    ],
    "indicaciones": "Máx. 1 página; citar artículos del CNEB o R.M. 160-2022-MINEDU"
  },
  {
    "bloque": "Recomendaciones iniciales",
    "proposito": "Orientar siguiente etapa",
    "subSecciones": [
      { "titulo": "Acciones inmediatas (< 3 meses)", "detalle": "" },
      { "titulo": "Acciones de mediano plazo (3-12 meses)", "detalle": "" },
      { "titulo": "Sugerencias de acompañamiento y uso de IA", "detalle": "" }
    ],
    "indicaciones": "Viñetas explicativas (≈¾ página)"
  },
  {
    "bloque": "Marco normativo",
    "proposito": "Respaldar el análisis",
    "subSecciones": [
      { "titulo": "Guía PEI-PAT 2024 (MINEDU)", "detalle": "" },
      { "titulo": "Currículo Nacional", "detalle": "" },
      { "titulo": "R.M. 160-2022-MINEDU", "detalle": "" },
      { "titulo": "Otras directivas locales pertinentes", "detalle": "" }
    ],
    "indicaciones": "Referenciar de forma breve"
  },
  {
    "bloque": "Conclusiones",
    "proposito": "Cerrar diagnóstico",
    "subSecciones": [
      { "titulo": "Párrafos sintéticos (3-5) que retomen hallazgos y desafíos clave", "detalle": "" }
    ],
    "indicaciones": ""
  },
  {
    "bloque": "Visto bueno y firmas",
    "proposito": "Validación interna",
    "subSecciones": [
      { "titulo": "Tabla con campos para Nombre, Cargo, Firma, Fecha", "detalle": "" }
    ],
    "indicaciones": ""
  },
  {
    "bloque": "Anexos",
    "proposito": "Vincular evidencias",
    "subSecciones": [
      { "titulo": "Tabla de enlaces Supabase: N.º, Nombre de archivo, Tipo, URL", "detalle": "" }
    ],
    "indicaciones": "Cada enlace generado automáticamente a partir del ID del archivo en Supabase."
  }
]');