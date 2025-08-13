import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { A5CompetenciesData, A5InfoData } from "./types";
import cnebCatalogo from "@/data/cneb_secundaria_catalogo.json";

interface Props {
  data: A5CompetenciesData;
  onChange: (data: A5CompetenciesData) => void;
  onNext: () => void;
  onPrev: () => void;
  info?: A5InfoData;
}

export default function Step4Competencies({ data, onChange, onNext, onPrev, info }: Props) {
  const [selectedCompetencies, setSelectedCompetencies] = useState<any[]>([]);
  const [openCapacidades, setOpenCapacidades] = useState<string[]>([]);

  // Filter competencias by area from info
  const competenciasDisponibles = useMemo(() => {
    const area = info?.area || "";
    return cnebCatalogo.competencias[area] || [];
  }, [info?.area]);

  const enfoquesDisponibles = cnebCatalogo.enfoques_transversales;

  const toggleCompetencia = (competenciaId: string) => {
    const newCompetencias = data.competencias.includes(competenciaId)
      ? data.competencias.filter(id => id !== competenciaId)
      : [...data.competencias, competenciaId];
    
    onChange({ ...data, competencias: newCompetencias });
  };

  const toggleEnfoque = (enfoqueId: string) => {
    const newEnfoques = data.enfoques.includes(enfoqueId)
      ? data.enfoques.filter(id => id !== enfoqueId)
      : [...data.enfoques, enfoqueId];
    
    onChange({ ...data, enfoques: newEnfoques });
  };

  const toggleCapacidades = (competenciaId: string) => {
    setOpenCapacidades(prev => 
      prev.includes(competenciaId) 
        ? prev.filter(id => id !== competenciaId)
        : [...prev, competenciaId]
    );
  };

  const save = () => {
    toast({ 
      title: "Competencias y enfoques guardados", 
      description: "Se integrarán al documento final de la Unidad de Aprendizaje." 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competencias y enfoques transversales</CardTitle>
        <CardDescription>
          Selecciona desde el catálogo oficial del Currículo Nacional (CNEB) las competencias del área <strong>{info?.area}</strong> y los enfoques transversales para tu Unidad de Aprendizaje.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Competencias Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Competencias del área {info?.area}</h3>
            <Badge variant="outline">{competenciasDisponibles.length} disponibles</Badge>
          </div>
          
          {competenciasDisponibles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2" />
              <p>Selecciona un área en el Paso 2 para ver las competencias disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {competenciasDisponibles.map((competencia) => (
                <div key={competencia.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={data.competencias.includes(competencia.id)}
                      onCheckedChange={() => toggleCompetencia(competencia.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm mb-1">{competencia.nombre}</h4>
                          <p className="text-xs text-muted-foreground">{competencia.descripcion}</p>
                        </div>
                        {competencia.capacidades.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCapacidades(competencia.id)}
                            className="text-xs"
                          >
                            Capacidades
                            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${
                              openCapacidades.includes(competencia.id) ? 'rotate-180' : ''
                            }`} />
                          </Button>
                        )}
                      </div>
                      
                      <Collapsible open={openCapacidades.includes(competencia.id)}>
                        <CollapsibleContent className="mt-3">
                          <div className="bg-muted/50 rounded p-3">
                            <p className="text-xs font-medium mb-2">Capacidades:</p>
                            <ul className="text-xs space-y-1">
                              {competencia.capacidades.map((capacidad, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {capacidad}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enfoques Transversales Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Enfoques transversales</h3>
            <Badge variant="outline">{enfoquesDisponibles.length} disponibles</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enfoquesDisponibles.map((enfoque) => (
              <div key={enfoque.id} className="border border-border rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={data.enfoques.includes(enfoque.id)}
                    onCheckedChange={() => toggleEnfoque(enfoque.id)}
                    className="mt-1"
                  />
                  <div>
                    <h4 className="font-medium text-sm mb-1">{enfoque.nombre}</h4>
                    <p className="text-xs text-muted-foreground">{enfoque.descripcion}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Message */}
        {(data.competencias.length > 0 || data.enfoques.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Recordatorio importante</p>
                <p className="text-blue-700">
                  Al elaborar el documento completo de la Unidad de Aprendizaje, deberás trasladar también 
                  el <strong>estándar, las capacidades y los desempeños de aprendizaje completos</strong> del 
                  Currículo Nacional correspondientes al grado <strong>{info?.grado}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save}>Guardar</Button>
            <Button onClick={onNext} disabled={data.competencias.length === 0}>
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
