-- Remove file_url column from diagnostic_reports table since we're moving to internal viewer
ALTER TABLE public.diagnostic_reports DROP COLUMN file_url;

-- Update metadata column to store HTML content instead of file references
COMMENT ON COLUMN public.diagnostic_reports.metadata IS 'Stores the generated report content in HTML format for internal viewer';