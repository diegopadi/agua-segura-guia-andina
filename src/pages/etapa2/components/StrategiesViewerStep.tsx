import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, ArrowLeft, ArrowRight, RefreshCcw } from "lucide-react";
import { APP_CONFIG_A4_DEFAULT } from "@/integrations/supabase/appConfigDefaults";

interface StrategiesViewerStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
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

  const canContinue = selectedIds.length > 0 && selectedIds.length <= MAX_SELECTION;

  const handleContinue = () => {
    if (!canContinue) {
      toast({
        title: "Selección requerida",
        description: "Selecciona al menos 1 estrategia (máximo 5).",
        variant: "destructive",
      });
      return;
    }

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

    toast({ title: "Selección guardada", description: "Avanzando al siguiente paso" });

    onUpdateSessionData(updated);
    onNext();
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
          <p className="text-sm text-muted-foreground mb-4">Seleccionadas: {selectedIds.length}/{MAX_SELECTION}</p>
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
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
