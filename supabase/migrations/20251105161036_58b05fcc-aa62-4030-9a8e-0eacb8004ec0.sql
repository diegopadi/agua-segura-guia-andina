-- Crear tabla de proyectos CNPIE
CREATE TABLE IF NOT EXISTS public.cnpie_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tipo_proyecto TEXT NOT NULL CHECK (tipo_proyecto IN ('2A', '2B', '2C')),
  diagnostico_resumen JSONB DEFAULT '{}',
  experiencias_ids TEXT[] DEFAULT '{}',
  preguntas_respuestas JSONB DEFAULT '{}',
  recomendacion_ia JSONB DEFAULT '{}',
  etapa_actual INTEGER DEFAULT 1,
  acelerador_actual INTEGER DEFAULT 1,
  estado_aceleradores JSONB DEFAULT '{}',
  datos_aceleradores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de rúbricas CNPIE
CREATE TABLE IF NOT EXISTS public.cnpie_rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('2A', '2B', '2C')),
  criterio TEXT NOT NULL,
  indicador TEXT NOT NULL,
  puntaje_maximo INTEGER NOT NULL,
  descripcion TEXT,
  recomendaciones TEXT,
  extension_maxima INTEGER,
  ejemplos JSONB DEFAULT '[]',
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de evaluaciones predictivas
CREATE TABLE IF NOT EXISTS public.cnpie_evaluaciones_predictivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.cnpie_proyectos(id) ON DELETE CASCADE NOT NULL,
  tipo_evaluacion TEXT NOT NULL,
  puntajes_criterios JSONB NOT NULL DEFAULT '{}',
  puntaje_total INTEGER NOT NULL,
  puntaje_maximo INTEGER NOT NULL,
  porcentaje_cumplimiento INTEGER NOT NULL,
  areas_fuertes TEXT[] DEFAULT '{}',
  areas_mejorar TEXT[] DEFAULT '{}',
  recomendaciones_ia TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cnpie_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpie_rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpie_evaluaciones_predictivas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cnpie_proyectos
CREATE POLICY "Users can view their own CNPIE projects"
  ON public.cnpie_proyectos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CNPIE projects"
  ON public.cnpie_proyectos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CNPIE projects"
  ON public.cnpie_proyectos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CNPIE projects"
  ON public.cnpie_proyectos FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para cnpie_rubricas (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can view CNPIE rubricas"
  ON public.cnpie_rubricas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Políticas RLS para cnpie_evaluaciones_predictivas
CREATE POLICY "Users can view evaluations of their projects"
  ON public.cnpie_evaluaciones_predictivas FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.cnpie_proyectos WHERE id = proyecto_id));

CREATE POLICY "Users can create evaluations for their projects"
  ON public.cnpie_evaluaciones_predictivas FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.cnpie_proyectos WHERE id = proyecto_id));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_cnpie_proyectos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_cnpie_proyectos_updated_at
  BEFORE UPDATE ON public.cnpie_proyectos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cnpie_proyectos_updated_at();

