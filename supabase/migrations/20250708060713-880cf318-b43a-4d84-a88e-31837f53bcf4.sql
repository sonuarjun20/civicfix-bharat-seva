-- Create verified_officials table for pre-approved government officials
CREATE TABLE public.verified_officials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MLA', 'Ward Officer', 'Panchayat Secretary')),
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  district TEXT,
  ward TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verified_officials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Verified officials are viewable by authenticated users" 
ON public.verified_officials 
FOR SELECT 
TO authenticated
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_verified_officials_updated_at
BEFORE UPDATE ON public.verified_officials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample verified officials for testing
INSERT INTO public.verified_officials (full_name, role, phone, email, district, ward, state) VALUES
('Rajesh Kumar', 'Ward Officer', '+91-9876543210', 'rajesh.kumar@gov.in', 'Delhi', 'Ward 1', 'Delhi'),
('Priya Sharma', 'MLA', '+91-9876543211', 'priya.sharma@assembly.gov.in', 'Mumbai', 'Bandra East', 'Maharashtra'),
('Amit Patel', 'Panchayat Secretary', '+91-9876543212', 'amit.patel@panchayat.gov.in', 'Ahmedabad', 'Sabarmati', 'Gujarat');