// Default APP_CONFIG_A4 data: estrategias repo and report template
// This is used to seed app_configs when missing or empty
// Default APP_CONFIG_A4 data: estrategias repo and report template (seguridad hídrica)
// This is used to seed app_configs when missing or to replace via admin action
export const APP_CONFIG_A4_DEFAULT = {
  estrategias_repo: {
    items: [
      {
        id: 'observacion-guiada-fuentes',
        nombre: 'Observación guiada de fuentes de agua en el entorno',
        descripcion: 'Salida corta al patio/entorno inmediato para identificar puntos de agua, escurrimientos, zonas húmedas, vegetación indicadora y evidencias de contaminación. Registro en bitácora con croquis y checklist; cierre con puesta en común de hallazgos y primeras hipótesis sobre riesgos y usos del agua en la IE.',
        momento_sugerido: ['inicio'],
        etiquetas: ['indagacion','trabajo-de-campo','diagnostico'],
        recursos: ['bitacoras','lupas opcionales','cinta para delimitar','celulares para fotos'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'mapa-riesgos-agua',
        nombre: 'Mapa participativo de riesgos y usos del agua',
        descripcion: 'En equipo, elaborar un mapa del patio y aulas marcando puntos de consumo, riesgo (encharcamientos, fugas), y oportunidades (reuso, infiltración). Priorizar dos problemas y dos oportunidades para el ciclo de mejora.',
        momento_sugerido: ['inicio','desarrollo'],
        etiquetas: ['aprendizaje-basado-en-problemas','colaborativo','visual'],
        recursos: ['papelografo','stickers','cinta','marcadores'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'experimento-filtracion',
        nombre: 'Mini-experimento de filtración e infiltración',
        descripcion: 'Construcción de filtros caseros comparando materiales (arena, grava, carbón, tela). Medición de turbidez relativa y tiempo de filtrado. Discusión sobre potabilización básica y límites de la técnica en contexto escolar.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['experimento','cyt','manos-a-la-obra'],
        recursos: ['botellas PET','tijeras','arena','grava','carbon activado','tela','cronometro'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'ruta-agua-en-la-ie',
        nombre: 'Ruta del agua en la IE',
        descripcion: 'Trazar el recorrido del agua: ingreso (cisterna/red), almacenamiento, distribución a servicios higiénicos y lavamanos, y salida a desagüe. Identificar puntos críticos de desperdicio y acciones de mejora de bajo costo.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['proyecto','estudio-de-caso-local','gestion-escolar'],
        recursos: ['planos simples','visitas guiadas','checklist'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'campana-cultura-del-agua',
        nombre: 'Campaña ‘Cultura del Agua’',
        descripcion: 'Diseño de mensajes, afiches y micro-demostraciones para promover uso responsable del agua (lavado de manos eficiente, cierre de caños, reporte de fugas). Integrar roles estudiantiles y cronograma.',
        momento_sugerido: ['cierre'],
        etiquetas: ['comunicacion','participacion-estudiantil','ciudadania'],
        recursos: ['plantillas de afiches','impresion o mural','rubrica de impacto'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'metacognicion-y-evidencias',
        nombre: 'Cierre metacognitivo con evidencias',
        descripcion: 'Revisión de bitácoras, fotos antes/después y compromisos. Ronda de metacognición (qué aprendimos, qué cambió en la IE, próximos pasos).',
        momento_sugerido: ['cierre'],
        etiquetas: ['metacognicion','evaluacion-formativa','portafolio'],
        recursos: ['bitacoras','galeria de evidencias','guia de preguntas'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      }
    ]
  },
  plantilla_informe_ac4: {
    titulo: 'Estrategias Pedagógicas para la Seguridad Hídrica – {{ie_nombre}}',
    intro: 'Este informe recoge estrategias seleccionadas/adaptadas a partir de prioridades docentes y del repositorio basado en la metodología ecología en el patio de la escuela.',
    estructura: {
      parte_1: ['portada','introduccion','estrategia_1','estrategia_2'],
      parte_2: ['estrategia_3','estrategia_4'],
      parte_3: ['estrategia_5','estrategia_6']
    },
    insumos_para_a5: [
      'Situación significativa (borrador)',
      'Recursos/ambientes y riesgos',
      'Productos esperados y evidencias',
      'Vínculos con PCI/PEI/PAT'
    ]
  }
};
