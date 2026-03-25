-- ============================================================
-- MIGRATION: He thong phan quyen da cap (Multi-level RBAC)
-- Chay script nay trong Supabase SQL Editor
-- ============================================================

-- 1. Tao ENUM cho vai tro nguoi dung (Chay an toan nhieu lan)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'maternity', 'other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END $$;

-- 2. Them cot role vao bang profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'employee';

-- 3. Them cot manager_id vao bang departments
-- ============================================================
ALTER TABLE departments ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Tao bang leave_requests (Don nghi phep)
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  type            leave_type NOT NULL DEFAULT 'annual',
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT,
  status          leave_status NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  hr_noted        BOOLEAN DEFAULT FALSE,
  hr_noted_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hr_noted_at     TIMESTAMPTZ,
  reject_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Xoa va tao lai trigger de dam bao cap nhat moi nhat
DROP TRIGGER IF EXISTS leave_requests_updated_at ON leave_requests;
CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Su dung IF NOT EXISTS cho cac chi muc
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_department ON leave_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- 5. Helper functions cho RLS
-- ============================================================

-- Lay role cua user hien tai (Optimized with caching)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Lay danh sach department_id ma user quan ly (Optimized with caching)
CREATE OR REPLACE FUNCTION get_managed_department_ids()
RETURNS SETOF UUID AS $$
  SELECT d.id FROM departments d
  INNER JOIN profiles p ON d.manager_id = p.id
  WHERE p.user_id = (SELECT auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Lay profile id cua user hien tai (Optimized with caching)
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function tu dong tao profile khi co user moi trong auth.users (Da sua loi thieu employee_id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_emp_id TEXT;
BEGIN
  -- Sinh ma nhan vien tam thoi tu 8 ky tu dau cua UUID
  new_emp_id := 'EMP-' || upper(substr(new.id::text, 1, 8));

  INSERT INTO public.profiles (user_id, full_name, email, role, employee_id, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
    new.email,
    'employee',
    new_emp_id,
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger chay sau khi insert vao auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- BACKFILL: Tao profile cho cac user da dang ky nhung chua co profile
INSERT INTO public.profiles (user_id, full_name, email, role, employee_id, status)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Member'), 
  email, 
  'employee',
  'EMP-' || upper(substr(id::text, 1, 8)),
  'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 6. XOA cac RLS policy cu
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "profiles_read_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_all_service_role" ON profiles;

-- Departments
DROP POLICY IF EXISTS "departments_read_authenticated" ON departments;
DROP POLICY IF EXISTS "departments_write_service_role" ON departments;

-- Designations
DROP POLICY IF EXISTS "designations_read_authenticated" ON designations;
DROP POLICY IF EXISTS "designations_write_service_role" ON designations;

-- ============================================================
-- 7. RLS POLICIES MOI — PROFILES
-- ============================================================

-- Admin: Toan quyen
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- HR: Doc moi ho so
DROP POLICY IF EXISTS "profiles_hr_select" ON profiles;
CREATE POLICY "profiles_hr_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'hr');

-- HR: Cap nhat ho so (tru admin)
DROP POLICY IF EXISTS "profiles_hr_update" ON profiles;
CREATE POLICY "profiles_hr_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'hr' AND role != 'admin')
  WITH CHECK (get_user_role() = 'hr' AND role != 'admin');

-- HR: Them ho so moi
DROP POLICY IF EXISTS "profiles_hr_insert" ON profiles;
CREATE POLICY "profiles_hr_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'hr');

-- Manager: Doc ho so nhan vien trong phong ban minh quan ly
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

-- Employee: Doc danh ba (Cho phep xem moi ho so nhung chi SELECT)
DROP POLICY IF EXISTS "profiles_employee_select" ON profiles;
CREATE POLICY "profiles_employee_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Employee: Cap nhat chinh ho so cua minh (chi cac truong ca nhan)
DROP POLICY IF EXISTS "profiles_employee_update" ON profiles;
CREATE POLICY "profiles_employee_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Service role: Toan quyen (cho backend/system)
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;
CREATE POLICY "profiles_service_role_all"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 8. RLS POLICIES MOI — DEPARTMENTS
-- ============================================================

-- Moi authenticated user deu doc duoc phong ban
DROP POLICY IF EXISTS "departments_select_authenticated" ON departments;
CREATE POLICY "departments_select_authenticated"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- Admin: Toan quyen tren phong ban
DROP POLICY IF EXISTS "departments_admin_all" ON departments;
CREATE POLICY "departments_admin_all"
  ON departments FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- HR: Them va sua phong ban
DROP POLICY IF EXISTS "departments_hr_insert" ON departments;
CREATE POLICY "departments_hr_insert"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'hr');

DROP POLICY IF EXISTS "departments_hr_update" ON departments;
CREATE POLICY "departments_hr_update"
  ON departments FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'hr')
  WITH CHECK (get_user_role() = 'hr');

DROP POLICY IF EXISTS "departments_hr_delete" ON departments;
CREATE POLICY "departments_hr_delete"
  ON departments FOR DELETE
  TO authenticated
  USING (get_user_role() = 'hr');

-- Service role
DROP POLICY IF EXISTS "departments_service_role_all" ON departments;
CREATE POLICY "departments_service_role_all"
  ON departments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 9. RLS POLICIES MOI — DESIGNATIONS
-- ============================================================

DROP POLICY IF EXISTS "designations_select_authenticated" ON designations;
CREATE POLICY "designations_select_authenticated"
  ON designations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "designations_admin_all" ON designations;
CREATE POLICY "designations_admin_all"
  ON designations FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "designations_hr_write" ON designations;
CREATE POLICY "designations_hr_write"
  ON designations FOR ALL
  TO authenticated
  USING (get_user_role() = 'hr')
  WITH CHECK (get_user_role() = 'hr');

DROP POLICY IF EXISTS "designations_service_role_all" ON designations;
CREATE POLICY "designations_service_role_all"
  ON designations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 10. RLS POLICIES — LEAVE_REQUESTS
-- ============================================================

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Admin: Toan quyen
DROP POLICY IF EXISTS "leave_admin_all" ON leave_requests;
CREATE POLICY "leave_admin_all"
  ON leave_requests FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- HR: Doc va cap nhat moi don
DROP POLICY IF EXISTS "leave_hr_select" ON leave_requests;
CREATE POLICY "leave_hr_select"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (get_user_role() = 'hr');

DROP POLICY IF EXISTS "leave_hr_update" ON leave_requests;
CREATE POLICY "leave_hr_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'hr')
  WITH CHECK (get_user_role() = 'hr');

-- Manager: Doc va cap nhat don cua nhan vien trong phong ban
DROP POLICY IF EXISTS "leave_manager_select" ON leave_requests;
CREATE POLICY "leave_manager_select"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'manager'
    AND department_id IN (SELECT get_managed_department_ids())
  );

