-- Add new columns to issues table for official matching
ALTER TABLE public.issues 
ADD COLUMN assigned_official_id UUID REFERENCES auth.users(id),
ADD COLUMN suggested_official_id UUID REFERENCES auth.users(id),
ADD COLUMN pincode TEXT,
ADD COLUMN district TEXT;

-- Add geographic bounds to profiles table for officials
ALTER TABLE public.profiles 
ADD COLUMN pincode TEXT,
ADD COLUMN district TEXT,
ADD COLUMN geo_bounds JSONB; -- Store lat/lng boundaries for coverage area

-- Create index for faster location-based queries
CREATE INDEX idx_profiles_location ON public.profiles(city, state, pincode, district) WHERE role = 'official';
CREATE INDEX idx_issues_location ON public.issues(city, state, pincode, district);

-- Update RLS policies to allow officials to see assigned issues
CREATE POLICY "Officials can view assigned issues" ON public.issues FOR SELECT USING (auth.uid() = assigned_official_id OR auth.uid() = suggested_official_id);