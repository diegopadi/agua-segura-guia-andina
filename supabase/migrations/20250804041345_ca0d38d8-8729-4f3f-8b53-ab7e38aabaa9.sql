-- Insert templates for Accelerator 4
INSERT INTO templates (name, content) VALUES
('plantilla6_estrategias_ac4', '{
  "name": "Generación de Estrategias Metodológicas",
  "description": "Extrae 6 estrategias pedagógicas activas de documentos MINEDU",
  "system_prompt": "Eres un experto pedagógico especializado en metodologías activas según normativa MINEDU. Tu tarea es extraer y adaptar estrategias pedagógicas de los documentos embebidos DIGEBR-MINEDU y Orientaciones MINEDU.",
  "user_prompt": "Basándote en el informe de priorización cargado y el contexto del aula (urbana/rural, multigrado/EIB, recursos TIC), extrae exactamente 6 estrategias metodológicas activas que sean:\n1. Pertinentes al contexto específico\n2. Alineadas con las competencias priorizadas\n3. Respaldadas por documentos MINEDU\n4. Viables con los recursos disponibles\n\nPara cada estrategia incluye:\n- Nombre de la estrategia\n- Descripción detallada\n- Justificación pedagógica\n- Cita del documento MINEDU de origen\n- Adaptaciones necesarias para el contexto",
  "response_format": "json",
  "expected_fields": ["strategies", "context_analysis", "minedu_references"]
}'),
('plantilla8_profundizacion_ac4', '{
  "name": "Chat y Profundización de Estrategias",
  "description": "Sistema de chat para refinar estrategias y generar preguntas de profundización",
  "system_prompt": "Eres un asistente pedagógico especializado en refinar estrategias metodológicas. Puedes conversar con el usuario para ajustar, mejorar o personalizar las estrategias generadas según sus necesidades específicas.",
  "chat_context": "El usuario ha generado 6 estrategias metodológicas y puede solicitar refinamientos, ajustes o mejoras. También puedes formular hasta 3 preguntas de profundización para afinar la pertinencia, viabilidad y nivel de complejidad.",
  "response_format": "conversational",
  "capabilities": ["refine_strategies", "generate_questions", "provide_suggestions", "adapt_to_context"]
}'),
('plantilla7_informe_ac4', '{
  "name": "Informe Final de Estrategias Metodológicas",
  "description": "Genera el informe justificativo con citas normativas",
  "system_prompt": "Eres un experto en documentación pedagógica que crea informes técnicos con respaldo normativo MINEDU. Tu tarea es consolidar todas las estrategias refinadas en un informe profesional.",
  "user_prompt": "Crea un informe completo que incluya:\n\n1. RESUMEN EJECUTIVO\n2. CONTEXTO EDUCATIVO ANALIZADO\n3. ESTRATEGIAS METODOLÓGICAS SELECCIONADAS (las 6 estrategias con descripción detallada)\n4. JUSTIFICACIÓN NORMATIVA (citas específicas de documentos MINEDU)\n5. VIABILIDAD Y RECURSOS NECESARIOS\n6. RECOMENDACIONES DE IMPLEMENTACIÓN\n7. INSUMOS PARA ACELERADOR 5 (competencias, capacidades y estrategias listas para planificación)\n\nEl informe debe ser técnico, bien estructurado y servir como insumo directo para el diseño de unidades didácticas.",
  "response_format": "structured_report",
  "output_formats": ["html", "markdown"],
  "include_citations": true
}')