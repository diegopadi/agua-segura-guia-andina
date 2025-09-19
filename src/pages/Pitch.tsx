import { usePitchMetrics } from '@/hooks/usePitchMetrics';
import { Card } from '@/components/ui/card';
import { CheckCircle, BookOpen, Users, FileText, Clock, Building2 } from 'lucide-react';

export default function Pitch() {
  const { metrics, loading } = usePitchMetrics();

  const MetricCard = ({ icon: Icon, value, label }: { icon: any, value: number | string, label: string }) => (
    <div className="flex items-center gap-3 bg-card/50 rounded-lg p-4 border border-border/50">
      <Icon className="h-6 w-6 text-accent" />
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  const StageCard = ({ stage, title, duration, items, icon }: { 
    stage: string, 
    title: string, 
    duration: string, 
    items: string[], 
    icon: string 
  }) => (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 border border-border/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{stage}: {title}</h3>
          <p className="text-sm text-accent font-medium">({duration})</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  const ResultCard = ({ title, author, institution, sessions }: { 
    title: string, 
    author: string, 
    institution: string, 
    sessions: string 
  }) => (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50">
      <div className="flex items-start gap-3">
        <BookOpen className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">"{title}"</h4>
          <p className="text-sm text-muted-foreground mb-2">{author}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{institution}</span>
            <span className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">
              {sessions}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted overflow-hidden">
      <div className="container mx-auto p-8 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold">
              <span className="water-text-gradient">DOCENTES.IA</span>
              <span className="text-muted-foreground ml-4">- ABANCAY</span>
            </h1>
            <p className="text-2xl text-foreground font-medium max-w-4xl mx-auto">
              "De 50 horas a 3 horas: Crea unidades didácticas completas con IA"
            </p>
          </div>

          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            <MetricCard 
              icon={Users} 
              value={metrics.activeUsers} 
              label="docentes participantes" 
            />
            <MetricCard 
              icon={CheckCircle} 
              value={metrics.completedUnits} 
              label="unidades completadas" 
            />
            <MetricCard 
              icon={FileText} 
              value={metrics.generatedSessions} 
              label="sesiones generadas" 
            />
            <MetricCard 
              icon={Clock} 
              value={metrics.initiatedProcesses} 
              label="procesos iniciados" 
            />
            <MetricCard 
              icon={Clock} 
              value={`${metrics.timeSavingsPercentage}%`} 
              label="ahorro de tiempo" 
            />
            <MetricCard 
              icon={Building2} 
              value={`${metrics.institutions}+`} 
              label="instituciones educativas" 
            />
          </div>
        </div>

        {/* Journey Visual */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            PROCESO COMPLETO EN 3 ETAPAS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <StageCard
              stage="ETAPA 1"
              title="DIAGNÓSTICO"
              duration="2 horas"
              icon="📊"
              items={[
                "A1: Carga PEI + IA análisis → Fortalezas y oportunidades detectadas",
                "A2: Encuesta estudiantes → Perfil de grupo objetivo",
                "A3: Capacidades docentes → 5 prioridades pedagógicas"
              ]}
            />
            
            <StageCard
              stage="ETAPA 2"
              title="DISEÑO"
              duration="1 hora"
              icon="📚"
              items={[
                "A4: Selección estrategias EEPE → Metodologías contextualizadas",
                "A5: Generación unidad IA → 4-6 sesiones + materiales"
              ]}
            />
            
            <StageCard
              stage="ETAPA 3"
              title="IMPLEMENTACIÓN"
              duration="45 min"
              icon="🎓"
              items={[
                "A6: Validación coherencia → Alineación CNEB automática",
                "A7: Sesiones finales → Planificaciones completas",
                "A8: Exportación profesional → PDFs descargables"
              ]}
            />
          </div>
        </div>

        {/* Results Showcase */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-foreground">
            UNIDADES CREADAS POR DOCENTES DE ABANCAY
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              title="El agua segura en mi cole"
              author="Eva Roxana Flores"
              institution="I.E. Nuestra Señora de las Mercedes"
              sessions="4 sesiones generadas"
            />
            
            <ResultCard
              title="Gestión hídrica institucional"
              author="Obdulia Prada"
              institution="I.E. La Victoria"
              sessions="3 sesiones estructuradas"
            />
            
            <ResultCard
              title="Matemáticas del agua"
              author="Pablo"
              institution="Área transversal"
              sessions="6 sesiones completas"
            />
            
            <ResultCard
              title="Cuidado del recurso hídrico"
              author="Drabeth"
              institution="Unidad más completa del sistema"
              sessions="6 sesiones"
            />
          </div>
        </div>

      </div>
    </div>
  );
}