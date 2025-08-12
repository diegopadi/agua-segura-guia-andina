// Default APP_CONFIG_A4 data: estrategias repo and report template
// This is used to seed app_configs when missing or empty
export const APP_CONFIG_A4_DEFAULT = {
  estrategias_repo: {
    items: [
      {
        id: 'e1',
        title: 'Aprendizaje Basado en Proyectos (ABP)',
        description: 'Diseño y desarrollo de proyectos interdisciplinarios orientados a resolver problemas reales del entorno.',
        tags: ['ABP','proyecto','colaborativo','interdisciplinario'],
        recursos_tic: ['computadora','internet','presentaciones'],
        momento: 'desarrollo'
      },
      {
        id: 'e2',
        title: 'Aprendizaje Basado en Problemas (ABPbl)',
        description: 'Planteamiento de problemas auténticos para desarrollar habilidades de indagación y pensamiento crítico.',
        tags: ['problemas','indagación','pensamiento crítico'],
        recursos_tic: ['buscadores','foros','documentos compartidos'],
        momento: 'desarrollo'
      },
      {
        id: 'e3',
        title: 'Estaciones de Aprendizaje',
        description: 'Rotación por estaciones con actividades diferenciadas que promueven autonomía y trabajo cooperativo.',
        tags: ['rotación','cooperativo','autonomía'],
        recursos_tic: ['tablets','apps educativas'],
        momento: 'desarrollo'
      },
      {
        id: 'e4',
        title: 'Debate Reglas de Oro',
        description: 'Discusión estructurada para argumentar con evidencias y escuchar activamente.',
        tags: ['debate','argumentación','comunicación'],
        recursos_tic: ['proyector','timer','grabación'],
        momento: 'cierre'
      },
      {
        id: 'e5',
        title: 'Clase Invertida (Flipped Classroom)',
        description: 'Estudio previo de contenidos en casa y resolución de dudas y retos en clase.',
        tags: ['flipped','autonomía','diferenciación'],
        recursos_tic: ['video','plataforma','quiz online'],
        momento: 'inicio'
      },
      {
        id: 'e6',
        title: 'Aprendizaje Servicio (ApS)',
        description: 'Proyectos que combinan aprendizaje y servicio a la comunidad con impacto real.',
        tags: ['servicio','comunidad','ciudadanía'],
        recursos_tic: ['mapas','redes','documentación'],
        momento: 'desarrollo'
      },
      {
        id: 'e7',
        title: 'Taller de Prototipado Rápido',
        description: 'Diseño y construcción de prototipos con iteraciones y retroalimentación.',
        tags: ['diseño','prototipo','iteración'],
        recursos_tic: ['impresora 3D','CAD','fotos'],
        momento: 'desarrollo'
      },
      {
        id: 'e8',
        title: 'Estudio de Casos',
        description: 'Análisis de casos reales para transferir aprendizajes a contextos diversos.',
        tags: ['casos','análisis','transferencia'],
        recursos_tic: ['documentos','presentaciones'],
        momento: 'desarrollo'
      },
      {
        id: 'e9',
        title: 'Rutinas de Pensamiento Visible',
        description: 'Activación de destrezas de pensamiento mediante rutinas breves y visibles.',
        tags: ['pensamiento','metacognición','rutinas'],
        recursos_tic: ['pizarras','notas digitales'],
        momento: 'inicio'
      },
      {
        id: 'e10',
        title: 'Galería de Productos (Exposición)',
        description: 'Socialización y evaluación de productos con criterios, rúbricas y feedback.',
        tags: ['exposición','rúbricas','feedback'],
        recursos_tic: ['galería virtual','fotografía'],
        momento: 'cierre'
      },
      {
        id: 'e11',
        title: 'Laboratorio de Indagación',
        description: 'Ciclo de hipótesis, experimentación, registro y conclusiones.',
        tags: ['indagación','experimento','registro'],
        recursos_tic: ['sensores','hojas de cálculo'],
        momento: 'desarrollo'
      },
      {
        id: 'e12',
        title: 'Aprendizaje Cooperativo (roles)',
        description: 'Estructuras cooperativas con asignación de roles y metas compartidas.',
        tags: ['cooperativo','roles','interdependencia'],
        recursos_tic: ['documentos colaborativos','timer'],
        momento: 'desarrollo'
      }
    ]
  },
  plantilla_informe_ac4: {
    titulo: 'Informe de Estrategias (AC4)',
    intro: 'Plantilla base para el informe de estrategias seleccionadas y adaptadas.',
    estructura: {
      parte_1: ['portada','introduccion','estrategia_1','estrategia_2'],
      parte_2: ['estrategia_3','estrategia_4'],
      parte_3: ['estrategia_5','estrategia_6']
    },
    insumos_para_a5: [
      'Competencias y capacidades vinculadas',
      'Recursos TIC identificados',
      'Momentos pedagógicos sugeridos'
    ]
  }
};
