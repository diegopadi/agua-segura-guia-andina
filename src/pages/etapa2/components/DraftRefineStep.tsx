import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle, 
  Edit3,
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DraftRefineStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const DraftRefineStep: React.FC<DraftRefineStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
}) => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [unitDraft, setUnitDraft] = useState<string>('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [refinementCount, setRefinementCount] = useState(0);

  useEffect(() => {
    // Cargar datos existentes o generar borrador
    if (sessionData?.phase_data?.borrador?.draft_content) {
      setUnitDraft(sessionData.phase_data.borrador.draft_content);
      setMessages(sessionData.phase_data.borrador.chat_history || []);
      setRefinementCount(sessionData.phase_data.borrador.refinement_count || 0);
    } else {
      generateUnitDraft();
    }
  }, [sessionId, sessionData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateUnitDraft = async () => {
    setGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla10_borrador_unidad',
          session_data: sessionData
        }
      });

      if (error) throw error;

      if (data?.content) {
        setUnitDraft(data.content);
        
        // Crear mensaje inicial del asistente
        const initialMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `He generado el borrador de tu unidad didáctica basándome en tus respuestas. Puedes revisarlo en el panel de la derecha y hacer preguntas o solicitar cambios específicos. 

¿En qué aspecto te gustaría que profundice o qué cambios necesitas?`,
          timestamp: Date.now(),
        };

        setMessages([initialMessage]);
        
        // Guardar en sesión
        const updatedSessionData = {
          ...sessionData,
          phase_data: {
            ...sessionData.phase_data,
            borrador: {
              draft_content: data.content,
              chat_history: [initialMessage],
              generated_at: new Date().toISOString(),
              refinement_count: 0
            }
          }
        };
        
        onUpdateSessionData(updatedSessionData);
        
        toast({
          title: "Borrador generado",
          description: "Tu unidad didáctica está lista para revisar y refinar",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el borrador. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDraft(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || sendingMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setSendingMessage(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-strategies-refinement', {
        body: {
          session_id: sessionId,
          user_message: userInput,
          current_draft: unitDraft,
          chat_history: newMessages,
          session_data: sessionData
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: Date.now() + 1,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Si hay una nueva versión del borrador
      if (data.updated_draft) {
        setUnitDraft(data.updated_draft);
        setRefinementCount(prev => prev + 1);
      }

      // Guardar conversación y borrador actualizado
      const updatedSessionData = {
        ...sessionData,
        phase_data: {
          ...sessionData.phase_data,
          borrador: {
            ...sessionData.phase_data?.borrador,
            draft_content: data.updated_draft || unitDraft,
            chat_history: finalMessages,
            last_updated: new Date().toISOString(),
            refinement_count: data.updated_draft ? refinementCount + 1 : refinementCount
          }
        }
      };
      
      onUpdateSessionData(updatedSessionData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const regenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla10_borrador_unidad',
          session_data: {
            ...sessionData,
            regeneration_request: true,
            previous_draft: unitDraft,
            chat_feedback: messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
          }
        }
      });

      if (error) throw error;

      if (data?.content) {
        setUnitDraft(data.content);
        setRefinementCount(prev => prev + 1);
        
        const regenerationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'He regenerado completamente el borrador considerando tu feedback anterior. Revisa los cambios y continúa refinando si es necesario.',
          timestamp: Date.now(),
        };

        const updatedMessages = [...messages, regenerationMessage];
        setMessages(updatedMessages);
        
        // Actualizar sesión
        const updatedSessionData = {
          ...sessionData,
          phase_data: {
            ...sessionData.phase_data,
            borrador: {
              ...sessionData.phase_data?.borrador,
              draft_content: data.content,
              chat_history: updatedMessages,
              last_regenerated: new Date().toISOString(),
              refinement_count: refinementCount + 1
            }
          }
        };
        
        onUpdateSessionData(updatedSessionData);
        
        toast({
          title: "Borrador regenerado",
          description: "Se ha creado una nueva versión del borrador",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo regenerar el borrador",
        variant: "destructive",
      });
    } finally {
      setGeneratingDraft(false);
    }
  };

  const isPhaseComplete = () => {
    return unitDraft.length > 0 && messages.length >= 2; // Al menos intercambio inicial
  };

  if (generatingDraft && !unitDraft) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Generando borrador de unidad didáctica</h3>
              <p className="text-muted-foreground">
                Procesando tus respuestas para crear una unidad didáctica personalizada...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Fase 3: Borrador y Refinamiento
              </CardTitle>
              <CardDescription>
                Revisa tu unidad didáctica y refínala usando el chat interactivo
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {refinementCount > 0 && (
                <Badge variant="outline">
                  {refinementCount} refinamiento{refinementCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Ocultar' : 'Mostrar'} vista previa
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Chat */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat de Refinamiento
            </CardTitle>
            <CardDescription>
              Haz preguntas y solicita cambios específicos para mejorar tu unidad
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col p-0">
            {/* Mensajes */}
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div
                        className={`rounded-lg p-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sendingMessage && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <div className="bg-secondary rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Haz una pregunta o solicita cambios específicos..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[60px] resize-none"
                  disabled={sendingMessage}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={sendMessage}
                    disabled={!userInput.trim() || sendingMessage}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={regenerateDraft}
                    disabled={generatingDraft}
                    variant="outline"
                    size="sm"
                    title="Regenerar borrador completo"
                  >
                    {generatingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Vista Previa */}
        {showPreview && (
          <Card className="h-[600px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vista Previa de la Unidad
              </CardTitle>
              <CardDescription>
                Borrador actual de tu unidad didáctica
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4">
                {unitDraft ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: unitDraft }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>El borrador se mostrará aquí una vez generado</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sugerencias rápidas */}
      {unitDraft && messages.length <= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sugerencias para refinar tu unidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '¿Puedes agregar más actividades prácticas?',
                'Necesito adaptar esto para estudiantes con NEE',
                '¿Cómo puedo evaluar mejor el logro de competencias?',
                'Quiero incluir más recursos tecnológicos',
                'Ajusta la temporalización a 4 semanas',
                'Añade estrategias de diferenciación'
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto p-2 text-xs"
                  onClick={() => setUserInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        
        <Button 
          onClick={onNext} 
          disabled={!isPhaseComplete()}
          className="flex items-center gap-2"
        >
          {isPhaseComplete() ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Finalizar Unidad Didáctica
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" />
              Completa el refinamiento
            </>
          )}
        </Button>
      </div>
    </div>
  );
};