-- Poblar rúbricas oficiales CNPIE 2A
INSERT INTO public.cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, descripcion, recomendaciones, extension_maxima, orden) VALUES
('2A', 'Intencionalidad', 'El problema central está claramente descrito, identificando causas, consecuencias y el objetivo del proyecto.', 20, 'Criterio que evalúa la claridad en la identificación del problema educativo que motiva el proyecto, sus causas y consecuencias, así como un objetivo bien definido.', 'Incluye: problema específico, causas identificadas, consecuencias observadas, objetivo SMART. Usa datos cuantitativos si están disponibles.', 3000, 1),
('2A', 'Originalidad', 'La metodología es innovadora, promueve el pensamiento crítico y la resolución de problemas.', 30, 'Criterio que evalúa el grado de innovación de la metodología empleada y su capacidad para desarrollar competencias de orden superior.', 'Describe metodologías específicas (ABP, Design Thinking, etc.), explica por qué es innovadora en tu contexto, incluye evidencias de su aplicación única.', 8000, 2),
('2A', 'Pertinencia', 'El proyecto responde a necesidades del contexto educativo y se alinea con políticas educativas.', 6, 'Criterio que valora la conexión entre el proyecto y las necesidades reales del contexto, así como su alineamiento con el CNEB y políticas educativas.', 'Conecta con necesidades locales identificadas, referencia competencias CNEB trabajadas, menciona políticas educativas pertinentes (PEN, PER, PEI).', 2000, 3),
('2A', 'Impacto', 'Existen resultados documentados en el desarrollo de competencias y cambios en la gestión escolar.', 15, 'Criterio que evalúa los resultados tangibles del proyecto en los aprendizajes de los estudiantes y en los procesos de gestión institucional.', 'Presenta datos de evaluación diagnóstica vs actual, actas de evaluación, informes de desempeño, cambios en instrumentos de gestión (PEI, PAT, RI).', 4000, 4),
('2A', 'Participación', 'Existe apropiación de la metodología por parte de docentes y participación activa de la comunidad educativa.', 14, 'Criterio que valora el nivel de involucramiento de docentes, estudiantes, familias y aliados en el proyecto.', 'Documenta: actas de reuniones, compromisos firmados, evidencias de participación docente, alianzas con instituciones, involucramiento de familias.', 3000, 5),
('2A', 'Reflexión', 'Se han implementado espacios reflexivos para la mejora continua del proyecto.', 5, 'Criterio que evalúa la existencia de procesos sistemáticos de reflexión y mejora continua.', 'Describe espacios reflexivos (reuniones colegiadas, círculos de aprendizaje), frecuencia, participantes, decisiones tomadas a partir de la reflexión.', 1500, 6),
('2A', 'Sostenibilidad', 'El proyecto está institucionalizado y existe una cultura innovadora que garantiza su continuidad.', 10, 'Criterio que valora la institucionalización del proyecto y las condiciones que garantizan su permanencia en el tiempo.', 'Evidencia inclusión en PEI/PAT/RI, asignación presupuestal, formación continua de docentes, plan de escalabilidad, mecanismos de transferencia.', 2500, 7);

-- Poblar rúbricas oficiales CNPIE 2B
INSERT INTO public.cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, descripcion, recomendaciones, extension_maxima, orden) VALUES
('2B', 'Intencionalidad', 'El problema central y el objetivo están claramente identificados.', 25, 'Claridad en la definición del problema educativo y el objetivo que se busca alcanzar.', 'Define problema específico, contexto, objetivo claro y alcanzable en un año escolar.', 2500, 1),
('2B', 'Originalidad', 'La metodología propuesta es innovadora y está bien fundamentada.', 35, 'Innovación metodológica que se diferencia de prácticas tradicionales.', 'Explica la metodología innovadora, por qué es diferente, cómo promueve competencias del CNEB.', 6000, 2),
('2B', 'Pertinencia', 'El proyecto responde a necesidades del contexto y se alinea con el CNEB.', 10, 'Conexión con necesidades reales y alineamiento curricular.', 'Vincula con diagnóstico, competencias CNEB, políticas educativas vigentes.', 2000, 3),
('2B', 'Impacto', 'Se presentan resultados iniciales o esperados del proyecto.', 20, 'Evidencias de primeros resultados en aprendizajes o proyección fundamentada.', 'Primeras evidencias de implementación, resultados iniciales, proyección de impacto esperado.', 3000, 4),
('2B', 'Reflexión', 'Existen mecanismos de reflexión y ajuste del proyecto.', 10, 'Espacios y procesos de reflexión para mejora continua.', 'Describe espacios reflexivos planificados, frecuencia, participantes, ajustes realizados.', 1500, 5);

-- Poblar rúbricas oficiales CNPIE 2C
INSERT INTO public.cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, descripcion, recomendaciones, extension_maxima, orden) VALUES
('2C', 'Intencionalidad', 'El problema, justificación, pregunta de investigación y objetivos están claramente formulados siguiendo IAPE.', 40, 'Claridad en la formulación del problema desde la práctica dialógica reflexiva, con pregunta de investigación y objetivos alineados a IAPE.', 'Incluye problema identificado desde reflexión colectiva, justificación basada en diagnóstico participativo, pregunta de investigación clara, objetivos específicos.', 4000, 1),
('2C', 'Participación', 'Los actores y estrategias de participación están claramente definidos.', 20, 'Identificación de actores involucrados y estrategias concretas de participación en la investigación-acción.', 'Describe actores (docentes, estudiantes, familias, comunidad), roles, estrategias de involucramiento, compromisos.', 2500, 2),
('2C', 'Consistencia', 'La metodología IAPE y matriz de consistencia están completas y coherentes.', 40, 'Coherencia metodológica siguiendo enfoque IAPE, con instrumentos de recolección de datos y matriz de consistencia completa.', 'Presenta matriz de consistencia (problema-pregunta-objetivos-metodología-instrumentos), describe instrumentos de recolección de datos, plan de análisis.', 5000, 3)