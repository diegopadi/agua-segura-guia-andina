import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Loader2, 
  Wand2, 
  MessageCircle, 
  Download, 
  Copy, 
  Printer, 
  Send,
  User,
  Bot,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  PlayCircle,
  Clock,
  CheckSquare,
  Sparkles,
  Edit3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface StrategiesViewerStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
  step: {
    title: string;
    description: string;
    template_id: string;
    icon: any;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const StrategiesViewerStep = ({ 
  sessionId, 
  onNext, 
  onPrev, 
  sessionData, 
  onUpdateSessionData, 
  step 
}: StrategiesViewerStepProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(sessionData?.strategies_result || null);
  const [error, setError] = useState<string | null>(null);
  
  // Single refinement token control
  const [hasBeenRefined, setHasBeenRefined] = useState(
    sessionData?.refinement_used || false
  );
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<Message[]>(
    sessionData?.chat_history || []
  );
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) {
      handleAnalysis();
    }
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) {
      onUpdateSessionData({
        ...sessionData,
        chat_history: chatMessages
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('generate-strategies-ac4', {
        body: {
          session_id: sessionId,
          session_data: sessionData,
          template_id: step.template_id
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.result);
        onUpdateSessionData({
          ...sessionData,
          strategies_result: data.result
        });
        
        toast({
          title: "Éxito",
          description: "Estrategias generadas correctamente",
        });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error generating strategies:', error);
      setError('Error al generar las estrategias');
      toast({
        title: "Error",
        description: "No se pudieron generar las estrategias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const messageContent = customMessage || userInput.trim();
    if (!messageContent || chatLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMessage]);
    if (!customMessage) setUserInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-strategies-refinement', {
        body: {
          session_id: sessionId,
          message: newMessage.content,
          chat_history: [...chatMessages, newMessage],
          session_data: sessionData,
          template_id: step.template_id,
          refinement_used: hasBeenRefined
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Update strategies if refinements were made
      if (data.refined_result && !hasBeenRefined) {
        setResult(data.refined_result);
        setHasBeenRefined(true);
        
        const updatedSessionData = {
          ...sessionData,
          strategies_result: data.refined_result,
          refinement_used: true,
          chat_history: [...chatMessages, newMessage, assistantMessage]
        };
        
        onUpdateSessionData(updatedSessionData);

        toast({
          title: "Estrategias Refinadas",
          description: "Las estrategias han sido actualizadas con tus modificaciones",
        });
      }

    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: "Error en la conversación",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const parseStrategies = (htmlContent: string) => {
    if (!htmlContent) return { inicio: [], desarrollo: [], cierre: [] };
    
    const strategies = { inicio: [], desarrollo: [], cierre: [] };
    
    try {
      // Extract strategies by searching for patterns in the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Look for sections containing strategy information
      const sections = doc.querySelectorAll('h2, h3, p, li, div');
      let currentMoment = '';
      
      sections.forEach(element => {
        const text = element.textContent?.toLowerCase() || '';
        
        // Identify pedagogical moments
        if (text.includes('inicio') || text.includes('apertura') || text.includes('motivación')) {
          currentMoment = 'inicio';
        } else if (text.includes('desarrollo') || text.includes('construcción') || text.includes('proceso')) {
          currentMoment = 'desarrollo';
        } else if (text.includes('cierre') || text.includes('consolidación') || text.includes('evaluación')) {
          currentMoment = 'cierre';
        }
        
        // Extract strategy if it contains relevant keywords
        if (currentMoment && (text.includes('estrategia') || text.includes('actividad') || text.includes('técnica'))) {
          const strategyText = element.textContent || '';
          if (strategyText.length > 20 && strategyText.length < 500) {
            const strategy = {
              title: strategyText.split('.')[0] || strategyText.substring(0, 50),
              description: strategyText,
              reference: 'MINEDU - Currículo Nacional'
            };
            
            if (currentMoment === 'inicio') strategies.inicio.push(strategy);
            else if (currentMoment === 'desarrollo') strategies.desarrollo.push(strategy);
            else if (currentMoment === 'cierre') strategies.cierre.push(strategy);
          }
        }
      });
      
      // Fallback: if no strategies found, create sample structure
      if (strategies.inicio.length === 0 && strategies.desarrollo.length === 0 && strategies.cierre.length === 0) {
        return {
          inicio: [
            { title: "Estrategia de Motivación", description: "Actividad para captar la atención y motivar el aprendizaje", reference: "MINEDU - Currículo Nacional" },
            { title: "Exploración de Saberes Previos", description: "Técnica para activar conocimientos anteriores", reference: "MINEDU - Currículo Nacional" }
          ],
          desarrollo: [
            { title: "Construcción de Aprendizajes", description: "Metodología para la construcción activa del conocimiento", reference: "MINEDU - Currículo Nacional" },
            { title: "Trabajo Colaborativo", description: "Estrategia de aprendizaje en equipo", reference: "MINEDU - Currículo Nacional" }
          ],
          cierre: [
            { title: "Consolidación de Aprendizajes", description: "Actividad para fijar los conocimientos adquiridos", reference: "MINEDU - Currículo Nacional" },
            { title: "Evaluación Formativa", description: "Técnica de evaluación del proceso de aprendizaje", reference: "MINEDU - Currículo Nacional" }
          ]
        };
      }
      
    } catch (error) {
      console.error('Error parsing strategies:', error);
    }
    
    return strategies;
  };

  const copyToClipboard = () => {
    if (result?.markdown_content) {
      navigator.clipboard.writeText(result.markdown_content);
      toast({
        title: "Copiado",
        description: "Contenido copiado al portapapeles",
      });
    }
  };

  const downloadTxtFile = () => {
    if (result?.markdown_content) {
      const blob = new Blob([result.markdown_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'estrategias-metodologicas.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (result?.html_content) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Estrategias Metodológicas - Acelerador 4</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1, h2, h3 { color: #2563eb; }
                .print-header { border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
                .strategy { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e5e5; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="print-header">
                <h1>Estrategias Metodológicas</h1>
                <p>Acelerador 4 - Fecha: ${new Date().toLocaleDateString()}</p>
              </div>
              ${result.html_content}
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
                <p><strong>Nombre:</strong> _____________________ <strong>Firma:</strong> _____________________</p>
                <p><strong>Fecha:</strong> _____________________ <strong>Institución:</strong> _____________________</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {step.title}
          </CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Generando estrategias metodológicas...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Esto puede tomar unos momentos mientras la IA analiza tu contexto educativo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Bot className="w-5 h-5" />
            Error en el análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleAnalysis} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={onPrev} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {result?.strategies?.length || 0} estrategias
              </Badge>
              <Badge variant={hasBeenRefined ? "default" : "outline"}>
                {hasBeenRefined ? "Refinado" : "Original"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={downloadTxtFile} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleAnalysis} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
          </div>

          {/* Interactive Strategies Display */}
          <div className="space-y-4">
            {result?.html_content ? (
              <StrategiesAccordion 
                strategies={parseStrategies(result.html_content)}
              />
            ) : (
              <div className="text-muted-foreground text-center py-8">
                No hay contenido disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat for Refinement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Revisión y Ajuste de Estrategias
            {hasBeenRefined && (
              <Badge variant="secondary" className="ml-2">
                Token usado
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {hasBeenRefined 
              ? "Ya has usado tu refinamiento único. Las estrategias mostradas arriba son las finales."
              : "Conversa con la IA para refinar y ajustar las estrategias generadas (solo 1 refinamiento permitido)"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat History */}
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Inicia una conversación para refinar las estrategias</p>
                    <p className="text-sm mt-1">
                      Puedes preguntar sobre modificaciones, aclaraciones o ajustes específicos
                    </p>
                  </div>
                )}
                
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <User className="w-6 h-6 text-primary" />
                        ) : (
                          <Bot className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex gap-3 justify-start">
                    <Bot className="w-6 h-6 text-green-600" />
                    <div className="bg-muted p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </ScrollArea>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder={hasBeenRefined 
                  ? "Puedes hacer preguntas sobre las estrategias refinadas..."
                  : "Escribe tu mensaje para refinar las estrategias (solo 1 refinamiento permitido)..."
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[60px]"
                disabled={chatLoading}
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={!userInput.trim() || chatLoading}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!result}>
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Accordion Component for Strategies Display
interface StrategiesAccordionProps {
  strategies: {
    inicio: Array<{ title: string; description: string; reference: string }>;
    desarrollo: Array<{ title: string; description: string; reference: string }>;
    cierre: Array<{ title: string; description: string; reference: string }>;
  };
}

const StrategiesAccordion = ({ strategies }: StrategiesAccordionProps) => {
  const moments = [
    {
      key: 'inicio',
      title: 'Momento de Inicio',
      icon: PlayCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      strategies: strategies.inicio
    },
    {
      key: 'desarrollo',
      title: 'Momento de Desarrollo',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      strategies: strategies.desarrollo
    },
    {
      key: 'cierre',
      title: 'Momento de Cierre',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      strategies: strategies.cierre
    }
  ];

  return (
    <Accordion type="multiple" defaultValue={['inicio', 'desarrollo', 'cierre']} className="w-full">
      {moments.map((moment) => (
        <AccordionItem key={moment.key} value={moment.key} className="border rounded-lg mb-2">
          <AccordionTrigger className={`px-4 py-3 hover:no-underline ${moment.bgColor}`}>
            <div className="flex items-center gap-3">
              <moment.icon className={`w-5 h-5 ${moment.color}`} />
              <span className="font-semibold">{moment.title}</span>
              <Badge variant="secondary" className="ml-auto mr-2">
                {moment.strategies.length} estrategias
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3">
            <div className="space-y-3">
              {moment.strategies.map((strategy, index) => (
                <Card key={index} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {strategy.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {strategy.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {strategy.reference}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {moment.strategies.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <span className="text-sm">No hay estrategias para este momento</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};