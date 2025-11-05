import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Question {
  categoria: string;
  pregunta: string;
  objetivo: string;
}

interface QuestionsFormProps {
  preguntas: Question[];
  onSubmit: (respuestas: Record<string, string>) => void;
  loading?: boolean;
}

export default function QuestionsForm({ preguntas, onSubmit, loading }: QuestionsFormProps) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    onSubmit(respuestas);
  };

  const categorias = Array.from(new Set(preguntas.map(p => p.categoria)));
  const allAnswered = preguntas.every((_, i) => respuestas[i.toString()]?.trim());

  return (
    <div className="space-y-6">
      {categorias.map((categoria) => {
        const preguntasCategoria = preguntas
          .map((p, i) => ({ ...p, index: i }))
          .filter(p => p.categoria === categoria);

        return (
          <Card key={categoria} className="border-0 shadow-md" style={{ backgroundColor: '#E6F4F1' }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#005C6B' }}>
                {categoria}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preguntasCategoria.map(({ pregunta, objetivo, index }) => (
                <div key={index} className="space-y-2">
                  <div>
                    <p className="font-medium text-sm mb-1" style={{ color: '#1A1A1A' }}>
                      {pregunta}
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#00A6A6' }}>
                      {objetivo}
                    </p>
                  </div>
                  <Textarea
                    value={respuestas[index.toString()] || ''}
                    onChange={(e) => setRespuestas({
                      ...respuestas,
                      [index.toString()]: e.target.value
                    })}
                    placeholder="Escribe tu respuesta aquí..."
                    className="min-h-[100px] border-0"
                    style={{ backgroundColor: '#DDF4F2', color: '#1A1A1A' }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || loading}
          className="text-white font-medium px-8"
          style={{ backgroundColor: '#00A6A6' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analizando respuestas...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Obtener recomendación de proyecto
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
