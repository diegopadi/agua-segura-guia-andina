import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MiniCambioProyectoProps {
  variant?: "floating" | "inline";
}

export function MiniCambioProyecto({ variant = "floating" }: MiniCambioProyectoProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetRoute, setTargetRoute] = useState("");

  const getCurrentType = () => {
    if (location.pathname.includes("/2a")) return "2A";
    if (location.pathname.includes("/2b")) return "2B";
    if (location.pathname.includes("/2c")) return "2C";
    return null;
  };

  const currentType = getCurrentType();

  const proyectos = [
    { tipo: "2A", nombre: "Consolidado", ruta: "/proyectos/2a", color: "#005C6B" },
    { tipo: "2B", nombre: "Implementación", ruta: "/proyectos/2b", color: "#00A6A6" },
    { tipo: "2C", nombre: "Investigación-Acción", ruta: "/proyectos/2c", color: "#1BBEAE" }
  ];

  const proyectosDisponibles = proyectos.filter(p => p.tipo !== currentType);

  const handleCambiarTipo = (ruta: string) => {
    setTargetRoute(ruta);
    setShowMenu(false);
    setShowConfirm(true);
  };

  const confirmarCambio = () => {
    navigate(targetRoute);
    setShowConfirm(false);
    setTargetRoute("");
  };

  if (!currentType && variant === "floating") {
    return null; // No mostrar el botón flotante si no estamos en una vista de proyecto
  }

  if (variant === "floating") {
    return (
      <>
        <Popover open={showMenu} onOpenChange={setShowMenu}>
          <PopoverTrigger asChild>
            <Button
              className="fixed top-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: '#005C6B' }}
              title="Cambiar tipo de proyecto"
            >
              <RefreshCw className="w-6 h-6 text-white" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-3 animate-scale-in"
            style={{ backgroundColor: '#DDF4F2' }}
            align="end"
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#005C6B' }}>
                Cambiar tipo de proyecto
              </p>
              <p className="text-xs mb-3" style={{ color: '#1A1A1A', opacity: 0.7 }}>
                Actualmente en: Proyecto {currentType}
              </p>
              <div className="space-y-2">
                {proyectosDisponibles.map((proyecto) => (
                  <Button
                    key={proyecto.tipo}
                    onClick={() => handleCambiarTipo(proyecto.ruta)}
                    className="w-full justify-start text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: proyecto.color }}
                  >
                    <span className="font-bold mr-2">{proyecto.tipo}</span>
                    {proyecto.nombre}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent style={{ backgroundColor: '#DDF4F2' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#005C6B' }}>
                ¿Deseas cambiar de tipo de proyecto?
              </DialogTitle>
              <DialogDescription style={{ color: '#1A1A1A' }}>
                Podrás volver a este tipo más adelante sin perder información.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                style={{ backgroundColor: '#E6F4F1', color: '#005C6B' }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarCambio}
                className="text-white font-medium"
                style={{ backgroundColor: '#005C6B' }}
              >
                Sí, cambiar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Variant inline (para el sidebar o vista dedicada)
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-semibold" style={{ color: '#005C6B' }}>
        Cambiar tipo de proyecto
      </p>
      {currentType && (
        <p className="text-xs mb-3" style={{ color: '#1A1A1A', opacity: 0.7 }}>
          Actualmente en: Proyecto {currentType}
        </p>
      )}
      <div className="space-y-2">
        {proyectos.filter(p => p.tipo !== currentType).map((proyecto) => (
          <Button
            key={proyecto.tipo}
            onClick={() => handleCambiarTipo(proyecto.ruta)}
            className="w-full justify-start text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: proyecto.color }}
          >
            <span className="font-bold mr-2">{proyecto.tipo}</span>
            {proyecto.nombre}
          </Button>
        ))}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent style={{ backgroundColor: '#DDF4F2' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#005C6B' }}>
              ¿Deseas cambiar de tipo de proyecto?
            </DialogTitle>
            <DialogDescription style={{ color: '#1A1A1A' }}>
              Podrás volver a este tipo más adelante sin perder información.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              style={{ backgroundColor: '#E6F4F1', color: '#005C6B' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarCambio}
              className="text-white font-medium"
              style={{ backgroundColor: '#005C6B' }}
            >
              Sí, cambiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
