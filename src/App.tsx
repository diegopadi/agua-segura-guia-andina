
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
import Acelerador8 from "./pages/etapa3/Acelerador8";
import Acelerador9 from "./pages/etapa3/Acelerador9";
import Acelerador10 from "./pages/etapa3/Acelerador10";
import A8FinalViewer from "./pages/etapa3/A8FinalViewer";
import Documentos from "./pages/Documentos";
import Ayuda from "./pages/Ayuda";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PublicSurvey from "./pages/PublicSurvey";
import Pitch from "./pages/Pitch";
import Proyectos from "./pages/Proyectos";
import Generacion from "./pages/proyectos/Generacion";
import Manual from "./pages/proyectos/Manual";
import Proyecto2A from "./pages/proyectos/Proyecto2A";
import Proyecto2B from "./pages/proyectos/Proyecto2B";
import Proyecto2C from "./pages/proyectos/Proyecto2C";
import Repositorio from "./pages/Repositorio";
import MiniCambioProyecto from "./pages/MiniCambioProyecto";
import Etapa1Acelerador1 from "./pages/cnpie/2a/Etapa1Acelerador1";
import Etapa2Overview from "./pages/cnpie/2a/Etapa2Overview";
import Etapa2Acelerador2 from "./pages/cnpie/2a/Etapa2Acelerador2";
import Etapa2Acelerador3 from "./pages/cnpie/2a/Etapa2Acelerador3";
import Etapa2Acelerador4 from "./pages/cnpie/2a/Etapa2Acelerador4";
import Etapa2Acelerador5 from "./pages/cnpie/2a/Etapa2Acelerador5";
import Etapa2Acelerador6 from "./pages/cnpie/2a/Etapa2Acelerador6";
import Etapa2Acelerador7 from "./pages/cnpie/2a/Etapa2Acelerador7";

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
                    <Route path="/proyectos" element={<Proyectos />} />
                    <Route path="/proyectos/generacion" element={<Generacion />} />
                    <Route path="/proyectos/manual" element={<Manual />} />
                    <Route path="/proyectos/2a" element={<Proyecto2A />} />
                    <Route path="/proyectos/2b" element={<Proyecto2B />} />
                    <Route path="/proyectos/2c" element={<Proyecto2C />} />
                    <Route path="/repositorio" element={<Repositorio />} />
                    <Route path="/mini-cambio-proyecto" element={<MiniCambioProyecto />} />
                    {/* CNPIE Routes */}
                    <Route path="/cnpie/2a/etapa1/acelerador1" element={<Etapa1Acelerador1 />} />
                    <Route path="/cnpie/2a/etapa2/overview" element={<Etapa2Overview />} />
                    <Route path="/cnpie/2a/etapa2/acelerador2" element={<Etapa2Acelerador2 />} />
                    <Route path="/cnpie/2a/etapa2/acelerador3" element={<Etapa2Acelerador3 />} />
                    <Route path="/cnpie/2a/etapa2/acelerador4" element={<Etapa2Acelerador4 />} />
                    <Route path="/cnpie/2a/etapa2/acelerador5" element={<Etapa2Acelerador5 />} />
                    <Route path="/cnpie/2a/etapa2/acelerador6" element={<Etapa2Acelerador6 />} />
                    <Route path="/cnpie/2a/etapa2/acelerador7" element={<Etapa2Acelerador7 />} />
                    <Route path="/etapa1" element={<Etapa1 />} />
                    <Route path="/etapa1/acelerador1" element={<Acelerador1 />} />
                    <Route path="/etapa1/acelerador2" element={<Acelerador2 />} />
                    <Route path="/etapa1/acelerador3" element={<Acelerador3 />} />
                    <Route path="/etapa2" element={<Etapa2 />} />
                    <Route path="/etapa2/acelerador4" element={<Acelerador4 />} />
                    <Route path="/etapa2/acelerador5" element={<Acelerador5 />} />
                    <Route path="/etapa3" element={<Etapa3 />} />
            <Route path="/etapa3/acelerador8" element={<Acelerador8 />} />
            <Route path="/etapa3/acelerador9" element={<Acelerador9 />} />
            <Route path="/etapa3/acelerador10" element={<Acelerador10 />} />
            <Route path="/etapa3/acelerador10/visor" element={<A8FinalViewer />} />
                    <Route path="/documentos" element={<Documentos />} />
                    <Route path="/ayuda" element={<Ayuda />} />
                    <Route path="/administracion" element={<Admin />} />
                    <Route path="/pitch" element={<Pitch />} />
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
