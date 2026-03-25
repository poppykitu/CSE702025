-- ============================================================
-- FIX RLS POLICIES FOR EMPLOYEE MANAGEMENT
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ensure 'role' and 'contract_url' columns exist in profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(20) DEFAULT 'employee';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'contract_url') THEN
    ALTER TABLE profiles ADD COLUMN contract_url TEXT;
  END IF;
END $$;

-- 2. Create Security Definer Function to avoid infinite recursion
CREATE OR REPLACE FUNCTION check_is_admin_or_hr()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'hr')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS for profiles table
DROP POLICY IF EXISTS "profiles_update_hr_admin" ON profiles;

CREATE POLICY "profiles_update_hr_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (check_is_admin_or_hr())
  WITH CHECK (check_is_admin_or_hr());

-- 3. Setup Storage for Employee Documents
-- Create bucket if not exists (Note: buckets table is in 'storage' schema)
INSERT INTO storage.buckets (id, name, public)
SELECT 'employee_documents', 'employee_documents', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'employee_documents');

-- Policies for employee_documents bucket
DROP POLICY IF EXISTS "documents_upload_hr_admin" ON storage.objects;
CREATE POLICY "documents_upload_hr_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee_documents' AND
    check_is_admin_or_hr()
  );


-- 4. Setup Storage for Avatars
-- Ensure 'avatars' bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

DROP POLICY IF EXISTS "avatars_upload_authenticated" ON storage.objects;
CREATE POLICY "avatars_upload_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- 5. SET YOUR ADMIN ROLE
-- IMPORTANT: Run this to make sure your account has admin power
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'poppykitu@gmail.com';
