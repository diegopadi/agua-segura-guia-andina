import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { A5SituationPurposeData, A5InfoData, A4Inputs } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  data: A5SituationPurposeData;
  onChange: (data: A5SituationPurposeData) => void;
  onNext: () => void;
  onPrev: () => void;
  info: A5InfoData;
  a4: A4Inputs | null;
  sessionId: string | null;
  sessionData: any;
  setSessionData: (data: any) => void;
}

export default function Step3SituationPurpose({ data, onChange, onNext, onPrev, info, a4, sessionId, sessionData, setSessionData }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getA3Context = async (): Promise<string> => {
    try {
      if (!user?.id) return '';
      const { data, error } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('user_id', user.id)
        .eq('acelerador_number', 3)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      const sd: any = data?.session_data || {};
      const html: string = sd?.priority_report?.html_content || '';
      // Fallbacks
      const textAlt: string = sd?.priority_report?.text_content || sd?.priority_report?.summary || '';
      return html || textAlt || '';
    } catch (e) {
      console.warn('[A5][Step3] No se pudo recuperar contexto del A3:', e);
      return '';
    }
  };

  const generate = async () => {
    try {
      setLoading(true);

      // Validaciones mínimas
      const required = [info?.institucion, info?.area, info?.grado];
      if (required.some((v) => !v || !String(v).trim())) {
        toast({ title: "Completa los datos", description: "Llena institución, área y grado en el Paso 2.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!a4 || ((a4.priorities?.length ?? 0) === 0 && (a4.strategies?.length ?? 0) === 0)) {
        toast({ title: "Faltan insumos", description: "Selecciona prioridades y estrategias del Acelerador 4.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const a3Context = await getA3Context();

      const { data: resp, error } = await supabase.functions.invoke('generate-situation-purpose-ac5', {
        body: {
          info,
          a4_inputs: a4,
          a3_context: a3Context,
        }
      });

      if (error) throw error;
      if (!resp?.success) throw new Error(resp?.error || 'No se pudo generar el contenido');

      const allEmpty = !resp.situacion && !resp.proposito && !resp.reto && !resp.producto;
      if (allEmpty) {
        throw new Error('La IA no devolvió contenido. Vuelve a intentar.');
      }

      const newSituationData = {
        situacion: resp.situacion || data.situacion,
        proposito: resp.proposito || data.proposito,
        reto: resp.reto || data.reto,
        producto: resp.producto || data.producto,
      };

      onChange(newSituationData);

      // Auto-save after generation
      if (user && sessionId) {
        const newData = { ...sessionData, situation: newSituationData };
        setSessionData(newData);
        await supabase.from('acelerador_sessions').update({ session_data: newData }).eq('id', sessionId);
      }

      toast({ title: "Generado con IA", description: "Contenido generado y guardado automáticamente." });
    } catch (e: any) {
      console.error('[A5][Step3] generate error', e);
      toast({ title: "Error", description: e.message || 'No se pudo generar el contenido', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!user || !sessionId) {
      toast({ title: "Guardado localmente", description: "Los datos se guardarán al iniciar sesión." });
      return;
    }

    try {
      const newData = { ...sessionData, situation: data };
      setSessionData(newData);
      await supabase.from('acelerador_sessions').update({ session_data: newData }).eq('id', sessionId);
      toast({ title: "Guardado", description: "Situación y propósitos guardados correctamente." });
    } catch (error) {
      console.error('Error saving situation data:', error);
      toast({ title: "Error", description: "No se pudo guardar. Inténtalo de nuevo.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situación significativa y propósitos de aprendizaje</CardTitle>
        <CardDescription>Aquí generaremos con IA: la situación significativa, el propósito, el reto y el producto de la Unidad de Aprendizaje.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Situación significativa</p>
            <Textarea rows={6} value={data.situacion} onChange={(e) => onChange({ ...data, situacion: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Propósito</p>
            <Textarea rows={6} value={data.proposito} onChange={(e) => onChange({ ...data, proposito: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Reto</p>
            <Textarea rows={6} value={data.reto} onChange={(e) => onChange({ ...data, reto: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Producto</p>
            <Textarea rows={6} value={data.producto} onChange={(e) => onChange({ ...data, producto: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={generate} disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</>) : 'Generar con IA'}
            </Button>
            <Button variant="secondary" onClick={generate} disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</>) : 'Re-generar'}
            </Button>
            <Button variant="secondary" onClick={save} disabled={loading}>Guardar</Button>
            <Button onClick={onNext} disabled={loading}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
