-- 1. Asegúrate de que RLS esté habilitado
ALTER TABLE public.survey_participants
  ENABLE ROW LEVEL SECURITY;

-- 2. Crea una política permisiva para que el rol anon (y auth) pueda INSERTAR
CREATE POLICY "Allow all inserts on survey_participants"
  ON public.survey_participants
  FOR INSERT
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Convierte tu función RPC en SECURITY DEFINER para que se ejecute con privilegios de dueño
ALTER FUNCTION public.create_unique_participant(uuid)
  SECURITY DEFINER;

-- 4. Concede ejecución de la función a anon (y auth) si aún no existe
GRANT EXECUTE ON FUNCTION public.create_unique_participant(uuid)
  TO anon, authenticated;