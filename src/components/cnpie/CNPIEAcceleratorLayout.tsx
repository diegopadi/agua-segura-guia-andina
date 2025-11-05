import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CNPIEValidationModal } from "./CNPIEValidationModal";

interface CNPIEAcceleratorLayoutProps {
  proyectoId: string;
  tipoProyecto: '2A' | '2B' | '2C';
  etapaNumber: number;
  aceleradorNumber: number;
  children: ReactNode;
  onSave: (data: any) => Promise<boolean>;
  onValidate: () => Promise<boolean>;
  canProceed: boolean;
  currentProgress?: number;
  titulo: string;
  descripcion: string;
}

export function CNPIEAcceleratorLayout({
  proyectoId,
  tipoProyecto,
  etapaNumber,
  aceleradorNumber,
  children,
  onSave,
  onValidate,
  canProceed,
  currentProgress = 0,
  titulo,
  descripcion
}: CNPIEAcceleratorLayoutProps) {
  const navigate = useNavigate();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({});
    setSaving(false);
  };

  const handleValidate = async () => {
    const success = await onValidate();
    if (success) {
      setShowValidationModal(false);
      
      // Lógica de navegación inteligente
      if (etapaNumber === 1 && aceleradorNumber === 1) {
        // Después de Etapa 1, ir a Overview de Etapa 2
        navigate(`/cnpie/${tipoProyecto.toLowerCase()}/etapa2/overview`);
      } else if (etapaNumber === 2 && aceleradorNumber >= 2 && aceleradorNumber < 7) {
        // Dentro de Etapa 2, ir al siguiente acelerador
        navigate(`/cnpie/${tipoProyecto.toLowerCase()}/etapa2/acelerador${aceleradorNumber + 1}`);
      } else if (etapaNumber === 2 && aceleradorNumber === 7) {
        // Después del último acelerador de Etapa 2, ir a la Evaluación Final
        navigate(`/cnpie/${tipoProyecto.toLowerCase()}/etapa2/evaluacion-final`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/proyectos/${tipoProyecto.toLowerCase()}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Proyecto {tipoProyecto}
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{titulo}</h1>
              <p className="text-muted-foreground">{descripcion}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Etapa {etapaNumber} • Acelerador {aceleradorNumber}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso del acelerador</span>
              <span>{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {children}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar progreso"}
            </Button>

            <Button
              onClick={() => setShowValidationModal(true)}
              disabled={!canProceed}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validar y continuar
            </Button>
          </div>
        </div>
      </div>

      <CNPIEValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={handleValidate}
        etapa={etapaNumber}
        acelerador={aceleradorNumber}
      />
    </div>
  );
}
