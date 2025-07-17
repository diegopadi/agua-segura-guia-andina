
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Waves, User } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <Waves className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold water-text-gradient">
                    Mi Cole con Agua Segura
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('es-PE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Perfil Docente
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
