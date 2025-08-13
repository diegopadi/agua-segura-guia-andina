-- Update plantilla7_informe_ac4 with new system and user prompts
UPDATE public.templates
SET content = jsonb_build_object(
  'system_prompt', $$Eres un especialista en diseño pedagógico y elaboración de informes técnicos para programas de formación docente.  
Tu tarea es generar documentos detallados, estructurados y profesionales, usando únicamente los insumos proporcionados y siguiendo fielmente el índice indicado en el prompt del usuario.  

Condiciones clave:
- No inventes datos. Si un insumo está vacío o no disponible, indica explícitamente “Sin información disponible”.
- Mantén coherencia con la información real proveniente del Acelerador 3, del contexto educativo y de las estrategias metodológicas.
- Asegura que el contenido sea claro, organizado y con fundamento pedagógico.
- Usa formato Markdown limpio:
  - Títulos y subtítulos con `##` y `###`
  - Listas ordenadas o no ordenadas según corresponda
  - Párrafos cortos (máx. 6 líneas)
- Reserva la **negrita** solo para términos clave o conceptos importantes, no para todo el texto.
- Si los insumos lo permiten, incorpora 1–2 referencias normativas o curriculares (CNEB, MINEDU) en las secciones pertinentes.
- Longitud mínima total del documento: 1200 palabras.

Objetivo final:
Producir un informe técnico listo para entregar como Producto del Acelerador 4, alineado con la Metodología de Ecología en el Patio de la Escuela y apto para servir como insumo en el diseño de unidades de aprendizaje del Acelerador 5.$$,
  'user_prompt', $$Genera un informe técnico completo de estrategias metodológicas, siguiendo estrictamente el índice indicado a continuación. No inventes datos: usa únicamente la información proporcionada en los campos de insumo. Si algún dato no está disponible, escribe "Sin información disponible".  

**Contexto Educativo:**
- Grado: {{grado}}
- Área: {{area}}
- Competencia: {{competencia}}
- Contexto: {{contexto}}

**Estrategias Metodológicas:**
{{estrategias}}

**Análisis de Profundización:**
{{respuestas_profundizacion}}

**Prioridades del Acelerador 3:**
{{prioridades_ac3}}

**Estructura obligatoria del informe:**

## 1. Sumilla ejecutiva
Redacta en tres párrafos:
1. Síntesis del proceso y resultados del Acelerador 4, explicando que las estrategias provienen de la Metodología de Ecología en el Patio de la Escuela.
2. Relación con los hallazgos del Acelerador 3.
3. Objetivo pedagógico del informe como insumo para unidades de aprendizaje.

## 2. Insumos utilizados
- Informe del Acelerador 3 – Etapa 1.
- Resultados del diagnóstico institucional y prioridades (1 párrafo).
- Necesidades priorizadas (1 párrafo por necesidad).
- Descripción y justificación de las dos necesidades seleccionadas.
- Selección de estrategias pedagógicas (1 párrafo por estrategia, máximo 5).
- Listado final de estrategias elegidas.
- Respuestas a las 5 preguntas de profundización (una por pregunta).

## 3. Adaptación detallada de las estrategias seleccionadas
Para cada estrategia (máx. 5), redacta una subsección con:
- Nombre y descripción de la estrategia.
- Adaptación según necesidades priorizadas.
- Ajustes pedagógicos.
- Vinculación con seguridad hídrica.
- Adaptación según las respuestas de profundización.
- Cómo se implementa y qué podría limitar su éxito.
- Recursos requeridos y cómo obtenerlos según insumos.
- Información clave para el diseño de la unidad de aprendizaje.
- Secuencia sugerida de aplicación.
- Indicadores de logro y evaluación formativa.

## 4. Recomendaciones para la implementación
- Roles y responsabilidades de los docentes.
- Sugerencias de acompañamiento pedagógico.

## 5. Conclusiones
- Principales aportes del Acelerador 4 para el diseño de unidades.

**Formato y estilo:**
- Redacta en un tono técnico-profesional, claro y coherente.
- Usa encabezados y subencabezados en Markdown (`##` y `###`), listas ordenadas o no ordenadas cuando corresponda.
- Evita el uso excesivo de negritas; reserva **negrita** solo para términos clave.
- Evita párrafos mayores a 6 líneas.
- Si es posible según insumos, incluye 1–2 referencias normativas o curriculares (CNEB, MINEDU) en las secciones pertinentes.
- Longitud total mínima: 1200 palabras.$$,
  'type', 'report_template',
  'version', '3.0'
),
updated_at = now()
WHERE name = 'plantilla7_informe_ac4';