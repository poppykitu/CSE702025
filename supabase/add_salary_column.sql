-- ============================================================
-- ADD BASE SALARY COLUMN
-- Run this in Supabase SQL Editor
-- ============================================================

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'base_salary') THEN
    ALTER TABLE public.profiles ADD COLUMN base_salary DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;
