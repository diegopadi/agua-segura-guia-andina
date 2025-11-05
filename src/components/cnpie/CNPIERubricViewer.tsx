import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CNPIERubricCriteria } from "@/hooks/useCNPIERubric";
import { Target, FileText, Lightbulb } from "lucide-react";

interface CNPIERubricViewerProps {
  rubricas: CNPIERubricCriteria[];
  destacarCriterios?: string[];
}

export function CNPIERubricViewer({ rubricas, destacarCriterios = [] }: CNPIERubricViewerProps) {
  const totalPuntaje = rubricas.reduce((sum, r) => sum + r.puntaje_maximo, 0);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Rúbrica Oficial CNPIE {rubricas[0]?.categoria}
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
          {rubricas.map((rubrica) => {
            const isDestacado = destacarCriterios.includes(rubrica.criterio);
            return (
              <AccordionItem key={rubrica.id} value={rubrica.id}>
                <AccordionTrigger className={isDestacado ? "text-primary font-semibold" : ""}>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{rubrica.criterio}</span>
                    <Badge variant={isDestacado ? "default" : "secondary"}>
                      {rubrica.puntaje_maximo} pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Indicador */}
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-semibold text-sm mb-1">Indicador</p>
                        <p className="text-sm text-muted-foreground">{rubrica.indicador}</p>
                      </div>
                    </div>

                    {/* Descripción */}
                    {rubrica.descripcion && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{rubrica.descripcion}</p>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {rubrica.recomendaciones && (
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mt-1" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Recomendaciones</p>
                          <p className="text-sm text-muted-foreground">{rubrica.recomendaciones}</p>
                        </div>
                      </div>
                    )}

                    {/* Extensión máxima */}
                    {rubrica.extension_maxima && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          Máximo: {rubrica.extension_maxima.toLocaleString()} caracteres
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
