interface CNPIEProject {
  id: string;
  tipo_proyecto: string;
  datos_aceleradores?: any;
  preguntas_respuestas?: any;
  diagnostico_resumen?: any;
}

interface EvaluacionData {
  puntaje_total: number;
  puntaje_maximo: number;
  porcentaje_cumplimiento: number;
  areas_fuertes: string[];
  areas_mejorar: string[];
  recomendaciones_ia: string[];
  puntajes_criterios: any;
}

export async function generateCNPIEPDF(
  proyecto: CNPIEProject,
  evaluacion: EvaluacionData | null
): Promise<void> {
  // Create a formatted HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proyecto CNPIE ${proyecto.tipo_proyecto}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #005C6B;
          border-bottom: 3px solid #00A6A6;
          padding-bottom: 10px;
        }
        h2 {
          color: #00A6A6;
          margin-top: 30px;
        }
        h3 {
          color: #1BBEAE;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .badge {
          background: #1BBEAE;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          display: inline-block;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        th {
          background: #005C6B;
          color: white;
        }
        .highlight {
          background: #E6F4F1;
          padding: 15px;
          border-left: 4px solid #00A6A6;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <h1>Proyecto CNPIE ${proyecto.tipo_proyecto} - Documentación Completa</h1>
      <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
      
      ${generateDiagnosticoSection(proyecto)}
      ${generateAcceleradoresSection(proyecto)}
      ${evaluacion ? generateEvaluacionSection(evaluacion) : ''}
      
      <div class="section">
        <h2>Nota Final</h2>
        <div class="highlight">
          Este documento ha sido generado automáticamente por el sistema de Aceleradores Pedagógicos.
          Contiene toda la información ingresada durante el proceso de sistematización del proyecto.
        </div>
      </div>
    </body>
    </html>
  `;

  // Create a blob and download it
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CNPIE_${proyecto.tipo_proyecto}_${new Date().getTime()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateDiagnosticoSection(proyecto: CNPIEProject): string {
  if (!proyecto.diagnostico_resumen) return '';
  
  return `
    <div class="section">
      <h2>1. Diagnóstico Institucional</h2>
      <div class="highlight">
        ${proyecto.diagnostico_resumen.resumen || 'No disponible'}
      </div>
    </div>
  `;
}

function generateAcceleradoresSection(proyecto: CNPIEProject): string {
  if (!proyecto.datos_aceleradores) return '';
  
  const aceleradores = [
    { key: 'etapa2_acelerador2', titulo: 'Vinculación al CNEB' },
    { key: 'etapa2_acelerador3', titulo: 'Impacto y Resultados' },
    { key: 'etapa2_acelerador4', titulo: 'Participación Comunitaria' },
    { key: 'etapa2_acelerador5', titulo: 'Sostenibilidad' },
    { key: 'etapa2_acelerador6', titulo: 'Pertinencia Pedagógica' },
    { key: 'etapa2_acelerador7', titulo: 'Reflexión y Aprendizajes' },
  ];
  
  let html = '<div class="section"><h2>2. Aceleradores Completados</h2>';
  
  aceleradores.forEach((acelerador, index) => {
    const data = proyecto.datos_aceleradores[acelerador.key];
    if (data) {
      html += `
        <h3>${index + 2}. ${acelerador.titulo}</h3>
        <div class="highlight">
          ${formatAcceleratorData(data)}
        </div>
      `;
    }
  });
  
  html += '</div>';
  return html;
}

function formatAcceleratorData(data: any): string {
  let html = '';
  
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        html += `<p><strong>${label}:</strong> ${value}</p>`;
      } else if (Array.isArray(value)) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        html += `<p><strong>${label}:</strong></p><ul>`;
        value.forEach(item => {
          html += `<li>${item}</li>`;
        });
        html += `</ul>`;
      }
    }
  }
  
  return html || '<p>No hay datos disponibles</p>';
}

function generateEvaluacionSection(evaluacion: EvaluacionData): string {
  return `
    <div class="section">
      <h2>3. Evaluación Predictiva CNPIE</h2>
      
      <table>
        <tr>
          <th>Puntaje Total</th>
          <td>${evaluacion.puntaje_total} / ${evaluacion.puntaje_maximo}</td>
        </tr>
        <tr>
          <th>Porcentaje de Cumplimiento</th>
          <td><span class="badge">${evaluacion.porcentaje_cumplimiento}%</span></td>
        </tr>
      </table>
      
      <h3>Áreas Fuertes</h3>
      <ul>
        ${evaluacion.areas_fuertes.map(area => `<li>${area}</li>`).join('')}
      </ul>
      
      <h3>Áreas a Mejorar</h3>
      <ul>
        ${evaluacion.areas_mejorar.map(area => `<li>${area}</li>`).join('')}
      </ul>
      
      <h3>Recomendaciones</h3>
      <ul>
        ${evaluacion.recomendaciones_ia.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
  `;
}
