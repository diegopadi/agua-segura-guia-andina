-- Insertar las 6 plantillas del Acelerador 5 (plantilla9 a plantilla14)

-- Plantilla 9: Selección de Competencias CNEB
INSERT INTO public.templates (name, content) VALUES (
  'plantilla9_competencias_cneb',
  '{
    "type": "ai_prompt",
    "version": "1.0",
    "prompt": "Eres un asistente curricular. Presenta **todas** las competencias del Currículo Nacional de Educación Básica para 3.º, 4.º y 5.º de secundaria, agrupadas por área curricular:\n  - Comunicación\n  - Personal Social\n  - Ciencia y Tecnología\n  - Matemática\n  - Educación para el Trabajo\n  - Arte y Educación Física\nCada entrada debe incluir:\n  • código de la competencia\n  • nombre breve (1 línea)\n  • descripción resumida (1 línea)\n**FORMATO DE SALIDA:**\n```json\n[\n  {\n    \"area\": \"Comunicación\",\n    \"competencias\": [\n      {\n        \"codigo\": \"COM3\",\n        \"nombre\": \"Comprende textos\",\n        \"descripcion\": \"Identifica ideas principales y detalles.\"\n      }\n    ]\n  }\n]\n```"
  }'::jsonb
);

-- Plantilla 10: Preguntas de Contexto PCI
INSERT INTO public.templates (name, content) VALUES (
  'plantilla10_preguntas_pci_ac5',
  '{
    "type": "ai_prompt",
    "version": "1.0",
    "prompt": "Eres un analista curricular. Con base en:\n  • Las estrategias priorizadas del Acelerador 4\n  • El Proyecto Curricular Institucional (PCI) cargado\n  • La competencia seleccionada del CNEB\nFormula **hasta 5 preguntas** que permitan:\n  1. Confirmar los enfoques transversales y líneas estratégicas del PCI.\n  2. Identificar recursos y espacios institucionales disponibles.\n  3. Reconocer adaptaciones para modalidad EIB o multigrado.\n  4. Detectar apoyos tecnológicos o metodológicos propios de la institución.\nCada pregunta debe explicitar brevemente el porqué se hace (justificación).\n**FORMATO DE SALIDA:**\n```json\n[\n  {\n    \"id\": 1,\n    \"pregunta\": \"¿Cuál es la línea estratégica principal del PCI relacionada con ...?\",\n    \"justificacion\": \"Para alinear la unidad con objetivos institucionales.\"\n  }\n]\n```"
  }'::jsonb
);

-- Plantilla 11: Generador de Preguntas Clave
INSERT INTO public.templates (name, content) VALUES (
  'plantilla11_preguntas_clave_ac5',
  '{
    "type": "ai_prompt",
    "version": "1.0",
    "prompt": "Eres un diseñador curricular. Con base en:\n  • Estrategias priorizadas (Acelerador 4)\n  • Competencia CNEB seleccionada\n  • Respuestas al cuestionario de contexto PCI\nFormula **10 preguntas clave**, cada una agrupada en una de estas categorías:\n  1. Propósito\n  2. Contenidos\n  3. Metodología\n  4. Evaluación\n  5. Recursos\n  6. Temporalización\n  7. Diferenciación\n  8. Contextualización\n  9. Integración\n  10. Proyección\nPara cada pregunta incluye:\n  • `id` (1–10)\n  • `categoria`\n  • `pregunta` (texto claro)\n  • `contexto` (breve justificación de por qué es relevante)\n  • `ejemplo` (un ejemplo de respuesta esperada)\nAsegúrate de que las preguntas sean detalladas y guíen al docente a ofrecer información precisa.\n**FORMATO DE SALIDA:**\n```json\n[\n  {\n    \"id\": 1,\n    \"categoria\": \"Propósito\",\n    \"pregunta\": \"¿Cuál será la situación significativa que conecte el contenido con la realidad local?\",\n    \"contexto\": \"Define el escenario de aprendizaje para involucrar a los estudiantes.\",\n    \"ejemplo\": \"Organizar un diagnosticado participativo con líderes comunitarios...\"\n  }\n]\n```"
  }'::jsonb
);

