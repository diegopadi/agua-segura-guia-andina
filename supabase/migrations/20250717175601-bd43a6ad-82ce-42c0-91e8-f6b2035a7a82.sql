-- Step 1: Create profile record for existing user
-- First, let's check if there are any existing users without profiles and create them
INSERT INTO public.profiles (user_id, full_name, language)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  'es' as language
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);

-- Step 2: Recreate the trigger function to ensure it works properly
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, language)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    'es'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();