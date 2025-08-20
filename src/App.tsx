
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Layout } from "./components/Layout";
import Inicio from "./pages/Inicio";
import Etapa1 from "./pages/Etapa1";
import Acelerador1 from "./pages/etapa1/Acelerador1";
import Acelerador2 from "./pages/etapa1/Acelerador2";
import Acelerador3 from "./pages/etapa1/Acelerador3";
import Etapa2 from "./pages/Etapa2";
import Acelerador4 from "./pages/etapa2/Acelerador4";
import Acelerador5 from "./pages/etapa2/Acelerador5";
import Etapa3 from "./pages/Etapa3";
import Acelerador6 from "./pages/etapa3/Acelerador6";
import SessionEditor from "./pages/etapa3/components/a6/SessionEditor";
import Documentos from "./pages/Documentos";
import Ayuda from "./pages/Ayuda";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PublicSurvey from "./pages/PublicSurvey";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public survey route - NO AUTH REQUIRED */}
            <Route path="/encuesta/:token" element={<PublicSurvey />} />
            
            {/* Protected routes - AUTH REQUIRED */}
            <Route path="/*" element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/etapa1" element={<Etapa1 />} />
                    <Route path="/etapa1/acelerador1" element={<Acelerador1 />} />
                    <Route path="/etapa1/acelerador2" element={<Acelerador2 />} />
                    <Route path="/etapa1/acelerador3" element={<Acelerador3 />} />
                    <Route path="/etapa2" element={<Etapa2 />} />
                    <Route path="/etapa2/acelerador4" element={<Acelerador4 />} />
                    <Route path="/etapa2/acelerador5" element={<Acelerador5 />} />
                    <Route path="/etapa3" element={<Etapa3 />} />
                    <Route path="/etapa3/acelerador6" element={<Acelerador6 />} />
                    <Route path="/etapa3/acelerador6/:sessionId" element={<Acelerador6 />} />
                    <Route path="/etapa3/sesion/:sessionId/editar" element={<SessionEditor />} />
                    <Route path="/documentos" element={<Documentos />} />
                    <Route path="/ayuda" element={<Ayuda />} />
                    <Route path="/administracion" element={<Admin />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
