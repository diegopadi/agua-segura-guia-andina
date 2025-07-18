import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface PEIUploaderProps {
  session: any
  onNext: (data: any) => void
  onPrev: () => void
}

const PEIUploader = ({ session, onNext, onPrev }: PEIUploaderProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(session.session_data?.pei_file || null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF, Word (.doc, .docx)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede superar los 10MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const fileName = `${user?.id}/pei_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user_uploads')
        .getPublicUrl(fileName)

      const fileData = {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString()
      }

      // Save file record to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user?.id,
          url: urlData.publicUrl,
          file_type: 'pei_document',
          size_bytes: file.size
        })

      if (dbError) throw dbError

      setUploadedFile(fileData)
      setUploadProgress(100)

      toast({
        title: "Éxito",
        description: "PEI subido correctamente"
      })

    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNext = () => {
    if (!uploadedFile) {
      toast({
        title: "Archivo requerido",
        description: "Debes subir tu PEI para continuar",
        variant: "destructive"
      })
      return
    }

    onNext({ pei_file: uploadedFile })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Paso 2: Sube tu Proyecto Educativo Institucional (PEI)
        </CardTitle>
        <CardDescription>
          Necesitamos tu PEI para realizar el análisis del contexto pedagógico de tu institución.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="space-y-4">
          {!uploadedFile ? (
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Subir archivo PEI</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Haz clic aquí o arrastra tu archivo del PEI
              </p>
              <p className="text-xs text-muted-foreground">
                Archivos PDF, Word (.doc, .docx), máximo 10MB
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{uploadedFile.name}</p>
                    <p className="text-sm text-green-700">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Subido correctamente
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-green-700 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm">Subiendo archivo...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Información importante</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El PEI será analizado automáticamente con IA para identificar oportunidades de integración</li>
                <li>• La información extraída se usará para personalizar las siguientes preguntas</li>
                <li>• Tus datos están protegidos y solo tú tienes acceso a este análisis</li>
                <li>• El archivo debe estar en formato PDF o Word (.doc, .docx) y no superar los 10MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {uploadedFile && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">PEI subido correctamente</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Ya puedes continuar al siguiente paso para responder las preguntas orientadoras.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={!uploadedFile || uploading}>
            {uploadedFile ? "Continuar al formulario" : "Subir PEI primero"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PEIUploader