-- Plantilla 12: Borrador Inicial de Unidad (HTML)
INSERT INTO public.templates (name, content) VALUES (
  'plantilla12_borrador_unidad_ac5',
  '{
    "type": "ai_prompt",
    "version": "1.0",
    "prompt": "Genera un **borrador de unidad didáctica** en **HTML** estructurado, con las siguientes secciones, cada una aproximadamente una página de texto:\n1. **Resumen Ejecutivo** (1 página): Síntesis de propósito, contexto y alcance.\n2. **Situación Significativa**: Descripción detallada del escenario de aprendizaje.\n3. **Objetivos de la Unidad**: Competencia + capacidades específicas.\n4. **Secuencia de Actividades**: 3–5 pasos, con metodología y tiempos.\n5. **Criterios e Indicadores de Evaluación Formativa**.\n6. **Recursos y Evidencias**: Materiales e instrumentos previstos.\n7. **Bibliografía/Referencias** (opcional).\nUsa etiquetas semánticas (`<h1> …`, `<p>`, `<ul>`, `<li>`) y asegúrate de que cada sección esté claramente delimitada.\n**ENTRADA:** JSON con respuestas a preguntas clave.\n**SALIDA:** HTML completo."
  }'::jsonb
);

-- Plantilla 13: Chat de Refinamiento
INSERT INTO public.templates (name, content) VALUES (
  'plantilla13_feedback_unidad_ac5',
  '{
    "type": "ai_prompt",
    "version": "1.0",
    "prompt": "Actúas como asistente de refinamiento. Recibes:\n  - `draftHtml`: el HTML actual del borrador\n  - `feedback`: comentario del docente (única interacción)\nDevuelve **solo**:\n  1. La sección HTML modificada o el fragmento revisado.\n  2. Una breve nota de `justification` explicando el cambio.\n**NOTA:** Se permite **solo 1 interacción** de refinamiento.\n**FORMATO DE ENTRADA:**\n```json\n{ \"draftHtml\": \"...\", \"feedback\": \"...\" }\n```\n**FORMATO DE SALIDA:**\n```json\n{\n  \"updatedHtml\": \"...\",\n  \"justification\": \"…\"\n}\n```"
  }'::jsonb
);

-- Plantilla 14: Documento Final Indexado
INSERT INTO public.templates (name, content) VALUES (
  'plantilla14_documento_final_ac5',
  '{
    "type": "report_template",
    "version": "1.0",
    "template": "# Unidad de Aprendizaje Final\n\n**Competencia:** {{competencia_codigo}} – {{competencia_nombre}}\n**Proyecto Curricular:** {{titulo_pci}} ({{fecha_pci}})\n**Contexto:** {{contexto}}\n**Fecha de generación:** {{fecha_actual}}\n**Autor:** {{nombre_docente}}\n\n## 1. Resumen Ejecutivo\n{{resumen_ejecutivo}}\n\n## 2. Situación Significativa\n{{situacion}}\n\n## 3. Objetivos de la Unidad\n- Competencia: {{competencia_nombre}}\n- Capacidades: {{capacidades}}\n\n## 4. Secuencia de Actividades\n{{#each secuencia}}\n1. {{this}}\n{{/each}}\n\n## 5. Evaluación Formativa\n{{criterios}}\n\n## 6. Recursos y Evidencias\n{{recursos}}\n\n## 7. Puntos de Seguimiento\n{{puntos_seguimiento}}\n\n## 8. Referencias Normativas\n- Currículo Nacional de Educación Básica (RM 281-2016-MINEDU)\n- Proyecto Curricular Institucional\n- Cartilla DIGEBR-MINEDU\n- Orientaciones MINEDU\n\n***Fin del documento***"
  }'::jsonb
);