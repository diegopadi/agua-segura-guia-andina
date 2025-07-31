-- Insertar Plantilla 4: Generador de Cuestionario de Capacidades – Acelerador 3
INSERT INTO public.templates (name, content) VALUES (
  'teacher_capacity_questionnaire_template',
  '{
    "name": "Generador de Cuestionario de Capacidades – Acelerador 3",
    "description": "Genera un cuestionario de 10 preguntas para evaluar las capacidades institucionales del docente",
    "ai_prompt": "Eres un experto en desarrollo de capacidades institucionales en educación ambiental hídrica. Tu tarea es generar exactamente 10 preguntas estratégicas para evaluar las capacidades institucionales del docente y su institución educativa para implementar proyectos de educación ambiental hídrica.\n\nCONTEXTO DISPONIBLE:\n- Diagnóstico de necesidades hídricas (Acelerador 1): {accelerator1_data}\n- Análisis de características estudiantiles (Acelerador 2): {accelerator2_data}\n\nINSTRUCCIONES ESPECÍFICAS:\n1. DISTRIBUCIÓN DE DIMENSIONES (exactamente 10 preguntas):\n   - Capacidades técnicas/conocimientos: 3 preguntas\n   - Recursos y herramientas disponibles: 2 preguntas\n   - Capacidades de gestión/liderazgo: 2 preguntas\n   - Redes y alianzas institucionales: 2 preguntas\n   - Capacidades pedagógicas/didácticas: 1 pregunta\n\n2. CRITERIOS DE PRIORIZACIÓN:\n   - Enfócate en áreas donde el docente puede tener mayor control e influencia\n   - Prioriza capacidades que impacten directamente en la implementación de proyectos hídricos\n   - Considera las brechas identificadas en los aceleradores anteriores\n   - Incluye tanto capacidades actuales como potencial de desarrollo\n\n3. FORMATO DE RESPUESTA:\n   - Cada pregunta debe tener exactamente 5 opciones de respuesta\n   - Las opciones deben seguir una escala progresiva (de menor a mayor capacidad)\n   - Usar un lenguaje claro y profesional dirigido a docentes\n   - Las preguntas deben ser específicas al contexto educativo hídrico\n\n4. ESTRUCTURA JSON requerida:\n{\n  \"questions\": [\n    {\n      \"id\": 1,\n      \"dimension\": \"[nombre de la dimensión]\",\n      \"question_text\": \"[pregunta específica]\",\n      \"question_type\": \"multiple_choice\",\n      \"options\": [\n        {\"value\": \"1\", \"label\": \"[opción nivel 1 - menor capacidad]\"},\n        {\"value\": \"2\", \"label\": \"[opción nivel 2]\"},\n        {\"value\": \"3\", \"label\": \"[opción nivel 3 - capacidad media]\"},\n        {\"value\": \"4\", \"label\": \"[opción nivel 4]\"},\n        {\"value\": \"5\", \"label\": \"[opción nivel 5 - mayor capacidad]\"}\n      ]\n    }\n  ]\n}\n\nGenera exactamente 10 preguntas siguiendo esta estructura y distribución.",
    "input_variables": ["accelerator1_data", "accelerator2_data"],
    "output_schema": {
      "type": "object",
      "properties": {
        "questions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "number"},
              "dimension": {"type": "string"},
              "question_text": {"type": "string"},
              "question_type": {"type": "string"},
              "options": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "value": {"type": "string"},
                    "label": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    }
  }'::jsonb
),
-- Insertar Plantilla 5: Generador de Informe de Priorización – Acelerador 3
(
  'priority_report_template',
  '{
    "name": "Generador de Informe de Priorización – Acelerador 3",
    "description": "Genera el informe final de priorización de necesidades hídricas integrando los resultados de los 3 aceleradores",
    "ai_prompt": "Eres un experto en educación ambiental hídrica y planificación estratégica educativa. Tu tarea es generar un informe integral que priorice las 5 principales necesidades hídricas de la institución educativa, integrando los resultados de los 3 aceleradores completados.\n\nDATOS DISPONIBLES:\n- ACELERADOR 1 - Diagnóstico hídrico: {accelerator1_data}\n- ACELERADOR 2 - Características estudiantiles: {accelerator2_data}\n- ACELERADOR 3 - Capacidades institucionales: {accelerator3_data}\n\nINSTRUCCIONES ESPECÍFICAS:\n1. ANÁLISIS INTEGRAL:\n   - Analiza la convergencia entre problemas hídricos identificados, características estudiantiles y capacidades institucionales\n   - Identifica las necesidades más críticas y factibles de abordar\n   - Considera el impacto educativo y la viabilidad de implementación\n\n2. PRIORIZACIÓN (exactamente 5 prioridades):\n   - Ordena las necesidades de mayor a menor importancia\n   - Cada prioridad debe incluir justificación basada en los 3 aceleradores\n   - Proporciona estrategias específicas de abordaje para cada prioridad\n\n3. FORMATO HTML REQUERIDO:\n```html\n<div class=\"priority-report\">\n  <div class=\"report-header\">\n    <h1>Informe de Priorización de Necesidades Hídricas</h1>\n    <div class=\"institution-info\">\n      <p><strong>Institución:</strong> [nombre de la institución]</p>\n      <p><strong>Fecha:</strong> [fecha actual]</p>\n      <p><strong>Docente:</strong> [nombre del docente]</p>\n    </div>\n  </div>\n\n  <div class=\"executive-summary\">\n    <h2>Resumen Ejecutivo</h2>\n    <p>[Resumen de 2-3 párrafos del análisis integral y las principales conclusiones]</p>\n  </div>\n\n  <div class=\"methodology\">\n    <h2>Metodología</h2>\n    <p>Este informe integra los resultados de tres aceleradores de diagnóstico:</p>\n    <ul>\n      <li><strong>Acelerador 1:</strong> Identificación de problemas hídricos específicos</li>\n      <li><strong>Acelerador 2:</strong> Análisis de características y necesidades estudiantiles</li>\n      <li><strong>Acelerador 3:</strong> Evaluación de capacidades institucionales</li>\n    </ul>\n  </div>\n\n  <div class=\"priorities-section\">\n    <h2>Prioridades Identificadas</h2>\n    \n    <div class=\"priority-item\">\n      <h3>Prioridad 1: [Título de la prioridad]</h3>\n      <div class=\"priority-content\">\n        <div class=\"description\">\n          <h4>Descripción</h4>\n          <p>[Descripción detallada de la necesidad]</p>\n        </div>\n        <div class=\"justification\">\n          <h4>Justificación</h4>\n          <ul>\n            <li><strong>Acelerador 1:</strong> [Evidencia del diagnóstico hídrico]</li>\n            <li><strong>Acelerador 2:</strong> [Relevancia para las características estudiantiles]</li>\n            <li><strong>Acelerador 3:</strong> [Capacidades institucionales disponibles]</li>\n          </ul>\n        </div>\n        <div class=\"strategies\">\n          <h4>Estrategias de Abordaje</h4>\n          <ul>\n            <li>[Estrategia específica 1]</li>\n            <li>[Estrategia específica 2]</li>\n            <li>[Estrategia específica 3]</li>\n          </ul>\n        </div>\n      </div>\n    </div>\n\n    [Repetir estructura para Prioridades 2, 3, 4 y 5]\n  </div>\n\n  <div class=\"next-steps\">\n    <h2>Próximos Pasos</h2>\n    <p>Con estas prioridades identificadas, se recomienda:</p>\n    <ol>\n      <li>Proceder a la <strong>Etapa 2</strong> para desarrollar propuestas metodológicas específicas</li>\n      <li>Socializar este diagnóstico con la comunidad educativa</li>\n      <li>Establecer cronogramas de implementación</li>\n      <li>Identificar recursos adicionales necesarios</li>\n    </ol>\n  </div>\n\n  <div class=\"report-footer\">\n    <p><em>Este informe ha sido generado mediante análisis de inteligencia artificial basado en los datos proporcionados en los aceleradores de diagnóstico.</em></p>\n  </div>\n</div>\n```\n\n4. CONSIDERACIONES IMPORTANTES:\n   - Usa un lenguaje técnico pero accesible para docentes\n   - Cada prioridad debe ser específica y accionable\n   - Las estrategias deben ser realistas según las capacidades identificadas\n   - El informe debe servir como base para la Etapa 2 del proceso\n\nGenera el informe HTML completo con las 5 prioridades ordenadas por importancia.",
    "input_variables": ["accelerator1_data", "accelerator2_data", "accelerator3_data"],
    "output_schema": {
      "type": "object",
      "properties": {
        "html_content": {"type": "string"},
        "priorities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "priority_number": {"type": "number"},
              "title": {"type": "string"},
              "description": {"type": "string"},
              "justification": {"type": "object"},
              "strategies": {"type": "array", "items": {"type": "string"}}
            }
          }
        },
        "metadata": {
          "type": "object",
          "properties": {
            "institution_name": {"type": "string"},
            "teacher_name": {"type": "string"},
            "generated_date": {"type": "string"},
            "total_priorities": {"type": "number"}
          }
        }
      }
    }
  }'::jsonb
);