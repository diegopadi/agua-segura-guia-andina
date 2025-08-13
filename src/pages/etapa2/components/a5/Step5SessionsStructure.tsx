import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { A5SessionsStructureData, A5SessionRow, A5InfoData, A5SituationPurposeData, A5CompetenciesData } from "./types";
import { Loader2, RefreshCw } from "lucide-react";

interface Props {
  data: A5SessionsStructureData;
  onChange: (data: A5SessionsStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveVars: (vars: Record<string, any>) => void;
  sessionId: string;
}

export default function Step5SessionsStructure({ 
  data, 
  onChange, 
  onNext, 
  onPrev, 
  onSaveVars,
  sessionId 
}: Props) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<number | null>(null);

  // Get data from previous steps
  const [infoData, setInfoData] = useState<A5InfoData | null>(null);
  const [situationData, setSituationData] = useState<A5SituationPurposeData | null>(null);
  const [competenciesData, setCompetenciesData] = useState<A5CompetenciesData | null>(null);

  // Load data from previous steps
  useEffect(() => {
    const loadPreviousStepsData = async () => {
      if (!sessionId || !user) return;

      try {
        const { data: sessionData, error } = await supabase
          .from('acelerador_sessions')
          .select('session_data')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const sessionInfo = sessionData?.session_data as any || {};
        setInfoData(sessionInfo.a5_info || null);
        setSituationData(sessionInfo.a5_situation || null);
        setCompetenciesData(sessionInfo.a5_competencies || null);
      } catch (error) {
        console.error('Error loading previous steps data:', error);
      }
    };

    loadPreviousStepsData();
  }, [sessionId, user]);

