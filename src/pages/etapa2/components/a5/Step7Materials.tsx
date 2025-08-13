import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Sparkles, RotateCcw } from "lucide-react";
import { A5MaterialsData, A5MaterialItem } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: A5MaterialsData;
  onChange: (data: A5MaterialsData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step7Materials({ data, onChange, onNext, onPrev }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [infoData, setInfoData] = useState<any>(null);
  const [situationData, setSituationData] = useState<any>(null);
  const [competenciesData, setCompetenciesData] = useState<any>(null);
  const [sessionsData, setSessionsData] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from previous steps
  useEffect(() => {
    const loadPreviousStepsData = async () => {
      if (!user?.id) return;

      try {
        setLoadingData(true);
        const { data: sessionData, error } = await supabase
          .from('acelerador_sessions')
          .select('session_data')
          .eq('user_id', user.id)
          .eq('acelerador_number', 5)
          .maybeSingle();

        if (error) throw error;

        const sessionInfo = sessionData?.session_data as any || {};
        console.log('Loaded session data for materials:', sessionInfo);
        
        setInfoData(sessionInfo.info || null);
        setSituationData(sessionInfo.situation || null);
        setCompetenciesData(sessionInfo.comp || null);
        setSessionsData(sessionInfo.sessions || null);
        setFeedbackData(sessionInfo.feedback || null);
        
        console.log('Data loaded for materials:', {
          info: !!sessionInfo.info,
          situation: !!sessionInfo.situation,
          comp: !!sessionInfo.comp,
          sessions: !!sessionInfo.sessions,
          feedback: !!sessionInfo.feedback
        });
        
      } catch (error) {
        console.error('Error loading previous steps data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de pasos anteriores",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user?.id) {
      loadPreviousStepsData();
    }
  }, [user?.id]);

  // Autosave functionality
  const saveToSupabase = async (materialsData: A5MaterialsData) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({ 
          ua_materiales: materialsData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('acelerador_number', 5);

      if (error) throw error;
      
      console.log('Materials autosaved successfully');
    } catch (error) {
      console.error('Error autosaving materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los materiales automáticamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced autosave
  useEffect(() => {
    if (data.materiales.length === 0) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(data);
    }, 800); // 800ms debounce

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, user?.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const generate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-materials-ac5', {
        body: {
          infoData,
          situationData,
          competenciesData,
          sessionsData,
          feedbackData
        }
      });

      if (error) throw error;

      if (result?.materials && Array.isArray(result.materials)) {
        onChange({ materiales: result.materials });
        toast({
          title: "¡Éxito!",
          description: "Lista de materiales generada correctamente",
        });
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error generating materials:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la lista de materiales. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addMaterial = () => {
    onChange({
      materiales: [...data.materiales, { nombre: "", descripcion: "" }]
    });
  };

  const updateMaterial = (index: number, field: keyof A5MaterialItem, value: string) => {
    const updated = [...data.materiales];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ materiales: updated });
  };

  const removeMaterial = (index: number) => {
    onChange({
      materiales: data.materiales.filter((_, i) => i !== index)
    });
  };

  const canGenerate = !loadingData && infoData && situationData && competenciesData && sessionsData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Paso 7: Materiales básicos a utilizar
          {isSaving && (
            <span className="text-sm text-muted-foreground">Guardando...</span>
          )}
        </CardTitle>
        <CardDescription>
          Lista de materiales y recursos necesarios para implementar la unidad de aprendizaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800">
              Cargando datos de pasos anteriores...
            </p>
          </div>
        )}
        
        {!loadingData && !canGenerate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Necesitas completar los pasos anteriores para generar materiales personalizados.
            </p>
            <div className="mt-2 text-xs text-yellow-700">
              Estado: Info={infoData ? '✓' : '✗'}, Situación={situationData ? '✓' : '✗'}, 
              Competencias={competenciesData ? '✓' : '✗'}, Sesiones={sessionsData ? '✓' : '✗'}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={generate}
            disabled={!canGenerate || isGenerating}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {data.materiales.length === 0 ? 'Generar con IA' : 'Re-generar'}
            {isGenerating && '...'}
          </Button>
          
          <Button variant="outline" onClick={addMaterial} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar material
          </Button>
        </div>

        {data.materiales.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Material</TableHead>
                  <TableHead className="w-[60%]">Descripción</TableHead>
                  <TableHead className="w-[10%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.materiales.map((material, index) => (
                  <TableRow key={index}>
                     <TableCell>
                       <Input
                         value={material.nombre}
                         onChange={(e) => updateMaterial(index, 'nombre', e.target.value)}
                         placeholder="Nombre del material"
                         className="border-0 bg-transparent p-1 focus:bg-background focus:border-input"
                         maxLength={50}
                       />
                     </TableCell>
                     <TableCell>
                       {material.descripcion.length > 60 ? (
                         <Textarea
                           value={material.descripcion}
                           onChange={(e) => updateMaterial(index, 'descripcion', e.target.value)}
                           placeholder="Descripción y uso pedagógico"
                           className="border-0 bg-transparent p-1 focus:bg-background focus:border-input min-h-[60px] resize-none"
                           rows={2}
                           maxLength={200}
                         />
                       ) : (
                         <Input
                           value={material.descripcion}
                           onChange={(e) => updateMaterial(index, 'descripcion', e.target.value)}
                           placeholder="Descripción y uso pedagógico"
                           className="border-0 bg-transparent p-1 focus:bg-background focus:border-input"
                           maxLength={200}
                         />
                       )}
                     </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data.materiales.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay materiales agregados. Usa "Generar con IA" o "Agregar material" para comenzar.</p>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Atrás
          </Button>
          <Button onClick={onNext}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}