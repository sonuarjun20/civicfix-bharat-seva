-- Create user_role enum type
CREATE TYPE user_role AS ENUM ('citizen', 'official', 'admin');

-- Update profiles table to use the enum (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Check if role column exists, if not add it
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
            ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'citizen';
        ELSE
            -- If column exists but wrong type, update it
            ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
        END IF;
    END IF;
END $$;