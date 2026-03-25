-- ============================================================
-- FIX RLS POLICIES FOR EMPLOYEE MANAGEMENT
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ensure 'role' column exists in profiles (already used in app, but making sure)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(20) DEFAULT 'employee';
  END IF;
END $$;

-- 2. Update RLS for profiles table
-- Drop old policy if exists or just add a new one
DROP POLICY IF EXISTS "profiles_update_hr_admin" ON profiles;

CREATE POLICY "profiles_update_hr_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'hr')
    )
  );

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
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'hr')
    )
  );

DROP POLICY IF EXISTS "documents_read_all_authenticated" ON storage.objects;
CREATE POLICY "documents_read_all_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee_documents');
