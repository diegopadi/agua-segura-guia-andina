import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface CNPIERubricCriteria {
  id: string;
  categoria: "2A" | "2B" | "2C" | "2D";
  criterio: string;
  indicador: string;
  puntaje_maximo: number;
  descripcion: string | null;
  recomendaciones: string | null;
  extension_maxima: number | null;
  ejemplos: any;
  orden: number;
  created_at: string;
}

export function useCNPIERubric(categoria: "2A" | "2B" | "2C" | "2D") {
  const { toast } = useToast();
  const [rubricas, setRubricas] = useState<CNPIERubricCriteria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRubricas();
  }, [categoria]);

  const fetchRubricas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cnpie_rubricas")
        .select("*")
        .eq("categoria", categoria)
        .order("orden", { ascending: true });

      if (error) throw error;
      setRubricas((data as CNPIERubricCriteria[]) || []);
    } catch (error: any) {
      console.error("Error fetching CNPIE rubricas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las rúbricas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCriterioByName = (nombre: string) => {
    return rubricas.find((r) => r.criterio === nombre);
  };

  const getTotalMaxScore = () => {
    return rubricas.reduce((sum, r) => sum + r.puntaje_maximo, 0);
  };

  const getCriteriosByNames = (nombres: string[]) => {
    return rubricas.filter((r) => nombres.includes(r.criterio));
  };

  return {
    rubricas,
    loading,
    getCriterioByName,
    getTotalMaxScore,
    getCriteriosByNames,
    refresh: fetchRubricas,
  };
}
