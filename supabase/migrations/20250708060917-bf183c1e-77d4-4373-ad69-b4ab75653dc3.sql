-- Update the handle_new_user function to handle official signup data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Determine the role from metadata, default to 'citizen'
  user_role_val := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'citizen');
  
  INSERT INTO public.profiles (
    user_id, 
    phone, 
    full_name, 
    role,
    district,
    ward,
    state
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    user_role_val,
    NEW.raw_user_meta_data ->> 'district',
    NEW.raw_user_meta_data ->> 'ward',
    NEW.raw_user_meta_data ->> 'state'
  );
  
  -- If user is an official, mark them as verified
  IF user_role_val = 'official' THEN
    UPDATE public.profiles 
    SET is_verified = true 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;