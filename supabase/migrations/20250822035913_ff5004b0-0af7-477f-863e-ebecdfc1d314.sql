-- A6 Test SQL Package: Load diagnostic text >300 chars and setup unit for testing

-- 1) Load complete diagnostic and reopen unit
UPDATE unidades_aprendizaje
SET
  diagnostico_text = 'El diagnóstico pedagógico recoge información de la realidad de los estudiantes y de la comunidad educativa. Se observa brecha en comprensión de textos informativos y en la argumentación oral, así como oportunidades para integrar proyectos vinculados con la gestión responsable del agua en el entorno local. Los estudiantes muestran interés por problemáticas ambientales cercanas (residuos, cuidado de riberas y acceso al agua segura), pero evidencian dificultades para organizar evidencias, comunicar hallazgos y transferir lo aprendido a situaciones nuevas. Existen diferencias en el acceso a recursos tecnológicos, por lo que se recomienda una planificación flexible con alternativas sin conectividad y con materiales de bajo costo. La escuela cuenta con apoyo de la municipalidad y de familias para actividades comunitarias, lo que permitiría articular acciones de aprendizaje-servicio. Se sugiere priorizar pocas capacidades por competencia, incluir una breve evaluación diagnóstica al inicio de la unidad, y promover el trabajo colaborativo con roles rotativos y rúbricas simples. Este diagnóstico, aunque útil, debe complementarse con evidencias de lectura inicial y un breve sondeo de conocimientos previos sobre uso responsable del agua.',
  estado = 'BORRADOR',           
  closed_at = NULL,
  updated_at = NOW()
WHERE id = '6d1ce8da-9067-4092-b9e1-65b40b873f37';

-- 2) Complete required fields for testing
UPDATE unidades_aprendizaje
SET
  proposito = COALESCE(NULLIF(proposito,''),'Desarrollar capacidades de análisis y comunicación a partir de situaciones contextualizadas sobre uso responsable del agua.'),
  evidencias = COALESCE(NULLIF(evidencias,''),'Informe breve por equipo y presentación con argumentos sustentados.'),
  numero_sesiones = COALESCE(numero_sesiones, 4),
  duracion_min = COALESCE(duracion_min, 60)
WHERE id = '6d1ce8da-9067-4092-b9e1-65b40b873f37';