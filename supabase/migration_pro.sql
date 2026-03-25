-- ============================================================
-- PROFESSIONAL HRM MODULE: Advanced Database Schema (Pro)
-- Designed by Senior System Architect
-- Standard: Audit Trail, Document Management, & Advanced RLS
-- ============================================================

-- 1. EXTENSIONS & TYPES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employee Lifecycle Status
-- 'active': Currently working
-- 'onboarding': Newly hired, in training
-- 'terminated': Offboarded
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
    CREATE TYPE employee_status AS ENUM ('active', 'onboarding', 'terminated');
  END IF;
END $$;

-- User Roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');
  END IF;
END $$;

-- 2. TABLE: audit_logs (Luu vet thay doi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name    VARCHAR(100) NOT NULL,
  record_id     UUID NOT NULL,
  action        VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data      JSONB,
  new_data      JSONB,
  performed_by  UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Audit Logs (Only Admin/HR read)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. TABLE: documents (Quan ly tai lieu nhan vien)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     VARCHAR(50), -- PDF, DOCX, IMG
  category      VARCHAR(50), -- Contract, Insurance, ID, Other
  uploaded_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. TRIGGER: Audit Trail Function
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, performed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit Trigger to Profiles
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5. REFINED RLS POLICIES (Enterprise Standard)
-- ============================================================

-- Admin: ALL (Audit Logs, Profiles, Docs)
CREATE POLICY "admin_all_audit" ON audit_logs FOR ALL TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "admin_all_documents" ON documents FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- HR: Manage Records (Contract, Insurance, Profiles)
-- Prevent Admin deletion (Added in USING clause for HR)
DROP POLICY IF EXISTS "profiles_hr_update" ON profiles;
CREATE POLICY "profiles_hr_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'hr' AND role != 'admin')
  WITH CHECK (get_user_role() = 'hr' AND role != 'admin');

-- Manager: Select Department Subordinates
DROP POLICY IF EXISTS "profiles_manager_select" ON profiles;
CREATE POLICY "profiles_manager_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'manager'
    AND (
      department_id IN (SELECT get_managed_department_ids())
      OR user_id = auth.uid()
    )
  );

-- Employee: Self-service Documents
CREATE POLICY "employee_view_own_docs"
  ON documents FOR SELECT
  TO authenticated
  USING (employee_id = get_current_profile_id());

-- 6. LIFECYCLE LOGIC: Status Transitions
-- ============================================================
-- Ensure consistent status management
CREATE OR REPLACE FUNCTION public.handle_employee_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic khi nhan vien nghi viec (terminated)
  IF NEW.status = 'terminated' AND OLD.status != 'terminated' THEN
    NEW.date_of_termination = NOW();
    -- Co the add logic xoa quyen truy cap, email, etc. o day
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_lifecycle_trigger ON public.profiles;
CREATE TRIGGER employee_lifecycle_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_employee_lifecycle();
