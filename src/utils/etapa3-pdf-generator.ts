interface UnidadAprendizaje {
  id: string;
  titulo: string;
  area_curricular: string;
  grado: string;
  numero_sesiones: number;
  duracion_min: number;
  proposito: string;
  evidencias: string;
  competencias_ids?: string[];
}

interface RubricaEvaluacion {
  id: string;
  estructura: any;
}

interface SesionClase {
  id: string;
  session_index: number;
  titulo: string;
  inicio?: string | null;
  desarrollo?: string | null;
  cierre?: string | null;
  evidencias?: string[];
}

interface CoherenceAnalysis {
  coherence_score: number;
  fortalezas: string[];
  areas_mejora: string[];
  recomendaciones: string[];
}

export async function generateEtapa3PDF(
  unidad: UnidadAprendizaje,
  rubrica: RubricaEvaluacion | null,
  sesiones: SesionClase[],
  coherenceAnalysis: CoherenceAnalysis | null
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Unidad de Aprendizaje - ${unidad.titulo}</title>
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
          color: #2563eb;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        h2 {
          color: #3b82f6;
          margin-top: 30px;
        }
        h3 {
          color: #60a5fa;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .badge {
          background: #3b82f6;
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
          background: #2563eb;
          color: white;
        }
        .highlight {
          background: #eff6ff;
          padding: 15px;
          border-left: 4px solid #3b82f6;
          margin: 15px 0;
        }
        .session {
          background: #f8fafc;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <h1>Unidad de Aprendizaje</h1>
      <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
      
      ${generateUnidadSection(unidad)}
      ${rubrica ? generateRubricaSection(rubrica) : ''}
      ${generateSesionesSection(sesiones)}
      ${coherenceAnalysis ? generateCoherenceSection(coherenceAnalysis) : ''}
      
      <div class="section">
        <h2>Nota Final</h2>
        <div class="highlight">
          Este documento ha sido generado automáticamente por el sistema de Aceleradores Pedagógicos.
          Contiene la unidad de aprendizaje completa lista para su implementación.
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Unidad_${unidad.titulo.replace(/\s+/g, '_')}_${new Date().getTime()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateUnidadSection(unidad: UnidadAprendizaje): string {
  return `
    <div class="section">
      <h2>1. Información General</h2>
      <table>
        <tr>
          <th>Título</th>
          <td>${unidad.titulo}</td>
        </tr>
        <tr>
          <th>Área Curricular</th>
          <td>${unidad.area_curricular}</td>
        </tr>
        <tr>
          <th>Grado</th>
          <td>${unidad.grado}</td>
        </tr>
        <tr>
          <th>Número de Sesiones</th>
          <td>${unidad.numero_sesiones}</td>
        </tr>
        <tr>
          <th>Duración por Sesión</th>
          <td>${unidad.duracion_min} minutos</td>
        </tr>
      </table>
      
      <h3>Propósito de Aprendizaje</h3>
      <div class="highlight">${unidad.proposito}</div>
      
      <h3>Evidencias de Aprendizaje</h3>
      <div class="highlight">${unidad.evidencias}</div>
    </div>
  `;
}

function generateRubricaSection(rubrica: RubricaEvaluacion): string {
  const estructura = rubrica.estructura;
  const criteria = estructura?.criteria || [];
  const levels = estructura?.levels || [];

  return `
    <div class="section">
      <h2>2. Rúbrica de Evaluación</h2>
      <table>
        <thead>
          <tr>
            <th>Criterio</th>
            ${levels.map((level: string) => `<th>${level}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${criteria.map((criterion: any) => `
            <tr>
              <td><strong>${criterion.name}</strong></td>
              ${levels.map((level: string) => `
                <td>${criterion.descriptors?.[level] || '-'}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateSesionesSection(sesiones: SesionClase[]): string {
  let html = '<div class="section"><h2>3. Sesiones de Clase</h2>';
  
  const sortedSesiones = [...sesiones].sort((a, b) => a.session_index - b.session_index);
  
  sortedSesiones.forEach((sesion) => {
    html += `
      <div class="session">
        <h3>Sesión ${sesion.session_index}: ${sesion.titulo}</h3>
        
        <h4>Inicio</h4>
        <p>${sesion.inicio || 'No especificado'}</p>
        
        <h4>Desarrollo</h4>
        <p>${sesion.desarrollo || 'No especificado'}</p>
        
        <h4>Cierre</h4>
        <p>${sesion.cierre || 'No especificado'}</p>
        
        ${sesion.evidencias && sesion.evidencias.length > 0 ? `
          <h4>Evidencias</h4>
          <ul>
            ${sesion.evidencias.map(e => `<li>${e}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function generateCoherenceSection(analysis: CoherenceAnalysis): string {
  return `
    <div class="section">
      <h2>4. Análisis de Coherencia Pedagógica</h2>
      
      <div class="highlight">
        <p><strong>Puntaje de Coherencia:</strong> <span class="badge">${analysis.coherence_score}%</span></p>
      </div>
      
      <h3>Fortalezas</h3>
      <ul>
        ${analysis.fortalezas.map(f => `<li>${f}</li>`).join('')}
      </ul>
      
      <h3>Áreas de Mejora</h3>
      <ul>
        ${analysis.areas_mejora.map(a => `<li>${a}</li>`).join('')}
      </ul>
      
      <h3>Recomendaciones</h3>
      <ul>
        ${analysis.recomendaciones.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  `;
}
