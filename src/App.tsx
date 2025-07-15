
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Inicio from "./pages/Inicio";
import Etapa1 from "./pages/Etapa1";
import Etapa2 from "./pages/Etapa2";
import Etapa3 from "./pages/Etapa3";
import Documentos from "./pages/Documentos";
import Ayuda from "./pages/Ayuda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/etapa1" element={<Etapa1 />} />
            <Route path="/etapa2" element={<Etapa2 />} />
            <Route path="/etapa3" element={<Etapa3 />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/ayuda" element={<Ayuda />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
