-- Create diagnosticos-pdf storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnosticos-pdf', 'diagnosticos-pdf', false);

-- Create storage policies for diagnosticos-pdf bucket
CREATE POLICY "Users can view their own diagnostic PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'diagnosticos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own diagnostic PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'diagnosticos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own diagnostic PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'diagnosticos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own diagnostic PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'diagnosticos-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add needs_review field to rubricas_evaluacion
ALTER TABLE rubricas_evaluacion 
ADD COLUMN needs_review BOOLEAN DEFAULT false;

-- Add needs_review field to sesiones_clase
ALTER TABLE sesiones_clase 
ADD COLUMN needs_review BOOLEAN DEFAULT false;