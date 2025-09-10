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