-- Modificar el constraint de tipo_proyecto para incluir 2D
ALTER TABLE cnpie_proyectos DROP CONSTRAINT IF EXISTS cnpie_proyectos_tipo_proyecto_check;
ALTER TABLE cnpie_proyectos ADD CONSTRAINT cnpie_proyectos_tipo_proyecto_check CHECK (tipo_proyecto IN ('2A', '2B', '2C', '2D'));