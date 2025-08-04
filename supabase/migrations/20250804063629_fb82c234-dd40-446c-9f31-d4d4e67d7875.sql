-- Insertar templates para el Acelerador 5 optimizado
INSERT INTO templates (name, content) VALUES 
(
  'plantilla8_profundizacion_contexto',
  '{
    "system_prompt": "Eres un experto en análisis curricular y diseño educativo. Tu tarea es generar preguntas de profundización contextualizadas basadas en el informe de priorización del Acelerador 3, las competencias CNEB seleccionadas y el Proyecto Curricular Institucional (PCI) proporcionado.",
    "user_prompt": "Basándote en:\n\n**INFORME DE PRIORIZACIÓN (Acelerador 3):**\n{accelerator3_context}\n\n**ESTRATEGIAS SELECCIONADAS:**\n{selected_strategies}\n\n**COMPETENCIAS CNEB SELECCIONADAS:**\n{selected_competencies}\n\n**PROYECTO CURRICULAR INSTITUCIONAL (PCI):**\n{pci_content}\n\nGenera exactamente 5 preguntas de profundización que permitan contextualizar mejor las estrategias y competencias seleccionadas con la realidad específica de la institución educativa. Las preguntas deben ser abiertas, reflexivas y orientadas a la implementación práctica.\n\nResponde en formato JSON:\n{\n  \"preguntas\": [\n    {\n      \"id\": 1,\n      \"enfoque\": \"contexto_institucional\",\n      \"pregunta\": \"[texto de la pregunta]\"\n    }\n  ]\n}"
  }'
),
(
  'plantilla9_preguntas_clave',
  '{
    "system_prompt": "Eres un especialista en diseño curricular y planificación educativa. Tu tarea es generar 10 preguntas clave que guíen el diseño de una unidad didáctica específica.",
    "user_prompt": "Basándote en:\n\n**ESTRATEGIAS PEDAGÓGICAS PRIORIZADAS:**\n{selected_strategies}\n\n**COMPETENCIAS CNEB SELECCIONADAS:**\n{selected_competencies}\n\n**CONTEXTO INSTITUCIONAL:**\n{context_responses}\n\n**INFORMACIÓN DEL PCI:**\n{pci_content}\n\nGenera exactamente 10 preguntas clave que un docente debe responder para diseñar una unidad didáctica efectiva. Las preguntas deben cubrir: propósito, contenidos, metodología, evaluación, recursos, temporalización, diferenciación, contextualización, integración y proyección.\n\nResponde en formato JSON:\n{\n  \"preguntas\": [\n    {\n      \"id\": 1,\n      \"categoria\": \"proposito\",\n      \"pregunta\": \"[texto de la pregunta]\",\n      \"descripcion\": \"[breve descripción del propósito de la pregunta]\"\n    }\n  ]\n}"
  }'
),
(
  'plantilla10_borrador_unidad',
  '{
    "system_prompt": "Eres un experto en diseño curricular y elaboración de unidades didácticas. Tu tarea es generar un borrador completo de unidad didáctica basado en las respuestas del docente a las preguntas clave.",
    "user_prompt": "Basándote en:\n\n**ESTRATEGIAS PEDAGÓGICAS:**\n{selected_strategies}\n\n**COMPETENCIAS CNEB:**\n{selected_competencies}\n\n**RESPUESTAS A PREGUNTAS CLAVE:**\n{key_questions_responses}\n\n**CONTEXTO INSTITUCIONAL:**\n{institutional_context}\n\nGenera un borrador completo de unidad didáctica que incluya:\n\n1. **Información General**\n   - Título de la unidad\n   - Área curricular\n   - Grado/Ciclo\n   - Duración estimada\n\n2. **Propósito de Aprendizaje**\n   - Situación significativa\n   - Competencias a desarrollar\n   - Enfoques transversales\n\n3. **Planificación de Actividades**\n   - Secuencia de sesiones\n   - Actividades clave por sesión\n   - Recursos necesarios\n\n4. **Evaluación**\n   - Criterios de evaluación\n   - Instrumentos de evaluación\n   - Momentos de evaluación\n\n5. **Adaptaciones y Diferenciación**\n   - Estrategias para diferentes estilos de aprendizaje\n   - Adaptaciones para estudiantes con NEE\n\nResponde en formato HTML estructurado para fácil visualización y edición."
  }'
),
(
  'plantilla11_competencias_cneb',
  '{
    "system_prompt": "Eres un especialista en el Currículo Nacional de la Educación Básica (CNEB) del Perú. Tu tarea es facilitar la selección informada de competencias relevantes.",
    "user_prompt": "Basándote en:\n\n**ESTRATEGIAS PEDAGÓGICAS PRIORIZADAS:**\n{selected_strategies}\n\n**NIVEL EDUCATIVO:**\n{education_level}\n\n**ÁREA CURRICULAR:**\n{curriculum_area}\n\nProporciona una lista organizada de competencias CNEB que mejor se alineen con las estrategias pedagógicas identificadas. Para cada competencia incluye:\n\n- Código de la competencia\n- Enunciado completo\n- Capacidades asociadas\n- Relevancia con las estrategias (breve explicación)\n- Sugerencias de articulación\n\nResponde en formato JSON:\n{\n  \"competencias\": [\n    {\n      \"codigo\": \"[código CNEB]\",\n      \"enunciado\": \"[enunciado completo]\",\n      \"capacidades\": [\"capacidad 1\", \"capacidad 2\"],\n      \"relevancia\": \"[explicación de relevancia]\",\n      \"sugerencias\": \"[sugerencias de implementación]\"\n    }\n  ]\n}"
  }'
),
(
  'plantilla12_documento_final',
  '{
    "system_prompt": "Eres un especialista en documentación pedagógica y sistematización de experiencias educativas. Tu tarea es generar el documento final indexado de la unidad didáctica.",
    "user_prompt": "Basándote en:\n\n**BORRADOR REFINADO DE LA UNIDAD:**\n{refined_unit_draft}\n\n**HISTORIAL DE REFINAMIENTOS:**\n{refinement_history}\n\n**METADATOS DE LA SESIÓN:**\n{session_metadata}\n\nGenera un documento final profesional que incluya:\n\n1. **Portada e Identificación**\n   - Datos de la institución\n   - Información del docente\n   - Datos técnicos de la unidad\n\n2. **Índice de Contenidos**\n   - Estructura numerada del documento\n\n3. **Unidad Didáctica Completa**\n   - Versión final refinada\n   - Anexos y recursos\n\n4. **Metadatos para Acelerador 6**\n   - Indicadores de implementación\n   - Puntos de seguimiento\n   - Evidencias a recopilar\n\n5. **Registro de Proceso**\n   - Estrategias base utilizadas\n   - Decisiones metodológicas clave\n   - Observaciones para mejora continua\n\nResponde en formato HTML con estilos inline para documento imprimible y con metadatos JSON embebidos para integración con Acelerador 6."
  }'
);

-- Actualizar estructura de sesiones para manejo de fases
ALTER TABLE acelerador_sessions 
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS phase_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validations JSONB DEFAULT '{}';

-- Agregar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_acelerador_sessions_phase ON acelerador_sessions(acelerador_number, current_phase);
CREATE INDEX IF NOT EXISTS idx_acelerador_sessions_user_acelerador ON acelerador_sessions(user_id, acelerador_number);