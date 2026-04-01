-- ============================================================
-- PEOPLEHUB HRM - PHASE 2 MIGRATION
-- Run this script in the Supabase SQL Editor
-- Dependencies: schema.sql, migration_rbac.sql must be applied first
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES for Phase 2
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_stage') THEN
    CREATE TYPE application_stage AS ENUM (
      'sourcing',
      'applied',
      'review',
      'interview',
      'hired',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'leave_request',
      'profile_update',
      'application_received',
      'interview_scheduled',
      'applicant_hired'
    );
  END IF;
END $$;

-- ============================================================
-- 2. TABLE: job_applications (Ho so ung tuyen)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_name      VARCHAR(200) NOT NULL,
  candidate_email     VARCHAR(320) NOT NULL,
  phone               VARCHAR(30),
  position_applied    VARCHAR(200) NOT NULL,
  department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- CV & Documents
  cv_url              TEXT,                   -- Supabase Storage URL
  cover_letter        TEXT,

  -- Background
  work_history        TEXT,                   -- Free-text or structured JSON
  years_of_experience INTEGER DEFAULT 0,
  education_summary   TEXT,

  -- Expectations
  expected_salary     BIGINT,                 -- In VND
  available_from      DATE,

  -- Recruitment Pipeline
  stage               application_stage NOT NULL DEFAULT 'applied',
  interview_time      TIMESTAMPTZ,
  interviewer_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason    TEXT,
  notes               TEXT,                   -- Internal HR notes

  -- Tracking
  reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  hired_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hired_at            TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS job_applications_updated_at ON job_applications;
CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_applications_stage ON job_applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_email ON job_applications(candidate_email);
CREATE INDEX IF NOT EXISTS idx_applications_dept ON job_applications(department_id);

-- ============================================================
-- 3. EXPAND: employees table for enhanced profiles
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS academic_background   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS work_experience        JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS work_schedule          JSONB DEFAULT '{}'::jsonb;

-- academic_background schema example:
-- [{"degree": "Bachelor", "institution": "HUST", "field": "CS", "year": 2020}]

-- work_experience schema example:
-- [{"company": "Acme Corp", "title": "Dev", "from": "2020-01", "to": "2022-06", "description": "..."}]

-- work_schedule schema example:
-- {"shift_start": "08:00", "shift_end": "17:00", "work_days": ["Mon","Tue","Wed","Thu","Fri"]}

-- ============================================================
-- 4. TABLE: system_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS system_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(300) NOT NULL,
  body            TEXT,
  reference_id    UUID,               -- ID of the related record (leave_request, application, etc.)
  reference_table VARCHAR(100),       -- Which table the reference_id points to
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON system_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON system_notifications(recipient_id, is_read);

-- ============================================================
-- 5. TRIGGER: Auto-notify HR/Admin on new leave request
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_leave_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admin and hr role profiles
  INSERT INTO system_notifications (recipient_id, type, title, body, reference_id, reference_table)
  SELECT
    p.id,
    'leave_request',
    'Don nghi phep moi can phe duyet',
    'Nhan vien ' || (SELECT full_name FROM profiles WHERE id = NEW.employee_id) ||
      ' vua gui don nghi phep tu ' || NEW.start_date || ' den ' || NEW.end_date || '.',
    NEW.id,
    'leave_requests'
  FROM profiles p
  WHERE p.role IN ('admin', 'hr');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_leave_request ON leave_requests;
CREATE TRIGGER trg_notify_leave_request
  AFTER INSERT ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_leave_request();

-- ============================================================
-- 6. TRIGGER: Auto-notify HR/Admin on new job application
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_application()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_notifications (recipient_id, type, title, body, reference_id, reference_table)
  SELECT
    p.id,
    'application_received',
    'Ho so ung tuyen moi: ' || NEW.position_applied,
    'Ung vien ' || NEW.candidate_name || ' (' || NEW.candidate_email || ') vua nop don ung tuyen.',
    NEW.id,
    'job_applications'
  FROM profiles p
  WHERE p.role IN ('admin', 'hr');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_application ON job_applications;