DROP POLICY IF EXISTS "leave_manager_update" ON leave_requests;
CREATE POLICY "leave_manager_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'manager'
    AND department_id IN (SELECT get_managed_department_ids())
  )
  WITH CHECK (
    get_user_role() = 'manager'
    AND department_id IN (SELECT get_managed_department_ids())
  );

-- Employee: Doc chinh don cua minh
DROP POLICY IF EXISTS "leave_employee_select" ON leave_requests;
CREATE POLICY "leave_employee_select"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'employee'
    AND employee_id = get_current_profile_id()
  );

-- Employee: Tao don moi
DROP POLICY IF EXISTS "leave_employee_insert" ON leave_requests;
CREATE POLICY "leave_employee_insert"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (get_user_role() = 'employee' OR get_user_role() = 'manager')
    AND employee_id = get_current_profile_id()
  );

-- Employee: Huy don (chi khi con pending)
DROP POLICY IF EXISTS "leave_employee_update" ON leave_requests;
CREATE POLICY "leave_employee_update"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'employee'
    AND employee_id = get_current_profile_id()
    AND status = 'pending'
  )
  WITH CHECK (
    get_user_role() = 'employee'
    AND employee_id = get_current_profile_id()
  );

-- Service role
DROP POLICY IF EXISTS "leave_service_role_all" ON leave_requests;
CREATE POLICY "leave_service_role_all"
  ON leave_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 11. INDEX cho hieu nang (Optimized)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
