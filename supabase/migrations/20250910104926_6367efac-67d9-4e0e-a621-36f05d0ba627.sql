-- Enable Row Level Security on license_keys table (critical security fix)
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Create profiles table for seller information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  company_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add seller_id column to license_keys table to link licenses to sellers
ALTER TABLE public.license_keys 
ADD COLUMN seller_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on license_keys
CREATE TRIGGER update_license_keys_updated_at
  BEFORE UPDATE ON public.license_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS UUID AS $$
  SELECT user_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for license_keys table
CREATE POLICY "Users can view their own license keys" 
ON public.license_keys 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Users can create their own license keys" 
ON public.license_keys 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own license keys" 
ON public.license_keys 
FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own license keys" 
ON public.license_keys 
FOR DELETE 
USING (auth.uid() = seller_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_license_keys_seller_id ON public.license_keys(seller_id);
CREATE INDEX idx_license_keys_status ON public.license_keys(status);
CREATE INDEX idx_license_keys_product_name ON public.license_keys(product_name);