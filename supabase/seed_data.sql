-- ============================================================
-- SEED DATA: Du lieu nhan vien mau cho PeopleHub (10 nhan vien)
-- Huong dan: Copy va chay trong Supabase SQL Editor
-- ============================================================

-- Mau Admin
INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type)
VALUES ('PH-ADM-001', 'Nguyen Quang Admin', 'admin.demo@peoplehub.vn', 'admin', 'active', 'full-time');

-- Mau Nhan su (HR)
INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type)
VALUES ('PH-HR-001', 'Tran Thi Hong Hanh', 'hanh.tran@peoplehub.vn', 'hr', 'active', 'full-time');

-- Mau Quan ly (Manager)
INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-MGR-001', 
  'Le Van Cuong', 
  'cuong.le@peoplehub.vn', 
  'manager', 
  'active', 
  'full-time',
  (SELECT id FROM departments WHERE name LIKE '%Engineering%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Engineering Manager' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-MGR-002', 
  'Pham Minh Duc', 
  'duc.pham@peoplehub.vn', 
  'manager', 
  'active', 
  'full-time',
  (SELECT id FROM departments WHERE name LIKE '%Sales%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Sales Manager' LIMIT 1)
);

-- Mau Nhan vien (Employee)
INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-001', 
  'Nguyen Van An', 
  'an.nguyen@peoplehub.vn', 
  'employee', 
  'active', 
  'full-time',
  (SELECT id FROM departments WHERE name LIKE '%Engineering%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Software Engineer' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-002', 
  'Hoang Thi Binh', 
  'binh.hoang@peoplehub.vn', 
  'employee', 
  'active', 
  'full-time',
  (SELECT id FROM departments WHERE name LIKE '%Marketing%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Marketing Specialist' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-003', 
  'Do Van Chinh', 
  'chinh.do@peoplehub.vn', 
  'employee', 
  'active', 
  'intern',
  (SELECT id FROM departments WHERE name LIKE '%Design%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'UX Designer' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-004', 
  'Vu Minh Tam', 
  'tam.vu@peoplehub.vn', 
  'employee', 
  'active', 
  'contract',
  (SELECT id FROM departments WHERE name LIKE '%Engineering%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Senior Software Engineer' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-005', 
  'Dang Thu Thao', 
  'thao.dang@peoplehub.vn', 
  'employee', 
  'active', 
  'full-time',
  (SELECT id FROM departments WHERE name LIKE '%Finance%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Financial Analyst' LIMIT 1)
);

INSERT INTO public.profiles (employee_id, full_name, email, role, status, work_type, department_id, designation_id)
VALUES (
  'PH-EMP-006', 
  'Ly Hoang Nam', 
  'nam.ly@peoplehub.vn', 
  'employee', 
  'onboarding', 
  'intern',
  (SELECT id FROM departments WHERE name LIKE '%Product%' LIMIT 1),
  (SELECT id FROM designations WHERE title = 'Product Manager' LIMIT 1)
);

-- Gan manager_id cho cac phong ban de logic test Manager hoat dong
UPDATE departments SET manager_id = (SELECT id FROM profiles WHERE employee_id = 'PH-MGR-001') WHERE name LIKE '%Engineering%';
UPDATE departments SET manager_id = (SELECT id FROM profiles WHERE employee_id = 'PH-MGR-002') WHERE name LIKE '%Sales%';
