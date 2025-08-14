import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { A4Inputs, A4PriorityData, A4StrategyData } from "./types";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  onNext: () => void;
  onValidated?: (inputs: A4Inputs) => void;
  sessionId: string | null;
  sessionData: any;
  setSessionData: (data: any) => void;
}

export default function Step1Welcome({ onNext, onValidated, sessionId, sessionData, setSessionData }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<A4PriorityData[]>([]);
  const [strategies, setStrategies] = useState<A4StrategyData[]>([]);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    // Only load data if we're in Acelerador 5 context
    if (!sessionId || sessionData?.acelerador_number === 4) {
      console.log('[A5][Step1] Skipping load - not in A5 context or wrong accelerator');
      setLoading(false);
      return;
    }

    const loadFromA4 = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?.id) throw new Error("Usuario no autenticado");

        console.log('[A5][Step1] Loading data from Acelerador 4 for user:', user.id);

        const { data, error } = await supabase
          .from('acelerador_sessions')
          .select('session_data')
          .eq('user_id', user.id)
          .eq('acelerador_number', 4)
          .single();

        if (error) {
          console.error('[A5][Step1] Error fetching A4 session:', error);
          throw error;
        }

        const sd: any = data?.session_data || {};
        console.log('[A5][Step1] Session data from A4:', sd);

        // Prioridades seleccionadas en A4 - buscar en múltiples campos por compatibilidad
        let rawPriorities = [];
        if (Array.isArray(sd?.priorities)) {
          rawPriorities = sd.priorities;
          console.log('[A5][Step1] Found priorities in sd.priorities:', rawPriorities.length);
        } else if (Array.isArray(sd?.selected_priorities)) {
          // Fallback: si hay selected_priorities, buscar las prioridades completas en accelerator3_data
          const selectedIds = sd.selected_priorities;
          const a3Data = sd?.accelerator3_data;
          if (a3Data && Array.isArray(a3Data.priorities)) {
            rawPriorities = a3Data.priorities.filter((p: any) => selectedIds.includes(p.id));
            console.log('[A5][Step1] Found priorities via selected_priorities fallback:', rawPriorities.length);
          }
        }

        // Si no hay prioridades en A4, intentar cargar desde A3 directamente
        if (rawPriorities.length === 0) {
          console.log('[A5][Step1] No priorities found in A4, trying to load from A3...');
          try {
            const { data: a3Response, error: a3Error } = await supabase.functions.invoke('get-accelerator3-results', {
              body: { session_id: sessionId }
            });

            if (!a3Error && a3Response?.success && a3Response?.priorities) {
              rawPriorities = a3Response.priorities.slice(0, 2); // Tomar las primeras 2
              console.log('[A5][Step1] Loaded priorities from A3 as fallback:', rawPriorities.length);
            }
          } catch (a3Error) {
            console.error('[A5][Step1] Error loading from A3:', a3Error);
          }
        }

        const pr: A4PriorityData[] = rawPriorities.slice(0, 2).map((p: any) => ({
          id: String(p.id || crypto.randomUUID()),
          title: p.title || p.nombre || 'Prioridad',
          description: p.description || p.descripcion || '',
          impact_score: Number(p.impact_score ?? 0),
          feasibility_score: Number(p.feasibility_score ?? 0),
        }));

        // Estrategias adaptadas o seleccionadas en A4
        const adapted = sd?.strategies_adapted?.strategies || [];
        const result = sd?.strategies_result?.strategies || [];
        const selected = sd?.strategies_selected || [];
        const base = (Array.isArray(adapted) && adapted.length > 0)
          ? adapted
          : (Array.isArray(result) && result.length > 0)
            ? result
            : (Array.isArray(selected) ? selected : []);

        console.log('[A5][Step1] Strategies found:', base.length, 'from source:', 
          adapted.length > 0 ? 'adapted' : result.length > 0 ? 'result' : 'selected');

        const st: A4StrategyData[] = base.slice(0, 5).map((s: any) => ({
          id: String(s.id || crypto.randomUUID()),
          title: s.title || s.nombre || 'Estrategia',
          description: s.description || s.descripcion || '',
        }));

        setPriorities(pr);
        setStrategies(st);

        console.log('[A5][Step1] Final data loaded - Priorities:', pr.length, 'Strategies:', st.length);

        if (pr.length === 0 && st.length === 0) {
          setError("No se han encontrado insumos del Acelerador 4. Por favor, complete el Acelerador 4 antes de continuar con el Acelerador 5.");
        } else if (pr.length === 0) {
          setError("No se encontraron prioridades del Acelerador 4. Verifique que haya completado el proceso de selección de prioridades.");
        } else if (st.length === 0) {
          setError("No se encontraron estrategias del Acelerador 4. Verifique que haya completado el proceso de selección de estrategias.");
        }
      } catch (e: any) {
        console.error('[A5][Step1] loadFromA4 error', e);
        setError("No se han encontrado insumos del Acelerador 4. Por favor, complete el Acelerador 4 antes de continuar con el Acelerador 5.");
      } finally {
        setLoading(false);
      }
    };

    loadFromA4();
  }, [user?.id, sessionId, sessionData?.acelerador_number]);

  const inputs: A4Inputs = useMemo(() => ({
    priorities,
    strategies,
    source: strategies.length > 0 ? 'adapted' : 'unknown',
  }), [priorities, strategies]);

  const handleValidate = async () => {
    setValidated(true);
    
    // Guardar la validación y los inputs de A4 en la sesión
    if (user && sessionId) {
      try {
        const newData = { 
          ...sessionData, 
          a4_inputs: inputs,
          step1_validated: true,
          validation_date: new Date().toISOString()
        };
        setSessionData(newData);
        await supabase.from('acelerador_sessions').update({ session_data: newData }).eq('id', sessionId);
        toast({ title: "Validado", description: "Datos validados y guardados correctamente." });
      } catch (error) {
        console.error('Error saving validation:', error);
        toast({ title: "Error", description: "No se pudo guardar la validación.", variant: "destructive" });
      }
    } else {
      toast({ title: "Validado", description: "Datos validados localmente." });
    }
  };

  const handleContinue = () => {
    if (onValidated) onValidated(inputs);
    else onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Bienvenido al Acelerador 5: Construcción de la Unidad de Aprendizaje
        </CardTitle>
        <CardDescription>
          En este acelerador, vamos a crear tu Unidad de Aprendizaje paso a paso. Para ello, partiremos de las prioridades y estrategias metodológicas que seleccionaste y contextualizaste en el Acelerador 4. Primero, revisa y valida que la información recuperada sea correcta; esta será la base para elaborar la situación significativa, el propósito, el reto, el producto y demás secciones de tu Unidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Recuperando datos del Acelerador 4...
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Datos recuperados</h3>
              {/* Prioridades */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Prioridades seleccionadas (hasta 2)</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {priorities.map((p) => (
                    <div key={p.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{p.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            <Badge variant="secondary">Impacto: {p.impact_score}/10</Badge>
                            <Badge variant="secondary">Viabilidad: {p.feasibility_score}/10</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {priorities.length === 0 && (
                    <div className="text-sm text-muted-foreground">No se encontraron prioridades.</div>
                  )}
                </div>
              </div>

              {/* Estrategias */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Estrategias pedagógicas adaptadas (hasta 5)</p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {strategies.map((s) => (
                    <div key={s.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">{s.title}</h4>
                          {s.description && (
                            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {strategies.length === 0 && (
                    <div className="text-sm text-muted-foreground">No se encontraron estrategias.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button variant="outline" onClick={handleValidate} disabled={validated || (!!error)}>
                {validated ? 'Validado' : 'Validar datos'}
              </Button>
              <Button onClick={handleContinue} disabled={!validated || (!!error)}>
                Continuar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
