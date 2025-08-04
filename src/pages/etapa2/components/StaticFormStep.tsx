import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  type: 'select' | 'textarea' | 'text';
  options?: string[];
  required: boolean;
}

interface StaticFormStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
  staticData: {
    questions: Question[];
  };
}

export const StaticFormStep: React.FC<StaticFormStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
  staticData
}) => {
  const [formData, setFormData] = useState<Record<number, string>>(
    sessionData?.context_data || {}
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    // Save form data to session whenever it changes
    onUpdateSessionData({
      ...sessionData,
      context_data: formData
    });
  }, [formData]);

  const handleInputChange = (questionId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<number, string> = {};
    
    staticData.questions.forEach(question => {
      if (question.required && !formData[question.id]?.trim()) {
        newErrors[question.id] = 'Este campo es obligatorio';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const renderQuestion = (question: Question) => {
    const value = formData[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'select':
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {question.text}
              {question.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleInputChange(question.id, newValue)}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecciona una opción..." />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {question.text}
              {question.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className={error ? 'border-destructive' : ''}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Definición de Contexto
          </CardTitle>
          <CardDescription>
            Indica si tu aula es urbana o rural, multigrado/EIB y qué recursos TIC dispones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {staticData.questions.map(renderQuestion)}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button onClick={handleNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
};