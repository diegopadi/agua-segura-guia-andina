import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface CNPIEValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  etapa: number;
  acelerador: number;
}

export function CNPIEValidationModal({
  isOpen,
  onClose,
  onConfirm,
  etapa,
  acelerador
}: CNPIEValidationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Validar Acelerador {acelerador}
          </DialogTitle>
          <DialogDescription>
            Estás a punto de completar este acelerador y pasar al siguiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Antes de continuar</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Verifica que hayas completado todos los campos</li>
                <li>• Asegúrate de que tus respuestas sean claras y completas</li>
                <li>• Los datos guardados se usarán en los siguientes aceleradores</li>
              </ul>
            </div>
          </div>

          {etapa === 2 && acelerador === 7 ? (
            <p className="text-sm">
              Una vez validado, pasarás a la <strong>Evaluación Final de Etapa 2</strong> donde podrás revisar tu puntaje CNPIE y descargar la documentación.
            </p>
          ) : (
            <p className="text-sm">
              Una vez validado, podrás acceder al <strong>Acelerador {acelerador + 1}</strong> de la Etapa {etapa}.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Revisar datos
          </Button>
          <Button onClick={onConfirm}>
            Confirmar y continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
