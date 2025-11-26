import React from "react";
import { useNavigate } from "react-router-dom";

export default function Proyectos() {
  const navigate = useNavigate();

  // Redirigir automáticamente a /proyectos/manual
  React.useEffect(() => {
    navigate("/proyectos/manual");
  }, [navigate]);

  return null;
}
