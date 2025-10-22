import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniCambioProyecto as MiniWidget } from "@/components/MiniCambioProyecto";

export default function MiniCambioProyecto() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3" style={{ color: '#005C6B' }}>
            <RefreshCw className="w-10 h-10" />
            Cambiar tipo de proyecto
          </h1>
          <p className="text-lg mb-2" style={{ color: '#00A6A6' }}>
            Cambia rápidamente entre los tipos de proyecto del CNPIE 2025.
          </p>
          <p className="text-base max-w-3xl" style={{ color: '#1A1A1A' }}>
            Este módulo te permite navegar entre Proyecto 2A (Consolidado), 2B (Implementación) y 2C (Investigación-Acción) 
            de forma rápida y segura, sin perder tu progreso.
          </p>
        </div>

        {/* Panel de cambio */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle style={{ color: '#005C6B' }}>
              Selecciona el tipo de proyecto
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Elige el proyecto al que deseas cambiar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiniWidget variant="inline" />
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle style={{ color: '#005C6B' }}>
              ¿Cómo usar el cambio rápido?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#005C6B' }}
              >
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#005C6B' }}>
                  Botón flotante
                </p>
                <p className="text-sm" style={{ color: '#1A1A1A' }}>
                  En las vistas de proyecto 2A, 2B y 2C, encontrarás un botón flotante 🔄 en la esquina superior derecha.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#00A6A6' }}
              >
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#005C6B' }}>
                  Selección rápida
                </p>
                <p className="text-sm" style={{ color: '#1A1A1A' }}>
                  Al hacer clic, se despliega un menú con los tipos de proyecto disponibles.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#1BBEAE' }}
              >
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: '#005C6B' }}>
                  Cambio seguro
                </p>
                <p className="text-sm" style={{ color: '#1A1A1A' }}>
                  Confirma tu elección y serás redirigido al nuevo tipo de proyecto sin perder información.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/proyectos')}
            variant="outline"
            className="font-medium"
            style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al menú CNPIE
          </Button>
        </div>
      </div>
    </div>
  );
}
