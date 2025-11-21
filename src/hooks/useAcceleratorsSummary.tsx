import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { useToast } from "./use-toast";

interface HallazgosClave {
  hallazgos: string[];
  fecha: string;
  docente: string;
  institucion: string;
  region: string;
}

export function useAcceleratorsSummary() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [hallazgos, setHallazgos] = useState<HallazgosClave | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchAcceleratorsData = async () => {
    if (!user?.id) return null;

    try {
      setLoading(true);

      // Obtener datos de aceleradores 1, 2 y 3
      const { data, error } = await supabase
        .from("acelerador_sessions")
        .select("acelerador_number, session_data, updated_at")
        .eq("user_id", user.id)
        .in("acelerador_number", [1, 2, 3])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching accelerators data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!profile) {
      return;
    }
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para generar el resumen",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      const acceleratorsData = await fetchAcceleratorsData();

      if (!acceleratorsData || acceleratorsData.length === 0) {
        toast({
          title: "Sin datos",
          description:
            "No se encontraron datos de los aceleradores 1, 2 y 3. Completa primero estas etapas.",
          variant: "destructive",
        });
        return;
      }

      // Llamar al edge function para generar el resumen con IA
      const { data, error } = await supabase.functions.invoke(
        "generate-accelerators-summary",
        {
          body: {
            acceleratorsData,
            profileData: {
              full_name: profile.full_name,
              ie_name: profile.ie_name,
              ie_region: profile.ie_region,
              ie_province: profile.ie_province,
              ie_district: profile.ie_district,
            },
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        const summary: HallazgosClave = {
          hallazgos: data.summary.hallazgos,
          fecha: new Date().toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          docente: profile.full_name || "Sin nombre",
          institucion: profile.ie_name || "Sin institución",
          region: `${profile.ie_region || ""}${
            profile.ie_province ? ", " + profile.ie_province : ""
          }`,
        };

        setHallazgos(summary);

        toast({
          title: "Resumen generado",
          description: "Los hallazgos clave han sido generados con IA",
        });
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el resumen",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return {
    hallazgos,
    loading,
    generating,
    generateSummary,
    hasData: hallazgos !== null,
  };
}
