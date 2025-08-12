
-- Upsert de APP_CONFIG_A4 con repositorio de estrategias y plantilla del informe (idempotente)
INSERT INTO public.app_configs AS c (key, version, data)
VALUES (
  'APP_CONFIG_A4',
  'v1',
  $${
    "version": "v1",
    "estrategias_repo": {
      "version": "v1",
      "items": [
        {
          "code": "EH-TEST-001",
          "name": "Ruta del agua en la IE",
          "objective": "Identificar puntos de consumo y posibles fugas en la escuela",
          "description": "Descripción larga de prueba...",
          "scope_suggestion": "desarrollo",
          "materials": ["botellas medidoras","cinta métrica","planos"],
          "hydric_adaptations": "Enfoque en uso responsable y reporte de consumos.",
          "evidence": ["mapa de puntos de agua","registro de caudales"],
          "notes": "Requiere permisos para zonas restringidas",
          "version": "v1"
        },
        {
          "code": "EH-TEST-002",
          "name": "Compromisos ambientales colectivos",
          "objective": "Consolidar acuerdos de mejora del entorno escolar relacionados con el agua",
          "description": "Descripción larga de prueba...",
          "scope_suggestion": "cierre",
          "materials": ["cartulina","marcadores","mural"],
          "hydric_adaptations": "Foco en cultura del agua y corresponsabilidad.",
          "evidence": ["acta de compromisos","mural de acuerdos"],
          "notes": "Alinear con tutoría y convivencia escolar",
          "version": "v1"
        }
      ]
    },
    "plantilla_informe_ac4": {
      "version": "v1",
      "titulo": "Informe de Estrategias (AC4)",
      "intro": "Plantilla base para el informe de estrategias seleccionadas y adaptadas.",
      "estructura": {
        "parte_1": ["portada","introduccion","estrategia_1","estrategia_2"],
        "parte_2": ["estrategia_3","estrategia_4"],
        "parte_3": ["estrategia_5","estrategia_6"],
        "insumos_para_a5": ["situacion_sintesis"]
      }
    }
  }$$::jsonb
)
ON CONFLICT (key) DO UPDATE
SET
  version = EXCLUDED.version,
  data = EXCLUDED.data,
  updated_at = now();