CREATE TRIGGER trg_notify_application
  AFTER INSERT ON job_applications
  FOR EACH ROW EXECUTE FUNCTION notify_on_application();

-- ============================================================
-- 7. RPC: Convert hired applicant to Employee
-- ============================================================
CREATE OR REPLACE FUNCTION convert_applicant_to_employee(
  p_application_id    UUID,
  p_hired_by_id       UUID
)
RETURNS JSON AS $$
DECLARE
  v_app           job_applications%ROWTYPE;
  v_new_emp_id    VARCHAR(20);
  v_profile_id    UUID;
BEGIN
  -- Fetch application
  SELECT * INTO v_app FROM job_applications WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id;
  END IF;

  IF v_app.stage = 'hired' THEN
    RAISE EXCEPTION 'Applicant already converted to employee.';
  END IF;

  -- Generate Employee ID
  SELECT 'EMP-' || LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO v_new_emp_id
  FROM profiles;

  -- Create profile record (no auth.user yet — Magic Link will link it after account setup)
  INSERT INTO profiles (
    employee_id, full_name, email, phone,
    status, department_id, created_at, updated_at
  ) VALUES (
    v_new_emp_id,
    v_app.candidate_name,
    v_app.candidate_email,
    v_app.phone,
    'onboarding',
    v_app.department_id,
    NOW(), NOW()
  )
  RETURNING id INTO v_profile_id;

  -- Mark application as hired
  UPDATE job_applications
  SET stage = 'hired', hired_by = p_hired_by_id, hired_at = NOW(), updated_at = NOW()
  WHERE id = p_application_id;

  RETURN json_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'employee_id', v_new_emp_id,
    'email', v_app.candidate_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. FUNCTION: Calculate net salary for a profile in a month
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_net_salary(
  p_profile_id  UUID,
  p_year        INTEGER,
  p_month       INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_payslip           payslips%ROWTYPE;
  v_late_count        INTEGER;
  v_late_deduction    BIGINT;
  v_net_salary        BIGINT;
  v_deduction_per_late BIGINT := 100000; -- 100,000 VND per late arrival
BEGIN
  -- Get payslip base data for the month
  SELECT * INTO v_payslip
  FROM payslips
  WHERE profile_id = p_profile_id
    AND EXTRACT(YEAR FROM pay_period_start) = p_year
    AND EXTRACT(MONTH FROM pay_period_start) = p_month
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No payslip found for this period');
  END IF;

  -- Count late arrivals from attendance_records
  SELECT COUNT(*) INTO v_late_count
  FROM attendance_records
  WHERE employee_id = p_profile_id
    AND EXTRACT(YEAR FROM work_date) = p_year
    AND EXTRACT(MONTH FROM work_date) = p_month
    AND status = 'late';

  v_late_deduction := v_late_count * v_deduction_per_late;
  v_net_salary := GREATEST(0, v_payslip.net_salary - v_late_deduction);

  RETURN json_build_object(
    'base_salary',      v_payslip.basic_salary,
    'gross_salary',     v_payslip.gross_salary,
    'late_count',       v_late_count,
    'late_deduction',   v_late_deduction,
    'other_deductions', v_payslip.deductions,
    'net_salary',       v_net_salary
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. ROW LEVEL SECURITY for new tables
-- ============================================================

-- job_applications: Only HR and Admin can view/modify
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR/Admin can manage applications" ON job_applications;
CREATE POLICY "HR/Admin can manage applications"
  ON job_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Allow public INSERT (unauthenticated candidates can submit)
DROP POLICY IF EXISTS "Public can submit application" ON job_applications;
CREATE POLICY "Public can submit application"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- system_notifications: Recipient can read their own
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON system_notifications;
CREATE POLICY "Users read own notifications"
  ON system_notifications FOR SELECT
  USING (
    recipient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert notifications" ON system_notifications;
CREATE POLICY "System can insert notifications"
  ON system_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own notifications" ON system_notifications;
CREATE POLICY "Users update own notifications"
  ON system_notifications FOR UPDATE
  USING (
    recipient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- DONE
-- ============================================================
