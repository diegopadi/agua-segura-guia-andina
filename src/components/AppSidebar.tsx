import { useState } from "react";
import { Home, BookOpen, FileText, HelpCircle, Droplets, ChevronRight, Shield, BarChart3, FolderKanban, Database, RefreshCw } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { WaterLogo } from "@/components/WaterLogo";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
const mainItems = [{
  title: "Inicio",
  url: "/",
  icon: Home
}, {
  title: "Proyectos CNPIE 2025",
  url: "/proyectos",
  icon: FolderKanban
}, {
  title: "Pitch",
  url: "/pitch",
  icon: BarChart3
}, {
  title: "Repositorio",
  url: "/repositorio",
  icon: Database
}, {
  title: "Cambiar tipo 🔄",
  url: "/mini-cambio-proyecto",
  icon: RefreshCw
}, {
  title: "Etapa 1",
  url: "/etapa1",
  icon: Droplets
}, {
  title: "Etapa 2",
  url: "/etapa2",
  icon: Droplets
}, {
  title: "Etapa 3",
  url: "/etapa3",
  icon: Droplets
}, {
  title: "Documentos",
  url: "/documentos",
  icon: FileText
}, {
  title: "Ayuda",
  url: "/ayuda",
  icon: HelpCircle
}, {
  title: "Administración",
  url: "/administracion",
  icon: Shield
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  return <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          
          {state === "expanded" && <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Mi Cole</h1>
              <p className="text-sm text-sidebar-foreground/70">con Agua Segura</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground"}`}>
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                      {state === "expanded" && isActive(item.url) && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}