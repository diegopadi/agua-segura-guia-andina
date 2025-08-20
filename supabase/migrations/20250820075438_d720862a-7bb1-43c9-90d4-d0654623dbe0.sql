-- Fix the Acelerador 5 session status and clean up invalid A6 session
-- Update A5 session to completed status
UPDATE acelerador_sessions 
SET status = 'completed', updated_at = now()
WHERE id = '84c4b92d-f8a3-44b9-a6bf-34dec084c2ee' 
AND acelerador_number = 5;

-- Delete the A6 session that doesn't have A5 data
DELETE FROM acelerador_sessions 
WHERE id = '646180c3-2842-43da-a24d-513ece9d4fcf' 
AND acelerador_number = 6;