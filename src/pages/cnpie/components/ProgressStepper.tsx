import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, LucideIcon } from "lucide-react";

export interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  title?: string;
}

export function ProgressStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  title = "Progreso del Diagnóstico",
}: ProgressStepperProps) {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    return "pending";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress
            value={(currentStep / steps.length) * 100}
            className="h-2"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {steps.map((step) => {
              const status = getStepStatus(step.number);
              const IconComponent = step.icon;
              return (
                <div
                  key={step.number}
                  className={`p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                    status === "completed"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : status === "current"
                      ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-400"
                      : "bg-muted border-muted-foreground/20 text-muted-foreground"
                  }`}
                  onClick={() =>
                    status !== "pending" && onStepClick(step.number)
                  }
                >
                  <div className="flex justify-center mb-2">
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {step.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
