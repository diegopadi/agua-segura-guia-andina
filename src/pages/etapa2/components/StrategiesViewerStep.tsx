import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, ArrowLeft, ArrowRight, RefreshCcw, Save, Clock } from "lucide-react";
import { APP_CONFIG_A4_DEFAULT } from "@/integrations/supabase/appConfigDefaults";

interface StrategiesViewerStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => Promise<void>;
  step: {
    title: string;
    description: string;
    template_id: string;
    icon: any;
  };
}

interface RepoItem {
  id: string;
  nombre?: string;
  descripcion?: string;
  momento_sugerido?: "inicio" | "desarrollo" | "cierre" | string;
  etiquetas?: string[];
  recursos?: string[];
  referencia?: string;
  tipo_estrategia?: string;
}

export const StrategiesViewerStep: React.FC<StrategiesViewerStepProps> = ({
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
  step,
}) => {
  const { toast } = useToast();
  const repoItems: RepoItem[] = sessionData?.app_config?.estrategias_repo?.items || [];

  // Agrupación por tipo de estrategia (nuevo esquema)
  type TipoKey =
    | 'indagacion_diagnostico'
    | 'experimentos_demostraciones'
    | 'proyectos_rutas_aplicadas'
    | 'comunicacion_movilizacion'
    | 'reflexion_evaluacion_cierre';

  const TYPE_KEYS: TipoKey[] = [
    'indagacion_diagnostico',
    'experimentos_demostraciones',
    'proyectos_rutas_aplicadas',
    'comunicacion_movilizacion',
    'reflexion_evaluacion_cierre',
  ];

  const TYPE_LABELS: Record<TipoKey, string> = {
    indagacion_diagnostico: 'Indagación y diagnóstico participativo',
    experimentos_demostraciones: 'Experimentos y demostraciones científicas',
    proyectos_rutas_aplicadas: 'Proyectos y rutas de aprendizaje aplicadas',
    comunicacion_movilizacion: 'Comunicación, participación y movilización',
    reflexion_evaluacion_cierre: 'Reflexión, evaluación y cierre',
  };

  const inferTipo = (it: RepoItem): TipoKey => {
    const explicit = String((it as any)?.tipo_estrategia || '').toLowerCase().trim();
    if ((TYPE_KEYS as string[]).includes(explicit)) return explicit as TipoKey;
    const hay = (txt?: string) => (txt || '').toLowerCase();
    const blob = [hay(it.nombre), hay(it.descripcion), ...(it.etiquetas || []).map(hay)].join(' ');
    if (/\bindag|diagn|observaci/.test(blob)) return 'indagacion_diagnostico';
    if (/experim|demostr|c y t/.test(blob)) return 'experimentos_demostraciones';
    if (/proyecto|ruta|mejora/.test(blob)) return 'proyectos_rutas_aplicadas';
    if (/campaña|feria|mural|teatr|comunic/.test(blob)) return 'comunicacion_movilizacion';
    return 'reflexion_evaluacion_cierre';
  };

  const groupedByType = useMemo(() => {
    const by: Record<TipoKey, RepoItem[]> = {
      indagacion_diagnostico: [],
      experimentos_demostraciones: [],
      proyectos_rutas_aplicadas: [],
      comunicacion_movilizacion: [],
      reflexion_evaluacion_cierre: [],
    };
    for (const it of repoItems) {
      const k = inferTipo(it);
      by[k].push(it);
    }
    return by;
  }, [repoItems]);

  // Selección global hasta 5 (preserva el orden de selección)
  const MAX_SELECTION = 5;
  const initialSelectedIds = useMemo<string[]>(() => {
    const saved = sessionData?.strategies_result?.strategies || sessionData?.strategies_selected || [];
    const ids = (saved || []).map((s: any) => s.id).filter(Boolean);
    return Array.from(new Set(ids)) as string[];
  }, [sessionData?.strategies_result, sessionData?.strategies_selected]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const canToggle = (id: string) => selectedIds.includes(id) || selectedIds.length < MAX_SELECTION;
  const toggleId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        if (prev.length >= MAX_SELECTION) {
          toast({
            title: "Máximo alcanzado",
            description: `Puedes seleccionar hasta ${MAX_SELECTION} estrategias en total.`,
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, id];
      } else {
        return prev.filter((x) => x !== id);
      }
    });
  };

  // Auto-save functionality with debouncing
  const autoSave = useCallback(async (ids: string[]) => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      const selected = ids
        .map((id) => repoItems.find((x) => x.id === id))
        .filter(Boolean) as RepoItem[];

      const updated = {
        ...sessionData,
        strategies_selected: selected,
        strategies_result: { source: "repo", strategies: selected },
      };

      console.log("[A4][StrategiesViewer] Auto-saving selection", {
        selectedCount: selected.length,
        selectedIds: ids,
      });

      await onUpdateSessionData(updated);
      setLastSaved(new Date());
      
      toast({ 
        title: "Guardado automático", 
        description: `${selected.length} estrategias guardadas`,
        duration: 2000
      });
    } catch (error) {
      console.error("[A4][StrategiesViewer] Auto-save error:", error);
      toast({
        title: "Error de guardado",
        description: "No se pudo guardar automáticamente. Los cambios se guardarán al continuar.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSaving(false);
    }
  }, [sessionData, repoItems, onUpdateSessionData, isSaving, toast]);

  // Debounced auto-save effect
  useEffect(() => {
    if (selectedIds.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      autoSave(selectedIds);
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [selectedIds, autoSave]);

  const canContinue = selectedIds.length > 0 && selectedIds.length <= MAX_SELECTION && !isSaving;

  const handleContinue = async () => {
    if (isSaving) {
      toast({
        title: "Guardando",
        description: "Por favor espera a que se complete el guardado automático.",
        variant: "default",
      });
      return;
    }

    if (!canContinue) {
      toast({
        title: "Selección requerida",
        description: "Selecciona al menos 1 estrategia (máximo 5).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const selected = selectedIds
        .map((id) => repoItems.find((x) => x.id === id))
        .filter(Boolean) as RepoItem[];

      const updated = {
        ...sessionData,
        strategies_selected: selected,
        strategies_result: { source: "repo", strategies: selected },
      };

      console.log("[A4][StrategiesViewer] Continuar click", {
        selectedCount: selected.length,
        selectedIds,
      });

      // Final save before navigation
      await onUpdateSessionData(updated);
      setLastSaved(new Date());
      
      toast({ title: "Selección guardada", description: "Avanzando al siguiente paso" });
      
      console.log("[A4][StrategiesViewer] Session data updated successfully, proceeding to next step");
      
      // Small delay to ensure save is complete
      setTimeout(() => {
        onNext();
      }, 300);
      
    } catch (error) {
      console.error("[A4][StrategiesViewer] Error updating session data:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la selección. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadRepo = () => {
    const defaults = APP_CONFIG_A4_DEFAULT?.estrategias_repo?.items || [];
    const newData = {
      ...sessionData,
      app_config: {
        ...(sessionData?.app_config || {}),
        estrategias_repo: { items: defaults },
      },
    };
    onUpdateSessionData(newData);
    toast({
      title: "Repositorio recargado",
      description: `Se cargaron ${defaults.length} estrategias (18 totales).`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              {step.title || "Selección de estrategias"}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleReloadRepo}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Recargar repo EEPE (18)
            </Button>
          </div>
          <CardDescription>
            Selecciona hasta 5 estrategias del repositorio EEPE (agrupadas por tipo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Seleccionadas: {selectedIds.length}/{MAX_SELECTION}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving && (
                <>
                  <Save className="w-4 h-4 animate-pulse" />
                  <span>Guardando...</span>
                </>
              )}
              {!isSaving && lastSaved && (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Guardado {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TYPE_KEYS.map((k) => (
              <div key={k} className="rounded-lg border">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{TYPE_LABELS[k]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {groupedByType[k].length} disponibles
                    </p>
                  </div>
                  <Badge variant={selectedIds.some(id => (groupedByType[k] || []).some(it => it.id === id)) ? "default" : "secondary"}>
                    {selectedIds.filter(id => (groupedByType[k] || []).some(it => it.id === id)).length} seleccionada(s)
                  </Badge>
                </div>
                <Separator />
                <ScrollArea className="h-[360px]">
                  <div className="p-3 space-y-3">
                    {(groupedByType[k] || []).map((it) => {
                      const checked = selectedIds.includes(it.id);
                      const disabled = !checked && selectedIds.length >= MAX_SELECTION;
                      return (
                        <div key={it.id} className={`p-3 rounded-md border transition-colors ${checked ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`${k}-${it.id}`}
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(c) => toggleId(it.id, Boolean(c))}
                            />
                            <div className="flex-1">
                              <label htmlFor={`${k}-${it.id}`} className="font-medium cursor-pointer">
                                {it.nombre || "Estrategia"}
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {it.descripcion || ""}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(it.etiquetas || []).slice(0, 4).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {it.referencia || "EEPE - Enseñanza de Ecología en el Patio de la Escuela"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {groupedByType[k]?.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3">
                        No hay estrategias configuradas para esta categoría.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onPrev}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="button" onClick={handleContinue} disabled={!canContinue}>
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Guardando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
