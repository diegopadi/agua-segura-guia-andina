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
import { Target, FileText, Lightbulb } from "lucide-react";

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
  // Filtrar rubricas válidas
  const rubricasValidas = rubricas.filter(
    (r) => r && r.puntaje_maximo !== undefined
  );

  const totalPuntaje = rubricasValidas.reduce(
    (sum, r) => sum + r.puntaje_maximo,
    0
  );

  // Si no hay rúbricas válidas, mostrar mensaje
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
                  <div className="space-y-4 pt-2">
                    {/* Indicador general */}
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {rubrica.indicador}
                        </p>
                      </div>
                    </div>

                    {/* Sub-indicadores desde ejemplos */}
                    {subIndicadores.length > 0 && (
                      <div className="space-y-2 ml-7">
                        {subIndicadores.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-xs font-mono text-primary font-medium">
                                {sub.codigo}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {sub.texto}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs ml-2 shrink-0">
                              {sub.puntaje} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Descripción */}
                    {rubrica.descripcion && (
                      <div className="p-3 bg-muted rounded-lg ml-7">
                        <p className="text-sm">{rubrica.descripcion}</p>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {rubrica.recomendaciones && (
                      <div className="flex items-start gap-3 ml-7">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mt-1" />
                        <div>
                          <p className="font-semibold text-sm mb-1">
                            Recomendaciones
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rubrica.recomendaciones}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Extensión máxima */}
                    {rubrica.extension_maxima && (
                      <div className="flex items-center gap-2 text-sm ml-7">
                        <Badge variant="outline">
                          Máximo: {rubrica.extension_maxima.toLocaleString()}{" "}
                          caracteres
                        </Badge>
                      </div>
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
