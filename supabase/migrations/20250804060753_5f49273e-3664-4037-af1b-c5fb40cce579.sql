-- Corregir la sesión que está en paso 6 para que esté en paso 5
UPDATE acelerador_sessions 
SET current_step = 5 
WHERE id = 'c673af3b-6cd3-42a9-a145-e0f514f58bd7' AND current_step = 6;