import { useState } from "react";
import {
  Home,
  BookOpen,
  FileText,
  HelpCircle,
  Droplets,
  ChevronRight,
  ChevronDown,
  Shield,
  BarChart3,
  FolderKanban,
  Database,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { WaterLogo } from "@/components/WaterLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
const mainItems = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Proyectos CNPIE 2025",
    url: "/proyectos",
    icon: FolderKanban,
  },
  {
    title: "Cambiar tipo 🔄",
    url: "/mini-cambio-proyecto",
    icon: RefreshCw,
  },
  {
    title: "Repositorio",
    url: "/repositorio",
    icon: Database,
  },
  {
    title: "Pitch",
    url: "/pitch",
    icon: BarChart3,
  },
  {
    title: "Documentos",
    url: "/documentos",
    icon: FileText,
  },
];

const etapasItems = [
  {
    title: "Etapa 1",
    url: "/etapa1",
    icon: Droplets,
  },
  {
    title: "Etapa 2",
    url: "/etapa2",
    icon: Droplets,
  },
  {
    title: "Etapa 3",
    url: "/etapa3",
    icon: Droplets,
  },
];

const footerItems = [
  {
    title: "Ayuda",
    url: "/ayuda",
    icon: HelpCircle,
  },
  {
    title: "Administración",
    url: "/administracion",
    icon: Shield,
  },
];
export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [docentesExpanded, setDocentesExpanded] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const isEtapaActive = etapasItems.some((item) => isActive(item.url));

  // Función para verificar si una ruta o sus hijas están activas
  const isPathOrChildActive = (path: string) => {
    if (path === "/proyectos") {
      return currentPath === path || currentPath.startsWith("/proyectos/");
    }
    return currentPath === path;
  };
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {state === "expanded" && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                Mi Cole
              </h1>
              <p className="text-sm text-sidebar-foreground/70">
                con Agua Segura
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Inicio - First item */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                      }`
                    }
                  >
                    <Home className="w-4 h-4" />
                    {state === "expanded" && <span>Inicio</span>}
                    {state === "expanded" && isActive("/") && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Docentes.IA - Collapsible group */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setDocentesExpanded(!docentesExpanded)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isEtapaActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "hover:bg-sidebar-accent/50 text-white"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                  {state === "expanded" && (
                    <span className="font-medium text-white">Docentes.IA</span>
                  )}
                  {state === "expanded" &&
                    (docentesExpanded ? (
                      <ChevronDown className="w-4 h-4 ml-auto transition-transform text-white" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto transition-transform text-white" />
                    ))}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Etapas sub-items */}
              {docentesExpanded && state === "expanded" && (
                <div className="ml-6 space-y-1 animate-fade-in">
                  {etapasItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="w-3 h-3" />
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}

              {/* Main items (excluding Inicio) */}
              {mainItems
                .filter((item) => item.title !== "Inicio")
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => {
                          const active =
                            item.url === "/proyectos"
                              ? isPathOrChildActive(item.url)
                              : isActive;
                          return `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                          }`;
                        }}
                      >
                        <item.icon className="w-4 h-4" />
                        {state === "expanded" && <span>{item.title}</span>}
                        {state === "expanded" &&
                          isPathOrChildActive(item.url) && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                      {state === "expanded" && isActive(item.url) && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
