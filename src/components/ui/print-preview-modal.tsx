import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RubricaStructure {
  levels: string[];
  criteria: Array<{
    criterio: string;
    descripcion?: string;
    descriptores: Record<string, string>;
  }>;
}

interface PrintPreviewModalProps {
  rubrica: RubricaStructure;
  unidadTitulo?: string;
}

export function PrintPreviewModal({ rubrica, unidadTitulo }: PrintPreviewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Previsualizar/Imprimir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Vista Previa de Rúbrica</DialogTitle>
          <Button onClick={handlePrint} className="w-fit">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogHeader>
        
        <div className="print-content space-y-6 print:text-black">
          {/* Header */}
          <div className="text-center border-b pb-4 print:border-black">
            <h1 className="text-xl font-bold mb-2">Rúbrica de Evaluación</h1>
            {unidadTitulo && (
              <h2 className="text-lg text-muted-foreground print:text-gray-600">{unidadTitulo}</h2>
            )}
          </div>

          {/* Rubrica Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border print:border-black">
              <thead>
                <tr className="bg-muted/50 print:bg-gray-100">
                  <th className="border border-border print:border-black p-3 text-left font-semibold">
                    Criterios de Evaluación
                  </th>
                  {rubrica.levels.map((level) => (
                    <th key={level} className="border border-border print:border-black p-3 text-center font-semibold">
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rubrica.criteria.map((criterion, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-background print:bg-white' : 'bg-muted/20 print:bg-gray-50'}>
                    <td className="border border-border print:border-black p-3 font-medium align-top">
                      <div className="space-y-2">
                        <div className="font-semibold">{criterion.criterio}</div>
                        {criterion.descripcion && (
                          <div className="text-sm text-muted-foreground print:text-gray-600">
                            {criterion.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    {rubrica.levels.map((level) => (
                      <td key={level} className="border border-border print:border-black p-3 text-sm align-top">
                        {criterion.descriptores[level]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground print:text-gray-600 border-t pt-4 print:border-black">
            <p>Generado el {new Date().toLocaleDateString('es-PE', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}