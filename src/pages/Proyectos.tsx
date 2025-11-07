import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings, Puzzle, BookOpen, ArrowLeft } from "lucide-react";

export default function Proyectos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Proyectos CNPIE 2025
          </h1>
          <p className="text-xl mb-2" style={{ color: '#00A6A6' }}>
            Selecciona cómo deseas iniciar o continuar tu postulación al CNPIE 2025.
          </p>
          <p className="text-base max-w-3xl mx-auto" style={{ color: '#1A1A1A' }}>
            En este módulo podrás crear, validar y presentar tu proyecto según las bases oficiales del CNPIE 2025.
          </p>
        </div>

        {/* Tarjeta de navegación */}
        <div className="max-w-2xl mx-auto mb-8">
          {/* Tarjeta - Elegir tipo manualmente */}
          <Card
            className="border-0 shadow-md hover:shadow-lg transition-shadow"
            style={{ backgroundColor: '#DDF4F2' }}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#00A6A6' }}
                >
                  <Puzzle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl" style={{ color: '#005C6B' }}>
                  Elegir tipo manualmente
                </CardTitle>
              </div>
              <CardDescription className="text-sm" style={{ color: '#1A1A1A', opacity: 0.8 }}>
                &nbsp;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: '#1A1A1A' }}>
                Si ya sabes el tipo de proyecto que presentarás, puedes ingresar directamente a 2A, 2B o 2C.
              </p>
              <Button 
                onClick={() => navigate('/proyectos/manual')}
                className="w-full bg-teal-800 hover:bg-teal-900 text-white font-medium"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enlaces secundarios */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-8 border-t border-gray-300">
          <button
            onClick={() => navigate('/repositorio')}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: '#005C6B' }}
          >
            <BookOpen className="w-4 h-4" />
            Ver repositorio de experiencias
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: '#005C6B' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
