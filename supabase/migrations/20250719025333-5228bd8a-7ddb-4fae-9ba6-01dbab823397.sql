
-- Corregir las opciones de grados escolares en la plantilla
UPDATE templates 
SET content = jsonb_set(
  content,
  '{questions,1,options}',
  '["3ro de secundaria", "4to de secundaria", "5to de secundaria"]'::jsonb
)
WHERE name = 'acelerador_2_instrument_design';
