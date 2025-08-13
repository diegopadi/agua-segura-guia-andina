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
        descripcion: 'Recorrido breve por patio/entorno para identificar puntos de agua, escurrimientos, zonas húmedas, vegetación indicadora y señales de contaminación. Registro en bitácora con croquis y checklist; puesta en común de hallazgos e hipótesis iniciales sobre riesgos y usos del agua en la IE.',
        momento_sugerido: ['inicio'],
        etiquetas: ['indagacion','trabajo-de-campo','diagnostico'],
        recursos: ['bitacoras','cinta para delimitar','celulares para fotos'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'caja-preguntas-agua-segura',
        nombre: 'Caja de preguntas sobre agua segura',
        descripcion: 'Activación con tarjetas de preguntas gatillo (¿Cómo sabemos si el agua es segura? ¿Qué la contamina? ¿Cómo se potabiliza en la IE?). Priorización rápida de dudas para orientar la indagación.',
        momento_sugerido: ['inicio'],
        etiquetas: ['preguntas-guiadas','activacion','pensamiento-critico'],
        recursos: ['tarjetas','pizarron','marcadores'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'diagnostico-habitos-consumo',
        nombre: 'Diagnóstico rápido de hábitos de consumo',
        descripcion: 'Lluvia de ideas y checklist sobre hábitos de uso del agua (lavado de manos, cierre de caños, reportes de fugas). Se construye una línea base de prácticas en la IE.',
        momento_sugerido: ['inicio'],
        etiquetas: ['diagnostico','participacion','cultura-del-agua'],
        recursos: ['checklist','post-its','pizarron'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'analisis-imagenes-casos',
        nombre: 'Historias visuales de seguridad hídrica',
        descripcion: 'Análisis guiado de imágenes/videos cortos sobre problemas y soluciones locales de agua segura; identificación de causas, efectos y posibles respuestas en la IE.',
        momento_sugerido: ['inicio'],
        etiquetas: ['estudio-de-caso','visual','pensamiento-sistemico'],
        recursos: ['proyector o impresiones','fichas de análisis'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'linea-tiempo-agua-comunidad',
        nombre: 'Línea de tiempo del agua en mi comunidad',
        descripcion: 'Construcción colaborativa de una línea de tiempo sobre acceso, calidad y gestión del agua en la localidad (cambios, hitos y actores).',
        momento_sugerido: ['inicio'],
        etiquetas: ['contextualizacion','historia-local','colaborativo'],
        recursos: ['papelografo','marcadores','stickers de hitos'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'lluvia-ideas-problemas-oportunidades',
        nombre: 'Lluvia de ideas: problemas y oportunidades',
        descripcion: 'Identificación participativa de problemas (fugas, encharcamientos, falta de cloro) y oportunidades (reuso, captación de lluvia) para enfocar el ciclo de mejora.',
        momento_sugerido: ['inicio'],
        etiquetas: ['activacion','ABP','priorizacion'],
        recursos: ['post-its','matriz prioridad/impacto'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },

      {
        id: 'experimento-filtracion',
        nombre: 'Mini-experimento de filtración e infiltración',
        descripcion: 'Construcción de filtros caseros (arena, grava, carbón, tela) para comparar tiempos y turbidez relativa. Discusión sobre límites y uso seguro en contexto escolar.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['experimento','C y T','manos-a-la-obra'],
        recursos: ['botellas PET','arena','grava','carbon activado','tela','cronometro'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'estaciones-aprendizaje-agua',
        nombre: 'Estaciones de aprendizaje del agua',
        descripcion: 'Rotación por estaciones: medición de pH, cloro libre con tiras reactivas, observación de sólidos, lectura de infografías de potabilización. Registro por equipo.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['estaciones','indagacion','colaborativo'],
        recursos: ['tiras reactivas de pH/cloro','vasos transparentes','fichas de registro'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'ruta-agua-en-la-ie',
        nombre: 'Ruta del agua en la IE',
        descripcion: 'Trazado del recorrido del agua (ingreso, almacenamiento, distribución, desagüe). Identificación de puntos críticos de desperdicio y mejoras de bajo costo.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['proyecto','estudio-de-caso-local','gestion-escolar'],
        recursos: ['croquis o plano simple','checklist','cámara'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'auditoria-hidrica-escolar',
        nombre: 'Auditoría hídrica escolar',
        descripcion: 'Medición sencilla de consumos (observación de tiempos de uso, conteo de descargas, estimaciones por caudal) y reporte con propuestas de ahorro y mantenimiento.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['ABP','datos','mejora-continua'],
        recursos: ['cronometro','fichas de conteo','tabla de caudales estimados'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'pruebas-basicas-potabilidad',
        nombre: 'Pruebas básicas de potabilidad',
        descripcion: 'Uso de tiras reactivas seguras (pH, cloro libre) y observación de parámetros visibles (olor/color). Discusión sobre límites de estas pruebas y protocolos de seguridad.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['indagacion','C y T','seguridad'],
        recursos: ['tiras reactivas','vasos','guantes desechables'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'proyecto-aps-agua',
        nombre: 'Proyecto de Aprendizaje-Servicio: agua segura',
        descripcion: 'Diseño e implementación de una acción concreta (señalética de cierre de caños, kit de reporte de fugas, rutina de lavado de manos eficiente) con la comunidad educativa.',
        momento_sugerido: ['desarrollo'],
        etiquetas: ['ApS','ciudadania','interdisciplinar'],
        recursos: ['materiales de señalizacion','plantillas','rubrica de servicio'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },

      {
        id: 'campana-cultura-del-agua',
        nombre: 'Campaña ‘Cultura del Agua’',
        descripcion: 'Mensajes, afiches y micro-demostraciones para promover uso responsable (lavado de manos eficiente, cierre de caños, reporte de fugas). Roles y cronograma.',
        momento_sugerido: ['cierre'],
        etiquetas: ['comunicacion','participacion-estudiantil','ciudadania'],
        recursos: ['plantillas de afiches','mural o impresión','rubrica de impacto'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'feria-del-agua',
        nombre: 'Feria del agua',
        descripcion: 'Exposición de productos (afiches, prototipos, reportes) y demostraciones breves a otras aulas/familias. Recogida de retroalimentación mediante tarjetas.',
        momento_sugerido: ['cierre'],
        etiquetas: ['difusion','portafolio','vinculo-comunidad'],
        recursos: ['mesas de exhibicion','carteles','tarjetas de feedback'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'debate-decisiones-comite',
        nombre: 'Debate de decisiones (simulación de comité)',
        descripcion: 'Debate guiado sobre priorización de acciones (reparar fuga vs. comprar dispensadores, etc.), considerando impacto, costo y viabilidad.',
        momento_sugerido: ['cierre'],
        etiquetas: ['debate','pensamiento-critico','toma-de-decisiones'],
        recursos: ['guion de roles','matriz de decisiones','cronometro'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'bitacora-metacognitiva',
        nombre: 'Bitácora metacognitiva',
        descripcion: 'Síntesis escrita o audiovisual de aprendizajes, dificultades superadas y próximos pasos; relación con compromisos personales y del aula.',
        momento_sugerido: ['cierre'],
        etiquetas: ['metacognicion','evaluacion-formativa','autorregulacion'],
        recursos: ['formatos de bitacora','galeria de evidencias'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'compromisos-ruta-seguimiento',
        nombre: 'Compromisos y ruta de seguimiento',
        descripcion: 'Definición de acciones concretas por estudiante/equipo, responsables y fechas. Tablero visible de seguimiento y recordatorios.',
        momento_sugerido: ['cierre'],
        etiquetas: ['plan-de-accion','gestion-del-cambio','seguimiento'],
        recursos: ['tablero','formato de compromisos','calendario'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      },
      {
        id: 'panel-evidencias-antes-despues',
        nombre: 'Panel de evidencias antes/después',
        descripcion: 'Curaduría de fotos, croquis y métricas simples (p. ej., reducción de tiempos de uso) para evidenciar cambios logrados y retos pendientes.',
        momento_sugerido: ['cierre'],
        etiquetas: ['evidencias','comunicacion','mejora-continua'],
        recursos: ['impresiones/fotos','marcos o panel','etiquetas'],
        referencia: "Basado en la 'Guía metodológica para la enseñanza de ecología en el patio de la escuela'."
      }
    ]
  },
  plantilla_informe_ac4: {
    titulo: 'Estrategias Pedagógicas para la Seguridad Hídrica – {{ie_nombre}}',
    intro: "Informe generado a partir de prioridades del Acelerador 3 y estrategias del repositorio basado en la metodología 'ecología en el patio de la escuela'. Incorpora adaptación al contexto del docente.",
    estructura: {
      parte_1: ['portada','introduccion','estrategia_1','estrategia_2'],
      parte_2: ['estrategia_3','estrategia_4'],
      parte_3: ['estrategia_5','estrategia_6']
    },
    insumos_para_a5: [
      'Situación significativa (borrador)',
      'Recursos y ambientes de aprendizaje',
      'Riesgos y cuidados (seguridad en campo)',
      'Productos esperados y evidencias',
      'Vínculos con PCI/PEI/PAT'
    ]
  }
};
