UPDATE diagnostic_reports 
SET status = 'error' 
WHERE status = 'generating' 
AND id = 'b871377d-3e6e-4e74-b291-b830841430b1';