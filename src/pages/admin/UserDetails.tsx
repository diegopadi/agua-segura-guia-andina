import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  MapPin, 
  Phone,
  Mail,
  School,
  User,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserDetailsProps {
  user: {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    ie_name: string | null;
    ie_district: string | null;
    ie_province: string | null;
    ie_region: string | null;
    phone: string | null;
    area_docencia: string | null;
    created_at: string;
    accelerator_progress: {
      accelerator1: number;
      accelerator2: number;
      accelerator3: number;
    };
    total_files: number;
  };
  onBack: () => void;
  onRefresh: () => void;
}

interface DetailedUserData {
  sessions: Array<{
    id: string;
    acelerador_number: number;
    status: string;
    current_step: number;
    created_at: string;
    updated_at: string;
  }>;
  files: Array<{
    id: string;
    url: string;
    file_type: string;
    size_bytes: number;
    created_at: string;
  }>;
  responses: Array<{
    id: string;
    question_number: number;
    response_text: string;
    response_data: any;
    created_at: string;
  }>;
}

export const UserDetails = ({ user, onBack, onRefresh }: UserDetailsProps) => {
  const [detailedData, setDetailedData] = useState<DetailedUserData>({
    sessions: [],
    files: [],
    responses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailedData();
  }, [user.user_id]);

  const fetchDetailedData = async () => {
    try {
      // Get accelerator sessions
      const { data: sessions } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      // Get files
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      // Get form responses
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: responses } = sessionIds.length > 0 ? await supabase
        .from('form_responses')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false }) : { data: [] };

      setDetailedData({
        sessions: sessions || [],
        files: files || [],
        responses: responses || []
      });
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadUserReport = async () => {
    try {
      // Generate HTML report
      const htmlContent = generateUserReportHTML(user, detailedData);
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${user.full_name?.replace(/\s+/g, '-') || 'usuario'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Reporte descargado",
        description: "El reporte completo del usuario ha sido descargado",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el reporte",
        variant: "destructive",
      });
    }
  };

  const generateUserReportHTML = (user: any, data: DetailedUserData) => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Usuario - ${user.full_name || 'Usuario'}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .progress-bar { width: 100%; height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; background-color: #10b981; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-success { background-color: #dcfce7; color: #166534; }
            .badge-warning { background-color: #fef3c7; color: #92400e; }
            .badge-info { background-color: #dbeafe; color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; }
            @media print { body { margin: 20px; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Reporte de Usuario - ${user.full_name || 'Sin nombre'}</h1>
            <p>Generado el: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <div class="card">
                <h2>Información Personal</h2>
                <p><strong>Nombre:</strong> ${user.full_name || 'No especificado'}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Teléfono:</strong> ${user.phone || 'No especificado'}</p>
                <p><strong>Área de Docencia:</strong> ${user.area_docencia || 'No especificado'}</p>
                <p><strong>Fecha de Registro:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            </div>

            <div class="card">
                <h2>Institución Educativa</h2>
                <p><strong>Nombre:</strong> ${user.ie_name || 'No especificado'}</p>
                <p><strong>Distrito:</strong> ${user.ie_district || 'No especificado'}</p>
                <p><strong>Provincia:</strong> ${user.ie_province || 'No especificado'}</p>
                <p><strong>Región:</strong> ${user.ie_region || 'No especificado'}</p>
            </div>

            <div class="card">
                <h2>Progreso de Aceleradores</h2>
                <div style="margin-bottom: 15px;">
                    <p><strong>Acelerador 1:</strong> ${user.accelerator_progress.accelerator1}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${user.accelerator_progress.accelerator1}%"></div>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <p><strong>Acelerador 2:</strong> ${user.accelerator_progress.accelerator2}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${user.accelerator_progress.accelerator2}%"></div>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <p><strong>Acelerador 3:</strong> ${user.accelerator_progress.accelerator3}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${user.accelerator_progress.accelerator3}%"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Sesiones de Aceleradores (${data.sessions.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Acelerador</th>
                            <th>Estado</th>
                            <th>Paso Actual</th>
                            <th>Fecha Inicio</th>
                            <th>Última Actualización</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.sessions.map(session => `
                            <tr>
                                <td>Acelerador ${session.acelerador_number}</td>
                                <td><span class="badge ${session.status === 'completed' ? 'badge-success' : 'badge-warning'}">${session.status}</span></td>
                                <td>${session.current_step}/6</td>
                                <td>${new Date(session.created_at).toLocaleDateString()}</td>
                                <td>${new Date(session.updated_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>Archivos Subidos (${data.files.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Tamaño</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.files.map(file => `
                            <tr>
                                <td>${file.file_type}</td>
                                <td>${(file.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                                <td>${new Date(file.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>Respuestas de Formularios (${data.responses.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Pregunta #</th>
                            <th>Respuesta</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.responses.map(response => `
                            <tr>
                                <td>${response.question_number}</td>
                                <td>${response.response_text || JSON.stringify(response.response_data)}</td>
                                <td>${new Date(response.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando detalles del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name || 'Usuario sin nombre'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        <Button onClick={downloadUserReport}>
          <Download className="w-4 h-4 mr-2" />
          Descargar Reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                {user.area_docencia && (
                  <div className="flex items-center gap-2 text-sm">
                    <School className="w-4 h-4 text-muted-foreground" />
                    <span>{user.area_docencia}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Institución Educativa
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Nombre:</strong> {user.ie_name || 'No especificado'}</p>
                  <p><strong>Distrito:</strong> {user.ie_district || 'No especificado'}</p>
                  <p><strong>Provincia:</strong> {user.ie_province || 'No especificado'}</p>
                  <p><strong>Región:</strong> {user.ie_region || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Resumen de Progreso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Acelerador 1</span>
                  <span className="text-sm font-medium">{user.accelerator_progress.accelerator1}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${user.accelerator_progress.accelerator1}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Acelerador 2</span>
                  <span className="text-sm font-medium">{user.accelerator_progress.accelerator2}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${user.accelerator_progress.accelerator2}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Acelerador 3</span>
                  <span className="text-sm font-medium">{user.accelerator_progress.accelerator3}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${user.accelerator_progress.accelerator3}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Sesiones de Aceleradores ({detailedData.sessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedData.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Acelerador {session.acelerador_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          Paso {session.current_step} de 6
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Iniciado: {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(session.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Actualizado: {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {detailedData.sessions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay sesiones de aceleradores registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Archivos Subidos ({detailedData.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detailedData.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.file_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size_bytes)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {detailedData.files.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay archivos subidos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Respuestas de Formularios ({detailedData.responses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detailedData.responses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pregunta #{response.question_number}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {response.response_text || JSON.stringify(response.response_data)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(response.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {detailedData.responses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay respuestas de formularios registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};