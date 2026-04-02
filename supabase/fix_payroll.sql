CREATE OR REPLACE FUNCTION public.calculate_monthly_payroll(
  p_employee_id uuid,
  p_month integer,
  p_year integer,
  p_generated_by uuid DEFAULT NULL::uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_profile         RECORD;
  v_start_date      DATE;
  v_end_date        DATE;
  v_days_present    INT := 0;
  v_days_absent     INT := 0;
  v_days_on_leave   INT := 0;
  v_penalty_total   NUMERIC := 0;
  v_daily_rate      NUMERIC;
  v_deduction_abs   NUMERIC;
  v_net_salary      NUMERIC;
  v_rec             RECORD;
  v_minutes_late    INT;
  v_minutes_early   INT;
  v_start_time      TIME;
  v_end_time        TIME;
  v_bracket         INT;
  v_penalty         NUMERIC;
  v_sched           JSONB;
BEGIN
  -- Lấy thông tin nhân viên
  SELECT base_salary, allowance, work_schedule
  INTO v_profile
  FROM public.profiles
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nhân viên không tồn tại';
  END IF;

  v_sched := COALESCE(v_profile.work_schedule, '{}'::JSONB);

  -- Parse giờ vào/tan; mặc định Cty là 08:00 - 17:00
  BEGIN
    v_start_time := (v_sched->>'start_time')::TIME;
  EXCEPTION WHEN OTHERS THEN
    v_start_time := '08:00'::TIME;
  END;

  BEGIN
    v_end_time := (v_sched->>'end_time')::TIME;
  EXCEPTION WHEN OTHERS THEN
    v_end_time := '17:00'::TIME;
  END;

  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

  v_daily_rate := (COALESCE(v_profile.base_salary, 0) + COALESCE(v_profile.allowance, 0)) / 26.0;

  -- 1. XOÁ CÁC PENALTY CŨ ĐỂ TÍNH LẠI
  DELETE FROM public.attendance_penalties
  WHERE attendance_record_id IN (
    SELECT id FROM public.attendance_records
    WHERE employee_id = p_employee_id
      AND work_date >= v_start_date
      AND work_date <= v_end_date
  );

  -- 2. TÍNH TOÁN LẠI
  FOR v_rec IN 
    SELECT * FROM public.attendance_records
    WHERE employee_id = p_employee_id
      AND work_date >= v_start_date
      AND work_date <= v_end_date
  LOOP
    IF v_rec.status IN ('present', 'late', 'early_leave') THEN
      v_days_present := v_days_present + 1;

      -- Đổi timezone của check_in/check_out (đang lưu UTC) sang giờ VN để so sánh với TIME
      IF v_rec.check_in IS NOT NULL THEN
        v_minutes_late := EXTRACT(EPOCH FROM ((v_rec.check_in AT TIME ZONE 'Asia/Ho_Chi_Minh')::TIME - v_start_time))/60;
        IF v_minutes_late > 0 THEN
          v_bracket := CEIL(v_minutes_late / 15.0) * 15;
          v_penalty := (v_bracket / 15) * 25000;
          v_penalty_total := v_penalty_total + v_penalty;
          
          INSERT INTO public.attendance_penalties (attendance_record_id, penalty_type, minutes_diff, bracket, penalty_amount)
          VALUES (v_rec.id, 'late', v_minutes_late, v_bracket, v_penalty);
        END IF;
      END IF;

      IF v_rec.check_out IS NOT NULL THEN
        v_minutes_early := EXTRACT(EPOCH FROM (v_end_time - (v_rec.check_out AT TIME ZONE 'Asia/Ho_Chi_Minh')::TIME))/60;
        IF v_minutes_early > 0 THEN
          v_bracket := CEIL(v_minutes_early / 15.0) * 15;
          v_penalty := (v_bracket / 15) * 25000;
          v_penalty_total := v_penalty_total + v_penalty;

          INSERT INTO public.attendance_penalties (attendance_record_id, penalty_type, minutes_diff, bracket, penalty_amount)
          VALUES (v_rec.id, 'early_leave', v_minutes_early, v_bracket, v_penalty);
        END IF;
      END IF;

    ELSIF v_rec.status = 'absent' THEN
      v_days_absent := v_days_absent + 1;
    ELSIF v_rec.status = 'leave' THEN
      v_days_on_leave := v_days_on_leave + 1;
    END IF;
  END LOOP;

  v_deduction_abs := ROUND(v_days_absent * v_daily_rate);
  v_net_salary := COALESCE(v_profile.base_salary, 0) + COALESCE(v_profile.allowance, 0) - v_deduction_abs - v_penalty_total;

  INSERT INTO public.payroll_records (
    employee_id, month, year, base_salary, allowance,
    working_days_standard, days_present, days_absent, days_on_leave,
    penalty_amount, deduction_absence, net_salary, status, payload, generated_by
  )
  VALUES (
    p_employee_id, p_month, p_year, COALESCE(v_profile.base_salary, 0), COALESCE(v_profile.allowance, 0),
    26, v_days_present, v_days_absent, v_days_on_leave,
    v_penalty_total, v_deduction_abs, GREATEST(v_net_salary, 0), 'draft',
    jsonb_build_object(
      'schedule', v_sched,
      'daily_rate', v_daily_rate
    ),
    p_generated_by
  )
  ON CONFLICT (employee_id, month, year)
  DO UPDATE SET
    base_salary = EXCLUDED.base_salary,
    allowance = EXCLUDED.allowance,
    days_present = EXCLUDED.days_present,
    days_absent = EXCLUDED.days_absent,
    days_on_leave = EXCLUDED.days_on_leave,
    penalty_amount = EXCLUDED.penalty_amount,
    deduction_absence = EXCLUDED.deduction_absence,
    net_salary = EXCLUDED.net_salary,
    payload = EXCLUDED.payload,
    generated_by = EXCLUDED.generated_by,
    updated_at = NOW()
  WHERE public.payroll_records.status = 'draft';

  RETURN jsonb_build_object(
    'success', true,
    'days_present', v_days_present,
    'days_absent',  v_days_absent,
    'days_on_leave', v_days_on_leave,
    'penalty_amount', v_penalty_total,
    'deduction_absence', v_deduction_abs,
    'net_salary',     GREATEST(v_net_salary, 0)
  );
END;
$function$;
