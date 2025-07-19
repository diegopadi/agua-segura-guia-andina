
-- Actualizar la plantilla acelerador_2_instrument_design con keys y propiedades requeridas
UPDATE templates 
SET content = '{
  "title": "Configuración del Instrumento de Evaluación Diagnóstica",
  "description": "Define los parámetros para generar una encuesta diagnóstica personalizada",
  "questions": [
    {
      "key": "areas_curriculares",
      "text": "¿Qué áreas curriculares quieres evaluar en el diagnóstico?",
      "type": "multiple_choice",
      "required": true,
      "options": [
        "Ciencias Naturales",
        "Matemáticas",
        "Lenguaje y Comunicación",
        "Ciencias Sociales",
        "Educación Ambiental",
        "Tecnología e Informática"
      ]
    },
    {
      "key": "grados_escolares",
      "text": "¿Para qué grados escolares será aplicado el diagnóstico?",
      "type": "multiple_choice",
      "required": true,
      "options": [
        "Primaria (1° a 5°)",
        "Secundaria básica (6° a 9°)",
        "Secundaria media (10° a 11°)",
        "Todos los grados"
      ]
    },
    {
      "key": "formato_encuesta",
      "text": "¿Qué formato prefieres para la encuesta?",
      "type": "single_choice",
      "required": true,
      "options": [
        "Preguntas cortas de opción múltiple",
        "Preguntas abiertas reflexivas",
        "Combinación de ambas",
        "Formato visual con imágenes"
      ]
    },
    {
      "key": "numero_preguntas",
      "text": "¿Cuántas preguntas aproximadamente quieres incluir?",
      "type": "number",
      "required": true
    },
    {
      "key": "tiempo_aplicacion",
      "text": "¿Cuánto tiempo tendrán los estudiantes para completar la encuesta? (en minutos)",
      "type": "number",
      "required": true
    },
    {
      "key": "enfoque_contenido",
      "text": "¿Qué aspectos de la seguridad hídrica quieres priorizar?",
      "type": "multiple_choice",
      "required": true,
      "options": [
        "Conocimientos básicos sobre el agua",
        "Problemáticas ambientales locales",
        "Hábitos de consumo responsable",
        "Conservación y cuidado del agua",
        "Calidad del agua y salud",
        "Ciclo del agua y ecosistemas"
      ]
    },
    {
      "key": "nivel_complejidad",
      "text": "¿Qué nivel de complejidad debe tener el diagnóstico?",
      "type": "single_choice",
      "required": true,
      "options": [
        "Básico - Conceptos fundamentales",
        "Intermedio - Análisis y reflexión",
        "Avanzado - Pensamiento crítico y propuestas"
      ]
    },
    {
      "key": "contexto_especifico",
      "text": "Describe brevemente el contexto específico de tu institución educativa (ubicación, problemáticas hídricas locales, etc.)",
      "type": "text",
      "required": false
    },
    {
      "key": "objetivos_especificos",
      "text": "¿Tienes objetivos específicos adicionales para este diagnóstico?",
      "type": "text",
      "required": false
    }
  ]
}'
WHERE name = 'acelerador_2_instrument_design';
