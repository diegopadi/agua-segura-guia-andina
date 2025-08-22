-- Update test data for A6 debugging
UPDATE unidades_aprendizaje 
SET 
  diagnostico_text = repeat('Texto de prueba diagnóstico pedagógico completo para activar el análisis de coherencia con IA. Este es un diagnóstico detallado que incluye información sobre el contexto educativo, las necesidades de los estudiantes y las estrategias pedagógicas necesarias. ', 20),
  estado = 'BORRADOR',
  closed_at = NULL
WHERE id = '6d1ce8da-9067-4092-b9e1-65b40b873f37';