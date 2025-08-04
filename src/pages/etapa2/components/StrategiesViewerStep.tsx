import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RefreshCw
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

  const sendMessage = async () => {
    if (!userInput.trim() || chatLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-strategies-refinement', {
        body: {
          session_id: sessionId,
          message: newMessage.content,
          chat_history: [...chatMessages, newMessage],
          session_data: sessionData,
          template_id: step.template_id
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
      if (data.refined_strategies) {
        const updatedResult = {
          ...result,
          strategies: data.refined_strategies
        };
        setResult(updatedResult);
        onUpdateSessionData({
          ...sessionData,
          strategies_result: updatedResult
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
            <Badge variant="secondary">
              {result?.strategies?.length || 0} estrategias
            </Badge>
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

          {/* Report Content */}
          <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
            {result?.html_content ? (
              <div dangerouslySetInnerHTML={{ __html: result.html_content }} />
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
          </CardTitle>
          <CardDescription>
            Conversa con la IA para refinar y ajustar las estrategias generadas
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
                placeholder="Escribe tu mensaje para refinar las estrategias..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[60px]"
                disabled={chatLoading}
              />
              <Button 
                onClick={sendMessage} 
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