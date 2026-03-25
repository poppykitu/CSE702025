-- ============================================================
-- MODULE: Attendance & Payroll (Chấm công & Bảng lương)
-- Designed by Senior System Architect
-- ============================================================

-- 1. TABLE: attendance_records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  work_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  status          VARCHAR(20) DEFAULT 'present', -- present, absent, late, early_leave
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 2. TABLE: payslips
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payslips (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month             INTEGER NOT NULL,
  year              INTEGER NOT NULL,
  basic_salary      DECIMAL(15,2) NOT NULL,
  allowances        DECIMAL(15,2) DEFAULT 0,
  deductions        DECIMAL(15,2) DEFAULT 0,
  net_salary        DECIMAL(15,2) NOT NULL,
  status            VARCHAR(20) DEFAULT 'draft', -- draft, published, paid
  file_url          TEXT, -- Link PDF neu co
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
-- ============================================================

-- Attendance: Employee view own, Manager view subordinates, HR/Admin ALL
CREATE POLICY "attendance_employee_select" ON attendance_records FOR SELECT TO authenticated USING (employee_id = get_current_profile_id());
CREATE POLICY "attendance_manager_select" ON attendance_records FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = attendance_records.employee_id 
    AND p.department_id IN (SELECT get_managed_department_ids())
  )
);
CREATE POLICY "attendance_hr_all" ON attendance_records FOR ALL TO authenticated USING (get_user_role() IN ('hr', 'admin'));

-- Payslips: Employee view own paid/published, HR/Admin ALL
CREATE POLICY "payslips_employee_select" ON payslips FOR SELECT TO authenticated USING (employee_id = get_current_profile_id() AND status IN ('published', 'paid'));
CREATE POLICY "payslips_hr_all" ON payslips FOR ALL TO authenticated USING (get_user_role() IN ('hr', 'admin'));
