-- Corregir plantilla8_profundizacion_ac4 con formato correcto
UPDATE templates 
SET content = jsonb_build_object(
  'system_prompt', 'Eres un asesor pedagógico especializado en análisis de estrategias metodológicas. Tu tarea es formular exactamente 3 preguntas de profundización que ayuden a evaluar y ajustar estrategias metodológicas según el contexto específico del aula.',
  'user_prompt', 'Basándote en las siguientes estrategias metodológicas y el contexto educativo proporcionado:

**Contexto:**
- Grado: {{grado}}
- Área: {{area}}
- Competencia: {{competencia}}

**Estrategias seleccionadas:**
{{estrategias}}

**Contexto adicional:**
{{contexto_adicional}}

Formula exactamente 3 preguntas específicas que permitan:
1. **Pertinencia**: Validar si las estrategias son apropiadas para el contexto cultural y educativo específico
2. **Viabilidad**: Evaluar la factibilidad de implementación con los recursos disponibles
3. **Complejidad**: Ajustar el nivel de dificultad según las características de los estudiantes

**FORMATO DE SALIDA REQUERIDO:**
Responde únicamente con un JSON válido en este formato:
```json
{
  "preguntas": [
    {
      "id": 1,
      "enfoque": "pertinencia",
      "pregunta": "Pregunta específica sobre pertinencia cultural y contextual"
    },
    {
      "id": 2, 
      "enfoque": "viabilidad",
      "pregunta": "Pregunta específica sobre viabilidad de recursos y tiempo"
    },
    {
      "id": 3,
      "enfoque": "complejidad", 
      "pregunta": "Pregunta específica sobre nivel de complejidad apropiado"
    }
  ]
}
```

Las preguntas deben ser concretas, orientadas a la acción y que permitan al docente reflexionar sobre la implementación efectiva de las estrategias en su contexto específico.',
  'type', 'ai_prompt',
  'version', '2.0'
)
WHERE name = 'plantilla8_profundizacion_ac4';

-- Actualizar plantilla7_informe_ac4 para incluir respuestas de profundización
UPDATE templates 
SET content = jsonb_build_object(
  'system_prompt', 'Eres un especialista en diseño pedagógico. Generas informes técnicos detallados sobre estrategias metodológicas que incorporan análisis de profundización basado en respuestas del docente.',
  'user_prompt', 'Genera un informe técnico completo sobre las estrategias metodológicas seleccionadas, incorporando el análisis de profundización realizado.

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

Estructura el informe con las siguientes secciones:

## 1. Marco Normativo y Curricular
## 2. Estrategias Metodológicas Seleccionadas  
## 3. Análisis de Pertinencia Cultural
## 4. Evaluación de Viabilidad
## 5. Ajustes de Complejidad
## 6. Conexión con Necesidades Priorizadas
## 7. Recomendaciones de Implementación
## 8. Insumos para Planificación (Acelerador 5)

Cada sección debe ser detallada, técnica y basada en evidencia pedagógica. Incorpora las respuestas del análisis de profundización en las secciones correspondientes.',
  'type', 'report_template',
  'version', '2.0'
)
WHERE name = 'plantilla7_informe_ac4';