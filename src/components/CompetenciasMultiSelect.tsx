import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import cnebData from '@/data/cneb_secundaria_catalogo.json';

interface CNEBCompetencia {
  id: string;
  nombre: string;
  descripcion: string;
  capacidades: string[];
}

interface CompetenciasMultiSelectProps {
  areaCurricular: string;
  selectedCompetencias: string[];
  onCompetenciasChange: (competencias: string[]) => void;
  disabled?: boolean;
  maxCompetencias?: number;
}

export default function CompetenciasMultiSelect({
  areaCurricular,
  selectedCompetencias,
  onCompetenciasChange,
  disabled = false,
  maxCompetencias = 2
}: CompetenciasMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Filter competencias by area curricular
  const availableCompetencias = useMemo(() => {
    if (!areaCurricular || !cnebData.competencias[areaCurricular as keyof typeof cnebData.competencias]) {
      return [];
    }
    return cnebData.competencias[areaCurricular as keyof typeof cnebData.competencias] as CNEBCompetencia[];
  }, [areaCurricular]);

  const selectedCompetenciasData = useMemo(() => {
    return availableCompetencias.filter(comp => selectedCompetencias.includes(comp.id));
  }, [availableCompetencias, selectedCompetencias]);

  const handleSelect = (competenciaId: string) => {
    if (selectedCompetencias.includes(competenciaId)) {
      // Remove competencia
      onCompetenciasChange(selectedCompetencias.filter(id => id !== competenciaId));
    } else {
      // Add competencia (if under limit)
      if (selectedCompetencias.length < maxCompetencias) {
        onCompetenciasChange([...selectedCompetencias, competenciaId]);
      }
    }
  };

  const removeCompetencia = (competenciaId: string) => {
    onCompetenciasChange(selectedCompetencias.filter(id => id !== competenciaId));
  };

  if (!areaCurricular) {
    return (
      <div className="space-y-2">
        <Label>Competencias del CNEB</Label>
        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
          Seleccione un área curricular primero
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        Competencias del CNEB 
        <span className="text-sm text-muted-foreground ml-2">
          (Máximo {maxCompetencias}, Área: {areaCurricular})
        </span>
      </Label>
      
      {/* Selected Competencias */}
      {selectedCompetenciasData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCompetenciasData.map((comp) => (
            <Badge key={comp.id} variant="secondary" className="gap-1 pr-1">
              <span className="text-xs">{comp.id}</span>
              <span className="max-w-[200px] truncate">{comp.nombre}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeCompetencia(comp.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || selectedCompetencias.length >= maxCompetencias}
          >
            {selectedCompetencias.length === 0 
              ? "Seleccionar competencias..." 
              : `${selectedCompetencias.length} competencia(s) seleccionada(s)`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar competencia..." />
            <CommandList>
              <CommandEmpty>No se encontraron competencias.</CommandEmpty>
              <CommandGroup>
                {availableCompetencias.map((competencia) => {
                  const isSelected = selectedCompetencias.includes(competencia.id);
                  const canSelect = selectedCompetencias.length < maxCompetencias || isSelected;
                  
                  return (
                    <CommandItem
                      key={competencia.id}
                      value={`${competencia.id} ${competencia.nombre}`}
                      onSelect={() => canSelect && handleSelect(competencia.id)}
                      className={cn(
                        "cursor-pointer",
                        !canSelect && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{competencia.id}</Badge>
                          <span className="font-medium">{competencia.nombre}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {competencia.descripcion}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Capacidades:</strong> {competencia.capacidades.join(', ')}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCompetencias.length >= maxCompetencias && (
        <p className="text-xs text-muted-foreground">
          Máximo de {maxCompetencias} competencias alcanzado
        </p>
      )}
    </div>
  );
}