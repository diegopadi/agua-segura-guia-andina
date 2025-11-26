import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface QuestionCardWithTextareaProps {
  questionNumber: string;
  questionText: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
  maxLength: number;
}

export function QuestionCardWithTextarea({
  questionNumber,
  questionText,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-[150px]",
  maxLength,
}: QuestionCardWithTextareaProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-amber-900">
            Pregunta {questionNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{questionText}</p>
        </CardContent>
      </Card>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={minHeight}
        maxLength={maxLength}
      />
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {value.length} / {maxLength} caracteres
        </span>
      </div>
    </div>
  );
}
