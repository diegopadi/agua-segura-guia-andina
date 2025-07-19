
-- Actualizar el template acelerador_2_instrument_design para incluir pregunta sobre número de estudiantes
UPDATE public.templates 
SET content = jsonb_set(
  content,
  '{questions}',
  content->'questions' || '[{
    "key": "num_estudiantes_disponibles",
    "text": "¿Cuántos estudiantes tienes disponibles para aplicar la encuesta?",
    "type": "number",
    "required": true,
    "placeholder": "Ejemplo: 25"
  }]'::jsonb
)
WHERE name = 'acelerador_2_instrument_design';
