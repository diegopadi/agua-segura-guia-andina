import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Filter, Download, Trash2, Tag, Eye, AlertCircle, Info, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  fechaCarga: string;
  etapa?: string;
  acelerador?: string;
  descripcion?: string;
}

export default function Repositorio() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: "1",
      nombre: "Informe_Agua_Segura_2024.pdf",
      tipo: "Informe",
      fechaCarga: "15/10/2024",
      etapa: "Diagnóstico",
      acelerador: "Validación",
      descripcion: "Informe validado del programa Agua Segura"
    },
    {
      id: "2",
      nombre: "Diagnostico_Inicial.pdf",
      tipo: "Diagnóstico",
      fechaCarga: "20/10/2024",
      etapa: "Diagnóstico",
      descripcion: "Diagnóstico inicial de la institución"
    }
  ]);
  
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todos");
  const [documentoClasificar, setDocumentoClasificar] = useState<Documento | null>(null);
  const [clasificacionData, setClasificacionData] = useState({
    etapa: "",
    acelerador: "",
    descripcion: ""
  });
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const subirArchivo = () => {
    const nuevoDoc: Documento = {
      id: Date.now().toString(),
      nombre: `Documento_${Date.now()}.pdf`,
      tipo: "Otro",
      fechaCarga: new Date().toLocaleDateString('es-PE')
    };
    setDocumentos([...documentos, nuevoDoc]);
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos(documentos.filter(doc => doc.id !== id));
  };

  const abrirClasificacion = (doc: Documento) => {
    setDocumentoClasificar(doc);
    setClasificacionData({
      etapa: doc.etapa || "",
      acelerador: doc.acelerador || "",
      descripcion: doc.descripcion || ""
    });
  };

  const guardarClasificacion = () => {
    if (documentoClasificar) {
      setDocumentos(documentos.map(doc => 
        doc.id === documentoClasificar.id 
          ? { ...doc, ...clasificacionData }
          : doc
      ));
      setDocumentoClasificar(null);
      setClasificacionData({ etapa: "", acelerador: "", descripcion: "" });
    }
  };

  const exportarCSV = () => {
    const headers = ["Nombre", "Tipo", "Fecha de Carga", "Etapa", "Acelerador", "Descripción"];
    const rows = documentosFiltrados.map(doc => [
      doc.nombre,
      doc.tipo,
      doc.fechaCarga,
      doc.etapa || "-",
      doc.acelerador || "-",
      doc.descripcion || "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "repositorio_documentos.csv";
    a.click();
  };

  const limpiarTabla = () => {
    if (confirm("¿Estás seguro de que deseas limpiar toda la tabla?")) {
      setDocumentos([]);
    }
  };

  const documentosFiltrados = documentos.filter(doc => {
    const cumpleTipo = filtroTipo === "todos" || doc.tipo === filtroTipo;
    const cumpleEtapa = filtroEtapa === "todos" || doc.etapa === filtroEtapa;
    return cumpleTipo && cumpleEtapa;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Repositorio de experiencias y evidencias
          </h1>
          <p className="text-lg mb-2" style={{ color: '#00A6A6' }}>
            Guarda y clasifica los documentos que respaldan el desarrollo de tu proyecto.
          </p>
          <p className="text-base max-w-3xl" style={{ color: '#1A1A1A' }}>
            Aquí puedes organizar tus informes, diagnósticos, sistematizaciones y otros archivos relevantes. 
            En el futuro, estos se conectarán automáticamente con tus aceleradores.
          </p>
        </div>

        {/* Zona de subida */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Upload className="w-5 h-5" />
              Subir archivo
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Tipos permitidos: .pdf, .doc, .docx
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={subirArchivo}
              className="text-white font-medium"
              style={{ backgroundColor: '#005C6B' }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir archivo
            </Button>
            <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
              <AlertCircle className="h-4 w-4" style={{ color: '#00A6A6' }} />
              <AlertDescription style={{ color: '#1A1A1A' }}>
                Los archivos subidos aquí se guardan solo en esta sesión (modo simulado).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Filter className="w-5 h-5" />
              Filtros y exportación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Label style={{ color: '#005C6B' }}>Tipo de documento</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger style={{ backgroundColor: '#E6F4F1' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                    <SelectItem value="Informe">Informe</SelectItem>
                    <SelectItem value="Evidencia">Evidencia</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label style={{ color: '#005C6B' }}>Etapa</Label>
                <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
                  <SelectTrigger style={{ backgroundColor: '#E6F4F1' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                    <SelectItem value="Aceleración">Aceleración</SelectItem>
                    <SelectItem value="Evaluación">Evaluación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportarCSV}
                className="font-medium"
                style={{ backgroundColor: '#00A6A6', color: 'white' }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar listado (CSV)
              </Button>
              <Button
                onClick={limpiarTabla}
                variant="outline"
                className="font-medium"
                style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar tabla
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de documentos */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-5 h-5" />
              Tus documentos registrados ({documentosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '2px solid #00A6A6' }}>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Nombre del archivo
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Tipo
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Fecha de carga
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Etapa
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Acelerador
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: '#005C6B' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documentosFiltrados.map((doc) => (
                    <tr 
                      key={doc.id}
                      className="border-b"
                      style={{ borderColor: '#E6F4F1' }}
                    >
                      <td className="p-3" style={{ color: '#1A1A1A' }}>
                        {doc.nombre}
                      </td>
                      <td className="p-3">
                        <span 
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#E6F4F1', color: '#005C6B' }}
                        >
                          {doc.tipo}
                        </span>
                      </td>
                      <td className="p-3" style={{ color: '#1A1A1A' }}>
                        {doc.fechaCarga}
                      </td>
                      <td className="p-3" style={{ color: '#1A1A1A' }}>
                        {doc.etapa || "-"}
                      </td>
                      <td className="p-3" style={{ color: '#1A1A1A' }}>
                        {doc.acelerador || "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => alert('Vista previa (simulado)')}
                          >
                            <Eye className="w-4 h-4" style={{ color: '#00A6A6' }} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => abrirClasificacion(doc)}
                          >
                            <Tag className="w-4 h-4" style={{ color: '#005C6B' }} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => eliminarDocumento(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#005C6B' }} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documentosFiltrados.length === 0 && (
                <div className="text-center py-8" style={{ color: '#1A1A1A', opacity: 0.5 }}>
                  No hay documentos que coincidan con los filtros seleccionados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bloque de ayuda contextual */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Info className="w-5 h-5" />
              Ayuda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm" style={{ color: '#1A1A1A' }}>
              El repositorio es tu espacio transversal de almacenamiento. 
              Desde aquí puedes enlazar tus documentos con los pasos de diagnóstico, validación o sistematización.
            </p>
            <Dialog open={mostrarAyuda} onOpenChange={setMostrarAyuda}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="font-medium"
                  style={{ backgroundColor: '#E6F4F1', color: '#005C6B' }}
                >
                  Ver ejemplo de cómo clasificar evidencias
                </Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: '#DDF4F2' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#005C6B' }}>
                    Cómo clasificar tus evidencias
                  </DialogTitle>
                  <DialogDescription style={{ color: '#1A1A1A' }}>
                    Ejemplo de clasificación de documentos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#E6F4F1' }}>
                    <h4 className="font-semibold mb-2" style={{ color: '#005C6B' }}>
                      1. Selecciona la etapa
                    </h4>
                    <p className="text-sm" style={{ color: '#1A1A1A' }}>
                      Asocia el documento con Diagnóstico, Aceleración o Evaluación según su propósito.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#E6F4F1' }}>
                    <h4 className="font-semibold mb-2" style={{ color: '#005C6B' }}>
                      2. Elige el acelerador
                    </h4>
                    <p className="text-sm" style={{ color: '#1A1A1A' }}>
                      Vincula con Validación, Sistematización o Entregables para organizar mejor tus recursos.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#E6F4F1' }}>
                    <h4 className="font-semibold mb-2" style={{ color: '#005C6B' }}>
                      3. Añade una descripción
                    </h4>
                    <p className="text-sm" style={{ color: '#1A1A1A' }}>
                      Agrega etiquetas o notas breves para identificar rápidamente el contenido.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => navigate('/proyectos')}
              variant="outline"
              className="font-medium"
              style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al menú CNPIE
            </Button>
            <Button
              onClick={() => navigate('/proyectos/generacion')}
              variant="outline"
              className="font-medium"
              style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
            >
              Ir a Generación de Proyecto
            </Button>
            <Button
              onClick={() => navigate('/proyectos/2a')}
              variant="outline"
              className="font-medium"
              style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
            >
              Ir a Proyecto 2A
            </Button>
            <Button
              onClick={() => navigate('/proyectos/2b')}
              variant="outline"
              className="font-medium"
              style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
            >
              Ir a Proyecto 2B
            </Button>
            <Button
              onClick={() => navigate('/proyectos/2c')}
              variant="outline"
              className="font-medium"
              style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
            >
              Ir a Proyecto 2C
            </Button>
          </div>
        </div>

        {/* Modal de clasificación */}
        <Dialog open={!!documentoClasificar} onOpenChange={(open) => !open && setDocumentoClasificar(null)}>
          <DialogContent style={{ backgroundColor: '#DDF4F2' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#005C6B' }}>
                Clasificar documento
              </DialogTitle>
              <DialogDescription style={{ color: '#1A1A1A' }}>
                {documentoClasificar?.nombre}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label style={{ color: '#005C6B' }}>Etapa</Label>
                <Select 
                  value={clasificacionData.etapa} 
                  onValueChange={(value) => setClasificacionData({...clasificacionData, etapa: value})}
                >
                  <SelectTrigger style={{ backgroundColor: '#E6F4F1' }}>
                    <SelectValue placeholder="Selecciona una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                    <SelectItem value="Aceleración">Aceleración</SelectItem>
                    <SelectItem value="Evaluación">Evaluación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: '#005C6B' }}>Acelerador</Label>
                <Select 
                  value={clasificacionData.acelerador} 
                  onValueChange={(value) => setClasificacionData({...clasificacionData, acelerador: value})}
                >
                  <SelectTrigger style={{ backgroundColor: '#E6F4F1' }}>
                    <SelectValue placeholder="Selecciona un acelerador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Validación">Validación</SelectItem>
                    <SelectItem value="Sistematización">Sistematización</SelectItem>
                    <SelectItem value="Entregables">Entregables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: '#005C6B' }}>Descripción breve</Label>
                <Input 
                  value={clasificacionData.descripcion}
                  onChange={(e) => setClasificacionData({...clasificacionData, descripcion: e.target.value})}
                  placeholder="Agrega etiquetas o notas..."
                  style={{ backgroundColor: '#E6F4F1' }}
                />
              </div>
              <Button
                onClick={guardarClasificacion}
                className="w-full text-white font-medium"
                style={{ backgroundColor: '#005C6B' }}
              >
                Guardar clasificación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
