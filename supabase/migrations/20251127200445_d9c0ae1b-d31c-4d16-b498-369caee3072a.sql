-- Primero eliminar el constraint existente y agregar uno nuevo que incluya 2D
ALTER TABLE cnpie_rubricas DROP CONSTRAINT IF EXISTS cnpie_rubricas_categoria_check;
ALTER TABLE cnpie_rubricas ADD CONSTRAINT cnpie_rubricas_categoria_check CHECK (categoria IN ('2A', '2B', '2C', '2D'));

-- Insertar las rúbricas para la Categoría 2D - IAPE (Investigación Acción Participativa)
INSERT INTO cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, descripcion, recomendaciones, extension_maxima, orden)
VALUES 
-- CRITERIO 1: INTENCIONALIDAD (Formulación) - 45 puntos
('2D', 'Intencionalidad', '1.1 Identifica el problema de investigación, sus causas y consecuencias sustentado con evidencias.', 15, 
 'Evalúa la identificación del problema con evidencias cualitativas y cuantitativas en el marco IAPE.',
 'Incluya evidencias de fuentes primarias y secundarias. Demuestre el proceso dialógico del equipo.', 5000, 1),

('2D', 'Intencionalidad', '1.2 Justifica la necesidad, importancia y relevancia de la investigación.', 10,
 'Evalúa la justificación vinculada a la utilidad social y transformadora.',
 'Demuestre cómo beneficiará a la comunidad educativa y al conocimiento social.', 3000, 2),

('2D', 'Intencionalidad', '1.3 Formula preguntas de investigación vinculadas al problema.', 10,
 'Evalúa la coherencia de las preguntas con el problema identificado.',
 'Formule preguntas claras: una principal amplia y específicas que descompongan la investigación.', 1500, 3),

('2D', 'Intencionalidad', '1.4 Formula objetivos guardando relación con el problema y preguntas.', 10,
 'Evalúa la coherencia de objetivos con el problema y preguntas.',
 'Los objetivos deben ser medibles y estar vinculados a las preguntas de investigación.', 1500, 4),

-- CRITERIO 2: PARTICIPACIÓN - 10 puntos
('2D', 'Participación', '2.1 Identifica actores del equipo y describe roles en el marco IAPE.', 10,
 'Evalúa la identificación de actores, roles y centralidad de estudiantes.',
 'Describa roles de docentes, estudiantes, directivos, padres. Estudiantes como protagonistas.', 3000, 5),

-- CRITERIO 3: REFLEXIÓN - 10 puntos
('2D', 'Reflexión', '3.1 Sustenta estrategias de participación activa y reflexión dialógica.', 10,
 'Evalúa las estrategias de reflexión dialógica en el marco IAPE.',
 'Describa espacios de diálogo, círculos de reflexión, grupos focales.', 3000, 6),

-- CRITERIO 4: CONSISTENCIA - 35 puntos
('2D', 'Consistencia', '4.1 Describe el procedimiento metodológico cíclico IAPE.', 10,
 'Evalúa el proceso cíclico: diagnóstico, planificación, acción, reflexión.',
 'Describa las fases cíclicas de la IAPE para mejora continua.', 6000, 7),

('2D', 'Consistencia', '4.2 Describe técnicas e instrumentos de recolección y análisis.', 10,
 'Evalúa pertinencia de técnicas e instrumentos para objetivos.',
 'Incluya técnicas cualitativas y cuantitativas coherentes con los objetivos.', 5000, 8),

('2D', 'Consistencia', '4.3 Presenta plan de actividades y responsabilidades.', 5,
 'Evalúa el plan, cronograma y asignación de responsabilidades.',
 'Presente matriz con objetivos, acciones, recursos, responsables y cronograma.', NULL, 9),

('2D', 'Consistencia', '4.4 Describe pertinencia de bienes y servicios para sostenibilidad.', 10,
 'Evalúa pertinencia de bienes y servicios para sostenibilidad.',
 'Complete tabla con componente, denominación, cantidad, precio y justificación.', 3000, 10)

ON CONFLICT DO NOTHING;