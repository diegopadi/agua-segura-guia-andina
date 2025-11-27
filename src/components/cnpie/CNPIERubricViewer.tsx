import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CNPIERubricCriteria } from "@/hooks/useCNPIERubric";
import { Target, ChevronRight } from "lucide-react";

interface CNPIERubricViewerProps {
  rubricas: CNPIERubricCriteria[];
  destacarCriterios?: string[];
}

interface SubIndicador {
  codigo: string;
  texto: string;
  puntaje: number;
}

export function CNPIERubricViewer({
  rubricas,
  destacarCriterios = [],
}: CNPIERubricViewerProps) {
  const rubricasValidas = rubricas.filter(
    (r) => r && r.puntaje_maximo !== undefined
  );

  const totalPuntaje = rubricasValidas.reduce(
    (sum, r) => sum + r.puntaje_maximo,
    0
  );

  if (rubricasValidas.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Rúbrica CNPIE
          </CardTitle>
          <CardDescription>Cargando rúbricas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const parseSubIndicadores = (ejemplos: any): SubIndicador[] => {
    if (!ejemplos) return [];
    try {
      if (typeof ejemplos === 'string') {
        return JSON.parse(ejemplos);
      }
      if (Array.isArray(ejemplos)) {
        return ejemplos;
      }
      return [];
    } catch {
      return [];
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Rúbrica Oficial CNPIE {rubricasValidas[0]?.categoria}
            </CardTitle>
            <CardDescription className="mt-2">
              Criterios de evaluación para tu proyecto de innovación
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {totalPuntaje} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {rubricasValidas.map((rubrica) => {
            const isDestacado = destacarCriterios.includes(rubrica.criterio);
            const subIndicadores = parseSubIndicadores(rubrica.ejemplos);

            return (
              <AccordionItem key={rubrica.id} value={rubrica.id}>
                <AccordionTrigger
                  className={isDestacado ? "text-primary font-semibold" : ""}
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{rubrica.criterio}</span>
                    <Badge variant={isDestacado ? "default" : "secondary"}>
                      {rubrica.puntaje_maximo} pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {/* Sub-indicadores */}
                    {subIndicadores.length > 0 && (
                      <div className="space-y-2">
                        {subIndicadores.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg border border-border/50"
                          >
                            <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  {sub.codigo}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {sub.puntaje} pts
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {sub.texto}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Si no hay sub-indicadores, mostrar indicador general */}
                    {subIndicadores.length === 0 && rubrica.indicador && (
                      <p className="text-sm text-muted-foreground pl-2">
                        {rubrica.indicador}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
