import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import cnebData from '@/data/cneb_secundaria_catalogo.json';

interface CNEBCompetencia {
  id: string;
  nombre: string;
  descripcion: string;
  capacidades: string[];
}

interface CompetenciasCheckboxListProps {
  areaCurricular: string;
  selectedCompetencias: string[];
  onCompetenciasChange: (competencias: string[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  maxHeight?: string;
}

export default function CompetenciasCheckboxList({
  areaCurricular,
  selectedCompetencias,
  onCompetenciasChange,
  disabled = false,
  title = "Competencias del CNEB Desarrolladas",
  description = "Selecciona las competencias del Currículo Nacional que se desarrollan en tu proyecto",
  maxHeight = "500px"
}: CompetenciasCheckboxListProps) {
  
  // Filter competencias by area curricular
  const availableCompetencias = useMemo(() => {
    if (!areaCurricular || !cnebData.competencias[areaCurricular as keyof typeof cnebData.competencias]) {
      return [];
    }
    return cnebData.competencias[areaCurricular as keyof typeof cnebData.competencias] as CNEBCompetencia[];
  }, [areaCurricular]);

  const handleToggle = (competenciaId: string) => {
    if (selectedCompetencias.includes(competenciaId)) {
      onCompetenciasChange(selectedCompetencias.filter(id => id !== competenciaId));
    } else {
      onCompetenciasChange([...selectedCompetencias, competenciaId]);
    }
  };

  if (!areaCurricular) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground">
            Seleccione un área curricular primero
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableCompetencias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground">
            No hay competencias disponibles para el área seleccionada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">
            {selectedCompetencias.length} seleccionada(s)
          </Badge>
        </CardTitle>
        <CardDescription>
          {description}
          {areaCurricular && ` (Área: ${areaCurricular})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full" style={{ maxHeight }}>
          <div className="space-y-4 pr-4">
            {availableCompetencias.map((competencia) => {
              const isSelected = selectedCompetencias.includes(competencia.id);
              
              return (
                <div
                  key={competencia.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-primary/5 border-primary' 
                      : 'bg-background hover:bg-muted/50 border-border'
                  }`}
                >
                  <Checkbox
                    id={`comp-${competencia.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(competencia.id)}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`comp-${competencia.id}`}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {competencia.id}
                        </Badge>
                        <span className="font-semibold">{competencia.nombre}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {competencia.descripcion}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <strong>Capacidades:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {competencia.capacidades.map((cap, idx) => (
                            <li key={idx}>{cap}</li>
                          ))}
                        </ul>
                      </div>
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {selectedCompetencias.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Selecciona al menos una competencia
          </p>
        )}
      </CardContent>
    </Card>
  );
}
