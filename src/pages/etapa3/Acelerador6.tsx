import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Bot, CheckCircle, ArrowLeft, ArrowRight, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEtapa3V2 } from '@/hooks/useEtapa3V2';
import type { UnidadAprendizaje } from '@/hooks/useEtapa3V2';

const AREAS_CURRICULARES = [
  'Comunicación', 'Matemática', 'Ciencias Sociales', 'Ciencia y Tecnología',
  'Educación Física', 'Arte y Cultura', 'Inglés', 'Educación Religiosa',
  'Educación para el Trabajo', 'Tutoría'
];

const GRADOS = ['1ro', '2do', '3ro', '4to', '5to'];

export default function Acelerador6() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, loading, saving, saveUnidad, closeAccelerator, progress } = useEtapa3V2();
  
  const [formData, setFormData] = useState<Partial<UnidadAprendizaje>>({
    titulo: '',
    area_curricular: '',
    grado: '',
    numero_sesiones: 6,
    duracion_min: 45,
    proposito: '',
    competencias_ids: [],
    capacidades: [],
    evidencias: '',
    estandares: [],
    desempenos: [],
    diagnostico_text: '',
    ia_recomendaciones: ''
  });

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.titulo && formData.area_curricular && !saving) {
        handleAutoSave();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [formData, saving]);

  // Load existing data
  useEffect(() => {
    if (unidad) {
      setFormData(unidad);
      if (unidad.ia_recomendaciones) {
        setAnalysisComplete(true);
      }
    }
  }, [unidad]);

  const handleAutoSave = async () => {
    if (!isFormValid()) return;
    
    try {
      await saveUnidad(formData);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleInputChange = (field: keyof UnidadAprendizaje, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "El archivo PDF no puede exceder 5MB",
        variant: "destructive",
      });
      return;
    }

    setPdfFile(file);
    
    // TODO: Extract text from PDF and update diagnostico_text
    // For now, we'll just set the filename
    handleInputChange('diagnostico_pdf_url', file.name);
    
    toast({
      title: "PDF cargado",
      description: "Archivo PDF cargado correctamente. Ingrese el texto manualmente si es necesario.",
    });
  };

  const handleAnalyzeCoherence = async () => {
    if (!formData.diagnostico_text || !isFormValid()) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos y el texto del diagnóstico",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalysisLoading(true);

      const { data, error } = await supabase.functions.invoke('analyze-unit-coherence', {
        body: {
          unidad_data: formData,
          diagnostico_text: formData.diagnostico_text
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        handleInputChange('ia_recomendaciones', JSON.stringify(data.analysis, null, 2));
        setAnalysisComplete(true);
        
        toast({
          title: "Análisis completado",
          description: "El análisis de coherencia se ha generado exitosamente",
        });
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Error en el análisis",
        description: "No se pudo completar el análisis. Puede continuar editando manualmente.",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveUnidad(formData);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleClose = async () => {
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    await handleSave();
    await closeAccelerator('A6');
  };

  const isFormValid = () => {
    return !!(
      formData.titulo?.trim() &&
      formData.area_curricular &&
      formData.grado &&
      formData.proposito?.trim() &&
      formData.evidencias?.trim() &&
      formData.numero_sesiones &&
      formData.duracion_min
    );
  };

  const isClosed = unidad?.estado === 'CERRADO';
  const canProceedToA7 = progress.a6_completed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Acelerador 6...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/etapa3')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Etapa 3
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acelerador 6</h1>
              <p className="text-muted-foreground">Diseño de Unidad de Aprendizaje</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isClosed && (
              <Badge variant="default" className="gap-2">
                <Lock className="h-4 w-4" />
                Cerrado
              </Badge>
            )}
            <Button onClick={handleSave} disabled={saving || isClosed}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid gap-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título de la Unidad *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo || ''}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Ingrese el título de la unidad"
                    disabled={isClosed}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Área Curricular *</Label>
                  <Select
                    value={formData.area_curricular || ''}
                    onValueChange={(value) => handleInputChange('area_curricular', value)}
                    disabled={isClosed}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el área" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_CURRICULARES.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grado">Grado *</Label>
                  <Select
                    value={formData.grado || ''}
                    onValueChange={(value) => handleInputChange('grado', value)}
                    disabled={isClosed}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADOS.map(grado => (
                        <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sesiones">N° de Sesiones *</Label>
                  <Input
                    id="sesiones"
                    type="number"
                    min={1}
                    max={12}
                    value={formData.numero_sesiones || 6}
                    onChange={(e) => handleInputChange('numero_sesiones', parseInt(e.target.value))}
                    disabled={isClosed}
                  />
                </div>
                <div>
                  <Label htmlFor="duracion">Duración (minutos) *</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min={30}
                    max={120}
                    value={formData.duracion_min || 45}
                    onChange={(e) => handleInputChange('duracion_min', parseInt(e.target.value))}
                    disabled={isClosed}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="proposito">Propósito de la Unidad *</Label>
                <Textarea
                  id="proposito"
                  value={formData.proposito || ''}
                  onChange={(e) => handleInputChange('proposito', e.target.value)}
                  placeholder="Describa el propósito de esta unidad de aprendizaje"
                  className="min-h-[100px]"
                  disabled={isClosed}
                />
              </div>

              <div>
                <Label htmlFor="evidencias">Evidencias de Aprendizaje *</Label>
                <Textarea
                  id="evidencias"
                  value={formData.evidencias || ''}
                  onChange={(e) => handleInputChange('evidencias', e.target.value)}
                  placeholder="Describa las evidencias que demostrarán el aprendizaje de los estudiantes"
                  className="min-h-[80px]"
                  disabled={isClosed}
                />
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis Section */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico Pedagógico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.diagnostico_pdf_url && (
                <div>
                  <Label>Subir PDF de Diagnóstico (opcional)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                      disabled={isClosed}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                      disabled={isClosed}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar PDF
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo 5MB. Si el PDF no se puede leer, ingrese el texto manualmente.
                    </p>
                  </div>
                </div>
              )}

              {formData.diagnostico_pdf_url && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">PDF cargado: {formData.diagnostico_pdf_url}</p>
                </div>
              )}

              <div>
                <Label htmlFor="diagnostico">Texto del Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  value={formData.diagnostico_text || ''}
                  onChange={(e) => handleInputChange('diagnostico_text', e.target.value)}
                  placeholder="Pegue aquí el texto del diagnóstico pedagógico o escriba un resumen..."
                  className="min-h-[120px]"
                  disabled={isClosed}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Mínimo 300 caracteres para el análisis de IA
                </p>
              </div>

              {formData.diagnostico_text && formData.diagnostico_text.length >= 300 && !isClosed && (
                <Button 
                  onClick={handleAnalyzeCoherence}
                  disabled={analysisLoading || !isFormValid()}
                  className="w-full"
                >
                  {analysisLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analizando coherencia...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Analizar Coherencia con IA
                    </>
                  )}
                </Button>
              )}

              {analysisComplete && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Análisis de Coherencia Completado
                    </p>
                  </div>
                  
                  <div>
                    <Label>Recomendaciones de IA (editable)</Label>
                    <Textarea
                      value={formData.ia_recomendaciones || ''}
                      onChange={(e) => handleInputChange('ia_recomendaciones', e.target.value)}
                      className="min-h-[150px] mt-2"
                      disabled={isClosed}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/etapa3')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="flex gap-3">
              {!isClosed && (
                <Button 
                  onClick={handleClose}
                  disabled={!isFormValid() || saving}
                  variant="default"
                >
                  Guardar y Cerrar A6
                </Button>
              )}
              
              {canProceedToA7 && (
                <Button onClick={() => navigate('/etapa3/acelerador7')}>
                  Continuar a A7
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}