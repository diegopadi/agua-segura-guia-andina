import { useMemo } from 'react';

export interface UnidadHashData {
  titulo: string;
  area_curricular: string;
  grado: string;
  numero_sesiones: number;
  duracion_min: number;
  proposito: string;
  evidencias: string;
  competencias_ids: string[];
}

export const useUnidadHash = (unidadData: Partial<UnidadHashData> | null) => {
  return useMemo(() => {
    if (!unidadData || !unidadData.titulo || !unidadData.proposito) {
      return null;
    }

    const hashInput = {
      titulo: unidadData.titulo,
      area_curricular: unidadData.area_curricular,
      grado: unidadData.grado,
      numero_sesiones: unidadData.numero_sesiones,
      duracion_min: unidadData.duracion_min,
      proposito: unidadData.proposito,
      evidencias: unidadData.evidencias,
      competencias_ids: unidadData.competencias_ids || []
    };

    try {
      // Create a simple hash from JSON string for client-side use
      const jsonString = JSON.stringify(hashInput);
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashString = Math.abs(hash).toString(16);
      
      return {
        hash: hashString,
        snapshot: hashInput
      };
    } catch (error) {
      console.error('Error calculating unidad hash:', error);
      return null;
    }
  }, [unidadData]);
};