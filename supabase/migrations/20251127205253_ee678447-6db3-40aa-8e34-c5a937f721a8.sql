-- Eliminar rúbricas existentes para reconstruir con datos correctos
DELETE FROM cnpie_rubricas WHERE categoria IN ('2A', '2B', '2C', '2D');

-- =============================================
-- CATEGORÍA 2A: PROYECTOS CONSOLIDADOS (100 pts)
-- Criterios: Intencionalidad (25), Originalidad (30), Impacto (20), Sostenibilidad (25)
-- =============================================
INSERT INTO cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, orden, descripcion) VALUES
-- Intencionalidad (25 pts)
('2A', 'Intencionalidad', '1.1 Caracteriza el problema central o desafío, incluyendo causas y consecuencias con evidencias, vinculado a competencias del CNEB.', 15, 1, 'Problema y diagnóstico'),
('2A', 'Intencionalidad', '1.2 Formula objetivo general y específicos vinculados a la solución del problema (SMART).', 10, 2, 'Objetivos'),
-- Originalidad (30 pts)
('2A', 'Originalidad', '2.1 Describe la metodología o estrategia innovadora y su vinculación con el objetivo principal.', 10, 3, 'Metodología'),
('2A', 'Originalidad', '2.2 Describe el procedimiento metodológico con video (máx 3 min) resaltando originalidad y pertinencia.', 20, 4, 'Procedimiento y video'),
-- Impacto (20 pts)
('2A', 'Impacto', '3.1 Sustenta con evidencias los resultados obtenidos vinculados al objetivo y competencias.', 10, 5, 'Resultados con evidencias'),
('2A', 'Impacto', '3.2 Explica los cambios logrados en práctica docente, gestión escolar y comunidad educativa.', 10, 6, 'Cambios logrados'),
-- Sostenibilidad (25 pts)
('2A', 'Sostenibilidad', '4.1 Describe estrategias para fomentar continuidad y cultura de innovación con evidencias.', 10, 7, 'Estrategias de continuidad'),
('2A', 'Sostenibilidad', '4.2 Describe estrategias para viabilidad y permanencia de mejoras orientadas a aprendizajes.', 10, 8, 'Viabilidad'),
('2A', 'Sostenibilidad', '4.3 Describe utilidad de bienes y servicios para sostenibilidad a largo plazo.', 5, 9, 'Bienes y servicios');

-- =============================================
-- CATEGORÍA 2B: PROYECTOS EN PROCESO (100 pts)
-- Criterios: Intencionalidad (25), Originalidad (30), Pertinencia (10), Impacto (20), Sostenibilidad (15)
-- =============================================
INSERT INTO cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, orden, descripcion) VALUES
-- Intencionalidad (25 pts)
('2B', 'Intencionalidad', '1.1 Caracteriza el problema central o desafío, incluyendo causas y consecuencias con evidencias, vinculado a competencias del CNEB.', 15, 1, 'Problema y diagnóstico'),
('2B', 'Intencionalidad', '1.2 Formula objetivo general y específicos vinculados a la solución del problema (SMART).', 10, 2, 'Objetivos'),
-- Originalidad (30 pts)
('2B', 'Originalidad', '2.1 Describe la metodología o estrategia innovadora y su vinculación con el objetivo principal.', 10, 3, 'Metodología'),
('2B', 'Originalidad', '2.2 Describe el procedimiento metodológico con video (máx 3 min) resaltando originalidad y pertinencia.', 20, 4, 'Procedimiento y video'),
-- Pertinencia (10 pts)
('2B', 'Pertinencia', '3.1 Describe cómo el proyecto responde a intereses y necesidades de la comunidad educativa.', 5, 5, 'Respuesta a necesidades'),
('2B', 'Pertinencia', '3.2 Describe cómo el proyecto se adapta al contexto cultural, social y lingüístico con equidad.', 5, 6, 'Adaptación al contexto'),
-- Impacto (20 pts)
('2B', 'Impacto', '4.1 Sustenta con evidencias los resultados obtenidos vinculados al objetivo y competencias.', 10, 7, 'Resultados con evidencias'),
('2B', 'Impacto', '4.2 Explica los cambios logrados en práctica docente, gestión escolar y comunidad educativa.', 10, 8, 'Cambios logrados'),
-- Sostenibilidad (15 pts)
('2B', 'Sostenibilidad', '5.1 Describe estrategias para viabilidad y permanencia de mejoras orientadas a aprendizajes.', 10, 9, 'Viabilidad'),
('2B', 'Sostenibilidad', '5.2 Describe utilidad de bienes y servicios para sostenibilidad a largo plazo.', 5, 10, 'Bienes y servicios');