  // Debounced save function
  const debouncedSave = useCallback((updatedData: A5SessionsStructureData) => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      onSaveVars({
        ua_estructura_sesiones: JSON.stringify(updatedData.estructura),
        ua_parametros_sesiones: JSON.stringify({
          numSesiones: updatedData.numSesiones,
          horasPorSesion: updatedData.horasPorSesion,
          numEstudiantes: updatedData.numEstudiantes,
          observaciones: updatedData.observaciones
        })
      });
    }, 800);

    setSaveTimeoutId(timeoutId);
  }, [saveTimeoutId, onSaveVars]);

  // Auto-save when data changes
  useEffect(() => {
    if (data.estructura.length > 0) {
      debouncedSave(data);
    }
  }, [data, debouncedSave]);

  const canGenerate = useMemo(() => {
    console.log('Debugging canGenerate:');
    console.log('- numSesiones:', data.numSesiones);
    console.log('- horasPorSesion:', data.horasPorSesion);
    console.log('- numEstudiantes:', data.numEstudiantes);
    console.log('- infoData:', infoData);
    console.log('- situationData:', situationData);
    console.log('- competenciesData:', competenciesData);
    console.log('- competencias length:', competenciesData?.competencias?.length);
    
    const result = data.numSesiones > 0 && 
           data.horasPorSesion > 0 && 
           data.numEstudiantes > 0 &&
           infoData &&
           situationData &&
           competenciesData?.competencias?.length > 0;
    
    console.log('canGenerate result:', result);
    return result;
  }, [data, infoData, situationData, competenciesData]);

  const generateStructure = async () => {
    if (!canGenerate) {
      toast({
        title: "Datos incompletos",
        description: "Complete todos los parámetros y asegúrese de haber completado los pasos anteriores.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-estructura-sesiones-ac5', {
        body: {
          info: infoData,
          situationPurpose: situationData,
          competencias: competenciesData.competencias,
          enfoques: competenciesData.enfoques,
          sessionParams: {
            numSesiones: data.numSesiones,
            horasPorSesion: data.horasPorSesion,
            numEstudiantes: data.numEstudiantes,
            observaciones: data.observaciones
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error generating structure');
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.estructura_sesiones) {
        const newData = {
          ...data,
          estructura: result.estructura_sesiones
        };
        onChange(newData);
        toast({
          title: "Estructura generada",
          description: `Se generaron ${result.estructura_sesiones.length} sesiones. Puede editarlas directamente en la tabla.`
        });
      }
    } catch (error) {
      console.error('Error generating structure:', error);
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar la estructura. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSession = (sessionIndex: number, field: string, value: any) => {
    const newStructure = [...data.estructura];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newStructure[sessionIndex] = {
        ...newStructure[sessionIndex],
        [parent]: {
          ...(newStructure[sessionIndex][parent as keyof A5SessionRow] as any),
          [child]: value
        }
      };
    } else {
      newStructure[sessionIndex] = {
        ...newStructure[sessionIndex],
        [field]: value
      };
    }
    onChange({ ...data, estructura: newStructure });
  };

  const addSession = () => {
    const newSession: A5SessionRow = {
      numero: data.estructura.length + 1,
      titulo: `Sesión ${data.estructura.length + 1}`,
      competencias: [],
      capacidades: [],
      proposito: "",
      actividades: {
        inicio: "",
        desarrollo: "",
        cierre: ""
      },
      recursos: "",
      evidencias: "",
      enfoques: []
    };
    onChange({
      ...data,
      estructura: [...data.estructura, newSession],
      numSesiones: data.estructura.length + 1
    });
  };

  const removeSession = (index: number) => {
    const newStructure = data.estructura.filter((_, i) => i !== index);
    // Renumerar sesiones
    const renumbered = newStructure.map((session, i) => ({
      ...session,
      numero: i + 1
    }));
    onChange({
      ...data,
      estructura: renumbered,
      numSesiones: renumbered.length
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseño de la estructura de sesiones</CardTitle>
        <CardDescription>
          Complete los parámetros y genere la estructura de sesiones con IA. Luego puede editarla directamente en la tabla.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parámetros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="numSesiones">Número de sesiones *</Label>
            <Input 
              id="numSesiones"
              type="number" 
              min={1} 
              value={data.numSesiones || ''} 
              onChange={(e) => onChange({ ...data, numSesiones: Number(e.target.value) || 0 })} 
            />
          </div>
          <div>
            <Label htmlFor="horasPorSesion">Horas por sesión *</Label>
            <Input 
              id="horasPorSesion"
              type="number" 
              min={1} 
              value={data.horasPorSesion || ''} 
              onChange={(e) => onChange({ ...data, horasPorSesion: Number(e.target.value) || 0 })} 
            />
          </div>
          <div>
            <Label htmlFor="numEstudiantes">Número de estudiantes *</Label>
            <Input 
              id="numEstudiantes"
              type="number" 
              min={1} 
              value={data.numEstudiantes || ''} 
              onChange={(e) => onChange({ ...data, numEstudiantes: Number(e.target.value) || 0 })} 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="observaciones">Observaciones adicionales (opcional)</Label>
          <Textarea
            id="observaciones"
            placeholder="Restricciones, consideraciones especiales, etc."
            value={data.observaciones || ''}
            onChange={(e) => onChange({ ...data, observaciones: e.target.value })}
          />
        </div>

        {/* Botones de generación */}
        <div className="flex gap-2">
          <Button 
            onClick={generateStructure} 
            disabled={!canGenerate || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {data.estructura.length > 0 ? 'Regenerar estructura' : 'Generar con IA'}
          </Button>
          {data.estructura.length > 0 && (
            <Button variant="outline" onClick={addSession}>
              Agregar sesión manual
            </Button>
          )}
        </div>

        {/* Debug info */}
        <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
          <div><strong>Estado de validación:</strong></div>
          <div>• Sesiones: {data.numSesiones > 0 ? '✅' : '❌'} ({data.numSesiones})</div>
          <div>• Horas: {data.horasPorSesion > 0 ? '✅' : '❌'} ({data.horasPorSesion})</div>
          <div>• Estudiantes: {data.numEstudiantes > 0 ? '✅' : '❌'} ({data.numEstudiantes})</div>
          <div>• Info paso 2: {infoData ? '✅' : '❌'}</div>
          <div>• Situación paso 3: {situationData ? '✅' : '❌'}</div>
          <div>• Competencias paso 4: {competenciesData?.competencias?.length > 0 ? '✅' : '❌'} ({competenciesData?.competencias?.length || 0})</div>
        </div>

        {!canGenerate && (
          <div className="text-sm text-muted-foreground bg-orange-50 border border-orange-200 p-3 rounded">
            <strong>Para habilitar la generación necesita:</strong><br/>
            • Completar todos los parámetros numéricos<br/>
            • Haber completado los pasos 2, 3 y 4 anteriores<br/>
            • Tener al menos una competencia seleccionada
          </div>
        )}

        {/* Tabla de sesiones */}
        {data.estructura.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Estructura de sesiones ({data.estructura.length})</h3>
              <div className="text-sm text-muted-foreground">
                Los cambios se guardan automáticamente
              </div>
            </div>
            
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead className="min-w-[250px]">Propósito</TableHead>
                    <TableHead className="min-w-[150px]">Competencias</TableHead>
                    <TableHead className="min-w-[200px]">Capacidades</TableHead>
                    <TableHead className="min-w-[200px]">Inicio</TableHead>
                    <TableHead className="min-w-[250px]">Desarrollo</TableHead>
                    <TableHead className="min-w-[200px]">Cierre</TableHead>
                    <TableHead className="min-w-[200px]">Recursos</TableHead>
                    <TableHead className="min-w-[200px]">Evidencias</TableHead>
                    <TableHead className="min-w-[150px]">Enfoques</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.estructura.map((session, index) => (
                    <TableRow key={session.numero}>
                      <TableCell className="align-top">{session.numero}</TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.titulo}
                          onChange={(e) => updateSession(index, 'titulo', e.target.value)}
                          className="min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.proposito}
                          onChange={(e) => updateSession(index, 'proposito', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.competencias.join(', ')}
                          onChange={(e) => updateSession(index, 'competencias', e.target.value.split(', ').filter(c => c.trim()))}
                          className="min-h-[60px]"
                          placeholder="Lista separada por comas"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.capacidades.join(', ')}
                          onChange={(e) => updateSession(index, 'capacidades', e.target.value.split(', ').filter(c => c.trim()))}
                          className="min-h-[80px]"
                          placeholder="Lista separada por comas"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.actividades.inicio}
                          onChange={(e) => updateSession(index, 'actividades.inicio', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.actividades.desarrollo}
                          onChange={(e) => updateSession(index, 'actividades.desarrollo', e.target.value)}
                          className="min-h-[100px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.actividades.cierre}
                          onChange={(e) => updateSession(index, 'actividades.cierre', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.recursos}
                          onChange={(e) => updateSession(index, 'recursos', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.evidencias}
                          onChange={(e) => updateSession(index, 'evidencias', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={session.enfoques.join(', ')}
                          onChange={(e) => updateSession(index, 'enfoques', e.target.value.split(', ').filter(e => e.trim()))}
                          className="min-h-[60px]"
                          placeholder="Lista separada por comas"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSession(index)}
                          disabled={data.estructura.length === 1}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev}>
            Atrás
          </Button>
          <Button 
            onClick={onNext}
            disabled={data.estructura.length === 0}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}