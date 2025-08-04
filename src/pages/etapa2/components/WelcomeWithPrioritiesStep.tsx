import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Target, CheckCircle, BookOpen, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface WelcomeWithPrioritiesStepProps {
  sessionId: string;
  onNext: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

interface Priority {
  id: string;
  title: string;
  description: string;
  impact_score: number;
  feasibility_score: number;
}

export const WelcomeWithPrioritiesStep = ({ 
  sessionId, 
  onNext, 
  sessionData, 
  onUpdateSessionData 
}: WelcomeWithPrioritiesStepProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    sessionData?.selected_priorities || []
  );
  const [accelerator3Data, setAccelerator3Data] = useState<any>(null);

  useEffect(() => {
    loadAccelerator3Results();
  }, []);

  const loadAccelerator3Results = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('get-accelerator3-results', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data.success && data.accelerator3_data) {
        setAccelerator3Data(data.accelerator3_data);
        
        // Extract priorities from Accelerator 3 results
        const extractedPriorities = data.priorities || [];
        setPriorities(extractedPriorities);
        
        if (extractedPriorities.length === 0) {
          setError("No se encontraron prioridades del Acelerador 3. Por favor, completa el Acelerador 3 primero.");
        }
      } else {
        setError("No se encontraron resultados del Acelerador 3. Por favor, completa el Acelerador 3 primero.");
      }
    } catch (error) {
      console.error('Error loading Accelerator 3 results:', error);
      setError("Error al cargar los resultados del Acelerador 3");
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados del Acelerador 3",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritySelection = (priorityId: string, checked: boolean) => {
    let newSelected = [...selectedPriorities];
    
    if (checked) {
      if (newSelected.length < 2) {
        newSelected.push(priorityId);
      } else {
        toast({
          title: "Máximo alcanzado",
          description: "Solo puedes seleccionar máximo 2 prioridades",
          variant: "destructive",
        });
        return;
      }
    } else {
      newSelected = newSelected.filter(id => id !== priorityId);
    }
    
    setSelectedPriorities(newSelected);
  };

  const handleContinue = () => {
    if (selectedPriorities.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Debes seleccionar al menos 1 prioridad para continuar",
        variant: "destructive",
      });
      return;
    }

    const updatedData = {
      ...sessionData,
      selected_priorities: selectedPriorities,
      accelerator3_data: accelerator3Data,
      priorities: priorities.filter(p => selectedPriorities.includes(p.id))
    };
    
    onUpdateSessionData(updatedData);
    onNext();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando resultados del Acelerador 3...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Recuperando tus prioridades identificadas...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Error al cargar datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadAccelerator3Results} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Bienvenido al Acelerador 4: Selección de Estrategias Metodológicas
          </CardTitle>
          <CardDescription>
            Este acelerador te guiará para generar y ajustar un catálogo de estrategias pedagógicas activas basadas en normativa MINEDU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">¿Qué lograrás?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Catálogo de 6 estrategias pedagógicas adaptadas a tu contexto</li>
              <li>• Estrategias alineadas con normativa MINEDU y seguridad hídrica</li>
              <li>• Informe justificativo con citas normativas</li>
              <li>• Insumos preparados para diseño de unidades didácticas</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Datos recuperados del Acelerador 3:</h4>
            <div className="text-sm text-green-800">
              <Badge variant="outline" className="mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                {priorities.length} prioridades identificadas
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priorities Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Selecciona tus Prioridades
          </CardTitle>
          <CardDescription>
            De las prioridades identificadas en el Acelerador 3, selecciona las 2 más importantes para enfocar las estrategias metodológicas:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorities.map((priority) => (
              <div
                key={priority.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedPriorities.includes(priority.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={priority.id}
                    checked={selectedPriorities.includes(priority.id)}
                    onCheckedChange={(checked) => 
                      handlePrioritySelection(priority.id, checked as boolean)
                    }
                    disabled={
                      !selectedPriorities.includes(priority.id) && 
                      selectedPriorities.length >= 2
                    }
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={priority.id}
                      className="font-medium cursor-pointer"
                    >
                      {priority.title}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {priority.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Impacto: {priority.impact_score}/10
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Viabilidad: {priority.feasibility_score}/10
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Seleccionadas:</strong> {selectedPriorities.length} de 2 prioridades máximo
            </p>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full mt-4"
            disabled={selectedPriorities.length === 0}
          >
            Continuar con las prioridades seleccionadas
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};