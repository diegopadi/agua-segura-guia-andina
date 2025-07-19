
-- Crear política pública para ver encuestas activas con token válido
CREATE POLICY "Public can view active surveys with token" 
  ON public.surveys 
  FOR SELECT 
  USING (status = 'active' AND participant_token IS NOT NULL);

-- Crear política pública para ver preguntas de encuestas activas
CREATE POLICY "Public can view questions of active surveys" 
  ON public.survey_questions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE id = survey_questions.survey_id 
      AND status = 'active' 
      AND participant_token IS NOT NULL
    )
  );
