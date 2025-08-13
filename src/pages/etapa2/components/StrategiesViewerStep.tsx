import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

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

  const grouped = useMemo(() => {
    const by: Record<"inicio" | "desarrollo" | "cierre", RepoItem[]> = {
      inicio: [],
      desarrollo: [],
      cierre: [],
    };
    for (const it of repoItems) {
      const m = (it.momento_sugerido || "").toLowerCase();
      if (m === "inicio" || m === "desarrollo" || m === "cierre") {
        by[m].push(it);
      }
    }
    return by;
  }, [repoItems]);

  type Moment = "inicio" | "desarrollo" | "cierre";
  const moments: Moment[] = ["inicio", "desarrollo", "cierre"];

  const initialSelectedByMoment = useMemo(() => {
    const saved = sessionData?.strategies_selected_by_moment || {};
    const toSet = (arr?: RepoItem[]) => new Set<string>((arr || []).map((s) => s.id));
    return {
      inicio: toSet(saved.inicio),
      desarrollo: toSet(saved.desarrollo),
      cierre: toSet(saved.cierre),
    } as Record<Moment, Set<string>>;
  }, [sessionData?.strategies_selected_by_moment]);

  const [selectedByMoment, setSelectedByMoment] = useState<Record<Moment, Set<string>>>(
    initialSelectedByMoment
  );

  const toggle = (moment: Moment, id: string, checked: boolean) => {
    setSelectedByMoment((prev) => {
      const next = { ...prev, [moment]: new Set(prev[moment]) } as Record<Moment, Set<string>>;
      if (checked) {
        if (next[moment].has(id)) return next;
        if (next[moment].size >= 2) {
          toast({
            title: "Máximo alcanzado",
            description: "Selecciona solo 2 estrategias por momento",
            variant: "destructive",
          });
          return next;
        }
        next[moment].add(id);
      } else {
        next[moment].delete(id);
      }
      return next;
    });
  };

  const canContinue = moments.every((m) => selectedByMoment[m].size === 2);

  const handleContinue = () => {
    if (!canContinue) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar 2 estrategias en Inicio, Desarrollo y Cierre",
        variant: "destructive",
      });
      return;
    }

    const pick = (m: Moment) =>
      Array.from(selectedByMoment[m]).map((id) =>
        repoItems.find((x) => x.id === id)
      ).filter(Boolean) as RepoItem[];

    const selected_by_moment = {
      inicio: pick("inicio"),
      desarrollo: pick("desarrollo"),
      cierre: pick("cierre"),
    };
    const flat = [
      ...selected_by_moment.inicio,
      ...selected_by_moment.desarrollo,
      ...selected_by_moment.cierre,
    ];

    const updated = {
      ...sessionData,
      strategies_selected_by_moment: selected_by_moment,
      strategies_selected: flat,
      strategies_result: { source: "manual", strategies: flat },
    };
    onUpdateSessionData(updated);
    onNext();
  };

  const momentTitle = {
    inicio: "Inicio",
    desarrollo: "Desarrollo",
    cierre: "Cierre",
  } as Record<Moment, string>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            {step.title || "Selección de estrategias"}
          </CardTitle>
          <CardDescription>
            Selecciona 2 estrategias por cada momento (Inicio, Desarrollo y Cierre). Todas provienen del libro EEPE: "Enseñanza de Ecología en el Patio de la Escuela".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {moments.map((m) => (
              <div key={m} className="rounded-lg border">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{momentTitle[m]}</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecciona 2 ({selectedByMoment[m].size}/2)
                    </p>
                  </div>
                  <Badge variant={selectedByMoment[m].size === 2 ? "default" : "secondary"}>
                    {selectedByMoment[m].size === 2 ? "Listo" : "Pendiente"}
                  </Badge>
                </div>
                <Separator />
                <ScrollArea className="h-[360px]">
                  <div className="p-3 space-y-3">
                    {(grouped[m] || []).map((it) => {
                      const checked = selectedByMoment[m].has(it.id);
                      const disabled = !checked && selectedByMoment[m].size >= 2;
                      return (
                        <div key={it.id} className={`p-3 rounded-md border transition-colors ${checked ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`${m}-${it.id}`}
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(c) => toggle(m, it.id, Boolean(c))}
                            />
                            <div className="flex-1">
                              <label htmlFor={`${m}-${it.id}`} className="font-medium cursor-pointer">
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
                    {grouped[m]?.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3">
                        No hay estrategias configuradas para este momento.
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
            <Button onClick={handleContinue} disabled={!canContinue}>
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
