-- Create indexes for better performance (only the ones that don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_seller_id ON public.license_keys(seller_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_product_name ON public.license_keys(product_name);