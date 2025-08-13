// Utility functions for Acelerador 5 competency handling

export interface CompetencyIndex {
  [id: string]: {
    nombre: string;
    capacidades?: string[];
  };
}

export const resolveCompetenceNames = (
  ids: string[],
  index: CompetencyIndex
): string[] => {
  return ids.map(id => index?.[id]?.nombre || id);
};

export const createCompetencyIndex = (competencias: any[]): CompetencyIndex => {
  const index: CompetencyIndex = {};
  competencias.forEach((c: any) => {
    if (c.id && c.nombre) {
      index[c.id] = {
        nombre: c.nombre,
        capacidades: c.capacidades || []
      };
    }
  });
  return index;
};

export const parseCompetencyIndex = (indexString: string): CompetencyIndex => {
  try {
    return JSON.parse(indexString || "{}");
  } catch {
    return {};
  }
};