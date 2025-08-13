import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  onNext: () => void;
}

export default function Step1Welcome({ onNext }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bienvenida al Acelerador 5</CardTitle>
        <CardDescription>
          En este módulo construiremos tu Unidad de Aprendizaje paso a paso, integrando estrategias pedagógicas y priorizando la seguridad hídrica en tu institución educativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button onClick={onNext}>Comenzar</Button>
      </CardContent>
    </Card>
  );
}
