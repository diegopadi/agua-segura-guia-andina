import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WaterLogo } from "@/components/WaterLogo";
import {
  Globe,
  Clock,
  Sparkles,
  Award,
  Code,
  FileCode,
  Palette,
  Database,
  Github,
  Terminal,
  Scale,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Droplets,
  Users,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
const CodigoAbierto = () => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    const commands = `git clone https://github.com/diegopadi/agua-segura-guia-andina
bun install
bun run dev`;
    try {
      await navigator.clipboard.writeText(commands);
      setCopied(true);
      toast.success("Comandos copiados al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };
  const techStack = [
    {
      name: "React + Vite",
      icon: Code,
      description: "UI moderna y rápida",
    },
    {
      name: "TypeScript",
      icon: FileCode,
      description: "Tipado estático",
    },
    {
      name: "Tailwind + shadcn/ui",
      icon: Palette,
      description: "Diseño consistente",
    },
    {
      name: "Supabase",
      icon: Database,
      description: "PostgreSQL + Auth",
    },
  ];
  const roadmapItems = [
    {
      title: "Automatización Pedagógica",
      status: "completed",
      description: "Aceleradores IA para planificación docente",
    },
    {
      title: "Integración CNPIE",
      status: "completed",
      description: "Postulación al Concurso Nacional 2026",
    },
  ];
  const categories = [
    "Proyectos Consolidados",
    "Proyectos En Proceso",
    "Proyectos Promisorios",
    "Investigación-Acción",
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header Navigation */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <WaterLogo size={32} />
            <span className="font-semibold text-lg">Agua Segura</span>
          </a>
          <Button asChild variant="outline" size="sm">
            <a href="/" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Volver al inicio
            </a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 md:p-12 text-primary-foreground"
          role="region"
          aria-labelledby="hero-title"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-10 w-10" aria-hidden="true" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Bien Público Digital
              </Badge>
            </div>

            <h1 id="hero-title" className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Soberanía Tecnológica y Transparencia: Agua Segura para la Región Andina
            </h1>

            <p className="text-lg md:text-xl opacity-90 leading-relaxed max-w-3xl">
              Anunciamos la apertura del código fuente de nuestra plataforma, transformándola en un
              <strong> bien público digital</strong>. Esta iniciativa busca que gobiernos y entidades técnicas puedan{" "}
              <strong>auditar, adaptar y escalar</strong> soluciones para la salud hídrica y la innovación pedagógica.
            </p>
          </div>
        </section>

        {/* Validation Card - Docentes.ia Impact */}
        <section role="region" aria-labelledby="validation-title">
          <Card className="border-2 border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-secondary/20">
                  <Sparkles className="h-6 w-6 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle id="validation-title" className="text-xl">
                    Optimización del Tiempo Docente
                  </CardTitle>
                  <CardDescription>Impacto medido del programa Docentes.ia</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-3xl font-bold text-primary">65h → 10h</p>
                      <p className="text-sm text-muted-foreground">Reducción en tiempo de planificación</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-2 bg-secondary text-secondary-foreground">Ahorro del 90%</Badge>
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    El uso de nuestros <strong>Aceleradores IA</strong> permite reducir la carga operativa de
                    planificación pedagógica significativamente.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary" aria-hidden="true" />
                      Sistematización de Unidades de Aprendizaje
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary" aria-hidden="true" />
                      Sesiones Pedagógicas validadas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary" aria-hidden="true" />
                      Rúbricas de evaluación automatizadas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CNPIE 2026 Section */}
        <section role="region" aria-labelledby="cnpie-title">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle id="cnpie-title" className="text-xl">
                    Apoyo al CNPIE 2026
                  </CardTitle>
                  <CardDescription>
                    Concurso Nacional de Proyectos de Innovación Educativa - VIII Edición
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Facilitamos la postulación docente alineando la tecnología con los estándares del
                <strong> Fondo Nacional de Desarrollo de la Educación Peruana (FONDEP)</strong>.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" aria-hidden="true" />
                    <p className="text-sm font-medium">{category}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tech Stack Grid */}
        <section role="region" aria-labelledby="tech-title">
          <h2 id="tech-title" className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" aria-hidden="true" />
            Stack Tecnológico
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <tech.icon className="h-10 w-10 mx-auto mb-3 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold mb-1">{tech.name}</h3>
                  <p className="text-sm text-muted-foreground">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Start Terminal */}
        <section role="region" aria-labelledby="quickstart-title">
          <Card className="bg-slate-900 text-slate-100 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-green-400" aria-hidden="true" />
                  <CardTitle id="quickstart-title" className="text-slate-100">
                    Quick Start
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                  aria-label="Copiar comandos al portapapeles"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="font-mono text-sm space-y-1 overflow-x-auto">
                <code className="block">
                  <span className="text-green-400">$</span> git clone
                  https://github.com/diegopadi/agua-segura-guia-andina
                </code>
                <code className="block">
                  <span className="text-green-400">$</span> bun install
                </code>
                <code className="block">
                  <span className="text-green-400">$</span> bun run dev
                </code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* License Section */}
        <section role="region" aria-labelledby="license-title">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
                <div>
                  <CardTitle id="license-title">Licencia MIT</CardTitle>
                  <CardDescription>Libre adopción para el sector público</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Este proyecto utiliza la <strong>Licencia MIT</strong>, lo que permite a
                <strong> Gobiernos Regionales</strong>, entidades educativas y organizaciones sin fines de lucro usar,
                modificar y distribuir el código libremente.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Uso comercial permitido</Badge>
                <Badge variant="outline">Modificación permitida</Badge>
                <Badge variant="outline">Distribución permitida</Badge>
                <Badge variant="outline">Uso privado permitido</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Roadmap Timeline */}
        <section role="region" aria-labelledby="roadmap-title">
          <h2 id="roadmap-title" className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
            Roadmap del Proyecto
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-muted hidden md:block" aria-hidden="true" />

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {roadmapItems.map((item, index) => (
                <Card
                  key={index}
                  className={`relative ${item.status === "completed" ? "border-secondary" : item.status === "in-progress" ? "border-primary ring-2 ring-primary/20" : "border-muted"}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${item.status === "completed" ? "bg-secondary text-secondary-foreground" : item.status === "in-progress" ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle className="h-5 w-5" aria-hidden="true" />
                        ) : item.status === "in-progress" ? (
                          <Droplets className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        )}
                      </div>
                      <Badge
                        variant={
                          item.status === "completed"
                            ? "default"
                            : item.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                        className={item.status === "completed" ? "bg-secondary" : ""}
                      >
                        {item.status === "completed"
                          ? "Completado"
                          : item.status === "in-progress"
                            ? "En curso"
                            : "Planificado"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Main CTA */}
        <section
          className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted"
          role="region"
          aria-labelledby="cta-title"
        >
          <Users className="h-12 w-12 mx-auto mb-4 text-primary" aria-hidden="true" />
          <h2 id="cta-title" className="text-2xl font-bold mb-4">
            Únete a la comunidad
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explora el código, reporta issues, contribuye con mejoras o adapta la plataforma para tu región. Juntos
            construimos soberanía tecnológica.
          </p>

          <Button asChild size="lg" className="text-lg px-8">
            <a
              href="https://github.com/diegopadi/agua-segura-guia-andina"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Github className="h-5 w-5" aria-hidden="true" />
              Ver en GitHub
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 Mi Cole con Agua Segura ·
            <a
              href="https://github.com/diegopadi/agua-segura-guia-andina/blob/main/LICENSE_EN"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              Licencia MIT
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
export default CodigoAbierto;
