-- Eliminar plantillas anteriores del Acelerador 2
DELETE FROM templates WHERE name IN ('acelerador_2_instrument_design', 'acelerador_2_survey_structure', 'acelerador_2_report_template');

-- Crear nueva Plantilla 3 para el Acelerador 2
INSERT INTO templates (name, content) VALUES (
  'plantilla3',
  '{
    "name": "plantilla3",
    "content": [
      {
        "bloque": "Portada y metadatos",
        "subSecciones": [
          "Título del informe",
          "Docente",
          "Institución Educativa",
          "Fecha",
          "N.º de informe"
        ],
        "indicaciones": "Campos auto-rellenados"
      },
      {
        "bloque": "Resumen del diagnóstico",
        "subSecciones": [
          "Contexto y objetivo del informe",
          "Síntesis de la información del Acelerador 1",
          "Alcance de esta etapa"
        ],
        "indicaciones": "Texto continuo, máximo 200 palabras"
      },
      {
        "bloque": "Resultados: Competencias previas",
        "subSecciones": [
          "Pregunta 1 – Desarrollo de competencias previas",
          "Pregunta 2 – Desarrollo de competencias previas",
          "Pregunta 3 – Desarrollo de competencias previas"
        ],
        "indicaciones": "Cada sección debe incluir la pregunta, respuestas cualitativas agregadas y breves ejemplos o citas"
      },
      {
        "bloque": "Resultados: Condiciones de seguridad hídrica",
        "subSecciones": [
          "Pregunta 1 – Condiciones iniciales de seguridad hídrica",
          "Pregunta 2 – Condiciones iniciales de seguridad hídrica"
        ],
        "indicaciones": "Cada sección debe incluir la pregunta, respuestas cualitativas agregadas y 1–2 insights destacados"
      },
      {
        "bloque": "Análisis de brechas",
        "subSecciones": [
          "Principales fortalezas detectadas",
          "Áreas de mejora"
        ],
        "indicaciones": "Viñetas interpretativas que contrasten competencias vs. necesidades"
      },
      {
        "bloque": "Recomendaciones pedagógicas",
        "subSecciones": [
          "Acciones inmediatas",
          "Estrategias de mediano y largo plazo"
        ],
        "indicaciones": "Listas con justificación breve (1–2 líneas por recomendación)"
      }
    ]
  }'::jsonb
);