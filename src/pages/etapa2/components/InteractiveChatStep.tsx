import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface InteractiveChatStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
  step: {
    title: string;
    description: string;
    template_id: string;
  };
}

export const InteractiveChatStep: React.FC<InteractiveChatStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
  step
}) => {
  const [messages, setMessages] = useState<Message[]>(
    sessionData?.chat_history || []
  );
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial AI message if no chat history exists
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de IA para refinar las estrategias metodológicas. Puedes pedirme que ajuste, modifique o mejore cualquier aspecto de las estrategias generadas. ¿En qué te gustaría que me enfoque?',
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    }
  }, []);

  useEffect(() => {
    // Save chat history to session data
    onUpdateSessionData({
      ...sessionData,
      chat_history: messages
    });
  }, [messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-strategies-refinement', {
        body: {
          session_id: sessionId,
          message: inputMessage,
          chat_history: messages,
          session_data: sessionData,
          template_id: step.template_id
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update session data with any refined strategies
      if (data.refined_strategies) {
        onUpdateSessionData({
          ...sessionData,
          refined_strategies: data.refined_strategies,
          chat_history: [...messages, userMessage, assistantMessage]
        });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error en el chat",
        description: error.message || "Hubo un problema al enviar el mensaje.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {step.title}
          </CardTitle>
          <CardDescription>
            {step.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje para refinar las estrategias..."
                  disabled={loading}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button onClick={onNext}>
          Continuar al siguiente paso
        </Button>
      </div>
    </div>
  );
};