-- =============================================
-- CATEGORÍA 2C: PROYECTOS PROMISORIOS (100 pts)
-- Criterios: Intencionalidad (25), Originalidad (30), Pertinencia (10), Participación (10), Reflexión (10), Sostenibilidad (15)
-- =============================================
INSERT INTO cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, orden, descripcion) VALUES
-- Intencionalidad (25 pts)
('2C', 'Intencionalidad', '1.1 Caracteriza el problema central o desafío, incluyendo causas y consecuencias, vinculado a competencias del CNEB.', 15, 1, 'Problema y diagnóstico'),
('2C', 'Intencionalidad', '1.2 Formula objetivo general y específicos vinculados a la solución del problema (SMART).', 10, 2, 'Objetivos'),
-- Originalidad (30 pts)
('2C', 'Originalidad', '2.1 Describe la metodología o estrategia innovadora que implementarán y su vinculación con el objetivo.', 10, 3, 'Metodología'),
('2C', 'Originalidad', '2.2 Describe el procedimiento metodológico resaltando originalidad y pertinencia de herramientas.', 20, 4, 'Procedimiento'),
-- Pertinencia (10 pts)
('2C', 'Pertinencia', '3.1 Describe cómo el proyecto responde a intereses y necesidades de la comunidad educativa.', 5, 5, 'Respuesta a necesidades'),
('2C', 'Pertinencia', '3.2 Describe cómo el proyecto se adapta al contexto cultural, social y lingüístico con equidad.', 5, 6, 'Adaptación al contexto'),
-- Participación (10 pts)
('2C', 'Participación', '4.1 Identifica actores clave y define roles vinculados a las acciones del procedimiento metodológico.', 10, 7, 'Actores y roles'),
-- Reflexión (10 pts)
('2C', 'Reflexión', '5.1 Describe mecanismos para promover espacios de reflexión y toma de decisiones para mejora continua.', 10, 8, 'Mecanismos de reflexión'),
-- Sostenibilidad (15 pts)
('2C', 'Sostenibilidad', '6.1 Describe estrategias para viabilidad y permanencia de mejoras orientadas a aprendizajes.', 10, 9, 'Viabilidad'),
('2C', 'Sostenibilidad', '6.2 Describe utilidad de bienes y servicios para sostenibilidad a largo plazo.', 5, 10, 'Bienes y servicios');

-- =============================================
-- CATEGORÍA 2D: INVESTIGACIÓN-ACCIÓN PARTICIPATIVA (100 pts)
-- Criterios: Intencionalidad (45), Participación (10), Reflexión (10), Consistencia (35)
-- =============================================
INSERT INTO cnpie_rubricas (categoria, criterio, indicador, puntaje_maximo, orden, descripcion) VALUES
-- Intencionalidad (45 pts)
('2D', 'Intencionalidad', '1.1 Identifica el problema de investigación, causas y consecuencias con evidencias cualitativas y cuantitativas.', 15, 1, 'Problema de investigación'),
('2D', 'Intencionalidad', '1.2 Justifica la necesidad, importancia y relevancia de la investigación para la transformación educativa.', 10, 2, 'Justificación'),
('2D', 'Intencionalidad', '1.3 Formula preguntas de investigación principal y específicas vinculadas al problema.', 10, 3, 'Preguntas de investigación'),
('2D', 'Intencionalidad', '1.4 Formula objetivo general y específicos en relación con el problema y preguntas.', 10, 4, 'Objetivos'),
-- Participación (10 pts)
('2D', 'Participación', '2.1 Identifica actores del equipo de investigación y describe roles en el marco IAPE.', 10, 5, 'Actores y roles'),
-- Reflexión (10 pts)
('2D', 'Reflexión', '3.1 Sustenta estrategias para promover participación activa y reflexión dialógica en marco IAPE.', 10, 6, 'Estrategias de reflexión'),
-- Consistencia (35 pts)
('2D', 'Consistencia', '4.1 Describe procedimiento metodológico cíclico para alcanzar objetivos en marco IAPE.', 10, 7, 'Procedimiento metodológico'),
('2D', 'Consistencia', '4.2 Describe técnicas e instrumentos de recolección y análisis de datos vinculados a objetivos.', 10, 8, 'Técnicas e instrumentos'),
('2D', 'Consistencia', '4.3 Presenta plan de actividades y responsabilidades vinculado a objetivos.', 10, 9, 'Plan de actividades'),
('2D', 'Consistencia', '4.4 Describe utilidad de bienes y servicios para sostenibilidad a largo plazo.', 5, 10, 'Bienes y servicios');