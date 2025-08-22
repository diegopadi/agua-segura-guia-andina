-- Populate test data for A6 diagnostico_text (>300 chars) to enable UI testing
UPDATE unidades_aprendizaje 
SET diagnostico_text = 'Este es un diagnóstico pedagógico completo del contexto educativo de la institución. Los estudiantes presentan diversas necesidades de aprendizaje que requieren atención diferenciada. El análisis del rendimiento académico muestra que aproximadamente el 60% de los estudiantes se encuentra en el nivel de proceso, mientras que un 25% está en logro esperado y un 15% necesita reforzamiento. Las competencias matemáticas requieren mayor fortalecimiento, especialmente en resolución de problemas. En cuanto al área de comunicación, los estudiantes muestran dificultades en la comprensión lectora de textos expositivos y argumentativos. El contexto socioeconómico de las familias es diverso, con un 40% proveniente de hogares con recursos limitados. La infraestructura educativa cuenta con aulas equipadas pero requiere mejoras en los espacios de laboratorio. Los docentes han participado en programas de capacitación continua y muestran compromiso con la mejora de los aprendizajes.'
WHERE user_id IN (
  SELECT id FROM auth.users LIMIT 1
) 
AND estado = 'BORRADOR';