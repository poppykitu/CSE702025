-- ============================================================
-- PEOPLEHUB — Employee Directory Schema
-- Supabase / PostgreSQL
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE employee_status AS ENUM ('active', 'onboarding', 'terminated');
CREATE TYPE work_type AS ENUM ('full-time', 'part-time', 'contract', 'intern');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code        VARCHAR(20) UNIQUE, -- e.g: "ENG", "MKT"
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: designations (chức vụ/chức danh)
-- ============================================================
CREATE TABLE designations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  level         INTEGER DEFAULT 1, -- 1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(title, department_id)
);

-- ============================================================
-- TABLE: profiles (Hồ sơ nhân viên)
-- Linked to Supabase Auth users
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id       VARCHAR(20) UNIQUE NOT NULL, -- VD: "EMP-001"
  full_name         VARCHAR(200) NOT NULL,
  email             VARCHAR(320) UNIQUE NOT NULL,
  phone             VARCHAR(30),
  avatar_url        TEXT,
  
  -- Employment Info
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation_id    UUID REFERENCES designations(id) ON DELETE SET NULL,
  manager_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status            employee_status NOT NULL DEFAULT 'onboarding',
  work_type         work_type NOT NULL DEFAULT 'full-time',
  work_location     VARCHAR(100), -- VD: "Hà Nội HQ", "Remote"
  date_of_joining   DATE,
  date_of_termination DATE,
  
  -- Personal Info
  gender            gender_type,
  date_of_birth     DATE,
  address           TEXT,
  bio               TEXT,
  
  -- Metadata
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_manager ON profiles(manager_id);
CREATE INDEX idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX idx_profiles_full_text ON profiles USING gin(to_tsvector('simple', full_name || ' ' || email || ' ' || employee_id));
CREATE INDEX idx_designations_department ON designations(department_id);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER designations_updated_at BEFORE UPDATE ON designations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Departments: All authenticated users can read
CREATE POLICY "departments_read_authenticated"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- Departments: Only service_role (admin) can write
CREATE POLICY "departments_write_service_role"
  ON departments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Designations: All authenticated users can read
CREATE POLICY "designations_read_authenticated"
  ON designations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "designations_write_service_role"
  ON designations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Profiles: All authenticated users can read all profiles
CREATE POLICY "profiles_read_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles: Service role (HR system) can do everything
CREATE POLICY "profiles_all_service_role"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET for avatars
-- Run from Supabase Dashboard > Storage
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);

-- Storage policy: Anyone authenticated can upload
-- CREATE POLICY "avatars_upload_authenticated"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'avatars');

-- Storage policy: Public read
-- CREATE POLICY "avatars_public_read"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'avatars');

-- ============================================================
-- SEED DATA — Demo departments và designations
-- ============================================================
INSERT INTO departments (name, description, code) VALUES
  ('Kỹ thuật - Engineering', 'Phòng phát triển phần mềm và hạ tầng', 'ENG'),
  ('Kinh doanh - Sales', 'Phòng kinh doanh và bán hàng', 'SALES'),
  ('Marketing', 'Phòng tiếp thị và truyền thông', 'MKT'),
  ('Nhân sự - HR', 'Phòng quản lý nguồn nhân lực', 'HR'),
  ('Tài chính - Finance', 'Phòng tài chính và kế toán', 'FIN'),
  ('Thiết kế - Design', 'Phòng thiết kế sản phẩm và UX', 'DESIGN'),
  ('Sản phẩm - Product', 'Phòng quản lý sản phẩm', 'PROD');

INSERT INTO designations (title, department_id, level) VALUES
  ('Software Engineer', (SELECT id FROM departments WHERE code='ENG'), 2),
  ('Senior Software Engineer', (SELECT id FROM departments WHERE code='ENG'), 3),
  ('Tech Lead', (SELECT id FROM departments WHERE code='ENG'), 4),
  ('Engineering Manager', (SELECT id FROM departments WHERE code='ENG'), 5),
  ('Sales Executive', (SELECT id FROM departments WHERE code='SALES'), 2),
  ('Sales Manager', (SELECT id FROM departments WHERE code='SALES'), 5),
  ('Marketing Specialist', (SELECT id FROM departments WHERE code='MKT'), 2),
  ('HR Specialist', (SELECT id FROM departments WHERE code='HR'), 2),
  ('HR Manager', (SELECT id FROM departments WHERE code='HR'), 5),
  ('Financial Analyst', (SELECT id FROM departments WHERE code='FIN'), 2),
  ('UX Designer', (SELECT id FROM departments WHERE code='DESIGN'), 2),
  ('Product Manager', (SELECT id FROM departments WHERE code='PROD'), 4);
