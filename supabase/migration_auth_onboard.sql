-- Cập nhật RPC convert_applicant_to_employee để nhận ID Auth.User vừa tạo
CREATE OR REPLACE FUNCTION convert_applicant_to_employee(
  p_application_id    UUID,
  p_hired_by_id       UUID,
  p_auth_user_id      UUID DEFAULT NULL
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

  -- Create profile record (Map user_id directly from Auth)
  INSERT INTO profiles (
    user_id,
    employee_id, full_name, email, phone,
    status, department_id, created_at, updated_at
  ) VALUES (
    p_auth_user_id,
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
