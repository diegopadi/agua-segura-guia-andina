-- Update Template 6: Generador de Estrategias Didácticas
UPDATE public.templates
SET content = '{
  "type": "ai_prompt",
  "version": "1.1",
  "prompt": "Eres un especialista en metodologías activas. Usando **solo** estos documentos embebidos:\n  • Cartilla \"¿Cómo planificar el proceso de enseñanza-aprendizaje y evaluación formativa?\" (DIGEBR-MINEDU, 2017)\n  • Orientaciones para el uso de unidades didácticas y sesiones de aprendizaje (MINEDU)\n**DATOS DE ENTRADA:**\n  grado: {{grado}}\n  área: {{area}}\n  competencia: {{competencia}}\n  contexto: {{contexto}}\n**INSTRUCCIONES:**\n1. Extrae **textualmente** 6 estrategias activas de los documentos oficiales.\n2. Organízalas así:\n   - 2 para el **inicio**\n   - 2 para el **desarrollo**\n   - 2 para el **cierre**\n3. A cada estrategia agrégale la referencia exacta (documento y página).\n**FORMATO DE SALIDA:**\n```json\n[\n  {\n    \"momento\": \"inicio\",\n    \"estrategia\": \"…texto exacto…\",\n    \"referencia\": \"Cartilla DIGEBR-MINEDU p.23\"\n  },\n  …\n]\n```"
}'::jsonb,
updated_at = now()
WHERE name = 'plantilla6_estrategias_ac4';

-- Update Template 7: Informe de Estrategias Metodológicas
UPDATE public.templates
SET content = '{
  "type": "report_template",
  "version": "1.1",
  "template": "# Informe de Estrategias Metodológicas\n\n**Grado:** {{grado}}  \n**Área:** {{area}}  \n**Competencia:** {{competencia}}  \n**Contexto:** {{contexto}}\n\n## 1. Marco Normativo\n- Cartilla DIGEBR-MINEDU (2017)  \n- Orientaciones MINEDU (unidades didácticas)\n\n## 2. Estrategias Seleccionadas\n| Momento   | Estrategia                                        | Referencia                      |\n|-----------|---------------------------------------------------|---------------------------------|\n| Inicio    | {{estrategia_1}}                                  | {{referencia_1}}                |\n| Inicio    | {{estrategia_2}}                                  | {{referencia_2}}                |\n| Desarrollo| {{estrategia_3}}                                  | {{referencia_3}}                |\n| Desarrollo| {{estrategia_4}}                                  | {{referencia_4}}                |\n| Cierre    | {{estrategia_5}}                                  | {{referencia_5}}                |\n| Cierre    | {{estrategia_6}}                                  | {{referencia_6}}                |\n\n## 3. Justificación Curricular\n- **CNEB:** Competencia {{competencia}}  \n- **PCI:** Línea estratégica institucional\n\n## 4. Conexión con Necesidades Priorizadas\n- Brecha 1: {{brecha_1}}  \n- Brecha 2: {{brecha_2}}\n\n## 5. Insumos para el Acelerador 5\n- Estrategias priorizadas: {{lista_priorizadas}}  \n- Contexto y referencias normativas"
}'::jsonb,
updated_at = now()
WHERE name = 'plantilla7_informe_ac4';

-- Update Template 8: Preguntas de Profundización
UPDATE public.templates
SET content = '{
  "type": "ai_prompt",
  "version": "1.0",
  "prompt": "Eres un asesor pedagógico. Con base en las estrategias seleccionadas y su contexto:\n  • Grado: {{grado}}\n  • Área: {{area}}\n  • Competencia: {{competencia}}\n  • Contexto: {{contexto}}\nFormula **hasta 3 preguntas** que ayuden a:\n1. Ajustar la pertinencia cultural de las estrategias.\n2. Afinar el nivel de complejidad para los estudiantes.\n3. Verificar la viabilidad de recursos y tiempos.\n**FORMATO DE SALIDA:**\n```json\n[\n  {\"id\": 1, \"pregunta\": \"…\"},\n  {\"id\": 2, \"pregunta\": \"…\"},\n  {\"id\": 3, \"pregunta\": \"…\"}\n]\n```"
}'::jsonb,
updated_at = now()
WHERE name = 'plantilla8_profundizacion_ac4';