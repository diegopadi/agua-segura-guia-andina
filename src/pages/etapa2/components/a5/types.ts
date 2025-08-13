export interface A5InfoData {
  institucion: string;
  distrito: string;
  provincia: string;
  region: string;
  director: string;
  profesor: string;
  area: string;
  grado: string;
  duracion: string;
  periodo: string;
  anio: string;
}

export interface A5SituationPurposeData {
  situacion: string;
  proposito: string;
  reto: string;
  producto: string;
}

export interface A5CompetenciesData {
  competencias: string[];
  enfoques: string[];
}

export interface A5SessionRow {
  sesion: number;
  objetivo: string;
  actividades: string;
}

export interface A5SessionsStructureData {
  numSesiones: number;
  horasPorSesion: number;
  numEstudiantes: number;
  estructura: A5SessionRow[];
}

export interface A5FeedbackData {
  feedback: string;
}

export interface A5MaterialItem {
  nombre: string;
  descripcion: string;
}

export interface A5MaterialsData {
  materiales: A5MaterialItem[];
}

// A4 recovered inputs to be used across A5
export interface A4PriorityData {
  id: string;
  title: string;
  description: string;
  impact_score: number;
  feasibility_score: number;
}

export interface A4StrategyData {
  id: string;
  title: string;
  description?: string;
}

export interface A4Inputs {
  priorities: A4PriorityData[];
  strategies: A4StrategyData[];
  source: 'adapted' | 'result' | 'selected' | 'unknown';
}
