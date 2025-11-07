-- Migración 1: Agregar campo documentos_postulacion a cnpie_proyectos
ALTER TABLE cnpie_proyectos 
ADD COLUMN IF NOT EXISTS documentos_postulacion JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cnpie_proyectos.documentos_postulacion IS 
'Documentos subidos en la selección de tipo de proyecto. Estructura: [{id, nombre, url, tipo, tamaño_bytes, fecha_subida, descripcion?}]';

-- Migración 2: Agregar campo original_name a files
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS original_name TEXT;

COMMENT ON COLUMN files.original_name IS 
'Nombre original del archivo subido por el usuario, antes de sanitización';

-- Migración 3: Actualizar original_name para archivos existentes
UPDATE files 
SET original_name = split_part(url, '/', -1)
WHERE original_name IS NULL;