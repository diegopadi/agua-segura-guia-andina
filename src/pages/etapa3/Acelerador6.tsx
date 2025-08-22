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
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfExtracting, setPdfExtracting] = useState(false);

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

    // File validation
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "El archivo PDF no puede exceder 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setPdfUploading(true);
      setPdfFile(file);

      // Generate unique file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `diagnosticos/${fileName}`;

      // Upload to diagnosticos-pdf bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnosticos-pdf')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('diagnosticos-pdf')
        .getPublicUrl(filePath);

      // Update form data with PDF URL
      handleInputChange('diagnostico_pdf_url', urlData.publicUrl);

      toast({
        title: "PDF subido exitosamente",
        description: "Extrayendo texto automáticamente...",
      });

      // Start text extraction
      setPdfExtracting(true);

      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-diagnostico-text', {
        body: { file_path: filePath }
      });

      if (extractError) {
        console.error('Extract error:', extractError);
        throw new Error(`Error extrayendo texto: ${extractError.message}`);
      }

      if (extractData.success && extractData.text) {
        const extractedText = extractData.text.trim();
        
        if (extractedText.length > 100) {
          handleInputChange('diagnostico_text', extractedText);
          toast({
            title: "Texto extraído exitosamente",
            description: `Se extrajeron ${extractedText.length} caracteres del PDF`,
          });
          
          // Telemetry event for successful extraction
          console.log('A6 PDF Text Extracted Successfully', {
            event: 'a6_pdf_text_extracted_ok',
            file_size: file.size,
            text_length: extractedText.length,
            timestamp: new Date().toISOString()
          });
        } else {
          toast({
            title: "Texto extraído parcialmente",
            description: "Se extrajo poco texto del PDF. Por favor, ingrese el texto manualmente.",
            variant: "destructive",
          });
          
          // Telemetry event for partial extraction
          console.log('A6 PDF Text Extraction Partial', {
            event: 'a6_pdf_text_extracted_partial',
            file_size: file.size,
            text_length: extractedText.length,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error(extractData.error || 'No se pudo extraer texto del PDF');
      }

      // Telemetry event for successful PDF upload
      console.log('A6 PDF Uploaded Successfully', {
        event: 'a6_pdf_uploaded',
        file_size: file.size,
        file_name: fileName,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('PDF upload/extract error:', error);
      
      // Telemetry event for failed extraction
      console.log('A6 PDF Processing Failed', {
        event: 'a6_pdf_text_extracted_fail',
        error: error.message,
        file_size: file?.size || 0,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Error procesando PDF",
        description: `${error.message}. Por favor, ingrese el texto manualmente.`,
        variant: "destructive",
      });

      // Reset file state on error but keep any uploaded URL
      setPdfFile(null);
    } finally {
      setPdfUploading(false);
      setPdfExtracting(false);
      
      // Reset file input
      const input = document.getElementById('pdf-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
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
                      disabled={isClosed || pdfUploading}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                      disabled={isClosed || pdfUploading}
                      className="w-full"
                    >
                      {pdfUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          {pdfExtracting ? "Extrayendo texto..." : "Subiendo PDF..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar PDF
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo 5MB. El texto se extraerá automáticamente.
                    </p>
                  </div>
                </div>
              )}

              {formData.diagnostico_pdf_url && (
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">PDF procesado exitosamente</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.diagnostico_pdf_url.split('/').pop()?.substring(0, 50)}...
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      handleInputChange('diagnostico_pdf_url', '');
                      handleInputChange('diagnostico_text', '');
                    }}
                    disabled={isClosed}
                  >
                    Eliminar
                  </Button>
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