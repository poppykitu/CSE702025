import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? 're_jgQEtvYj_DXfdo2fzymWZtYWmGX4j4wrB'
const APP_URL = Deno.env.get('APP_URL') ?? 'http://peoplehub.osteup.io.vn'
const FROM_EMAIL = 'PeopleHub HR <peoplehub@osteup.io.vn>'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface OnboardPayload {
  applicationId: string
  hiredById: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const body: OnboardPayload = await req.json()
    const { applicationId, hiredById } = body

    if (!applicationId || !hiredById) {
      return new Response(JSON.stringify({ error: 'Missing applicationId or hiredById' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 1. Fetch application details
    const { data: appData, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !appData) {
      throw new Error(`Application not found: ${appError?.message || 'Unknown'}`)
    }

    if (appData.stage === 'hired') {
       throw new Error('Ứng viên này đã được tuyển rồi.')
    }

    const { candidate_email, candidate_name, position_applied, plan_id } = appData

    // 2. Tự sinh Password ngẫu nhiên
    const rawPass = Math.random().toString(36).slice(-8)
    const securePassword = rawPass.charAt(0).toUpperCase() + rawPass.slice(1) + '@HR'

    // 3. Tạo User trong hệ thống Auth (bằng Admin API)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: candidate_email,
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        full_name: candidate_name
      }
    })

    if (authError) {
      if (authError.message.includes('email') || authError.status === 422 || authError.code === 'user_already_exists') {
         return new Response(JSON.stringify({ error: "Email này đã được đăng ký tài khoản trên hệ thống." }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
         })
      }
      throw new Error(`Auth Error: ${authError.message}`)
    }

    const newAuthUserId = authData.user.id

    // 4. Gọi RPC để map Profile và update ATS pipeline
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('convert_applicant_to_employee', {
      p_application_id: applicationId,
      p_hired_by_id: hiredById,
      p_auth_user_id: newAuthUserId
    })

    if (rpcError) {
      // Rollback Auth Account since profile creation failed!
      await supabaseAdmin.auth.admin.deleteUser(newAuthUserId)
      throw new Error(`Profile Creation Error: ${rpcError.message}`)
    }

    // 5. Check KPI & Đóng Chiến dịch nếu đã đủ người
    if (plan_id) {
       const { count, error: countErr } = await supabaseAdmin
         .from('job_applications')
         .select('*', { count: 'exact', head: true })
         .eq('plan_id', plan_id)
         .eq('stage', 'hired')

       const { data: planData } = await supabaseAdmin
         .from('recruitment_plans')
         .select('kpi_count')
         .eq('id', plan_id)
         .single()
       
       if (!countErr && planData && count >= planData.kpi_count) {
          await supabaseAdmin
           .from('recruitment_plans')
           .update({ status: 'closed', updated_at: new Date().toISOString() })
           .eq('id', plan_id)
       }
    }

    // 6. Gửi Email thông báo bằng Resend
    const baseUrl = APP_URL.replace(/\/$/, '')
    const loginLink = `${baseUrl}/login`

    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Chao mung gia nhap - PeopleHub</title>
  <style>
    body{font-family:sans-serif;background:#F8FAFC;padding:24px}
    .c{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .h{background:linear-gradient(135deg,#4F46E5,#3730A3);padding:36px 40px;text-align:center}
    .lt{color:#fff;font-size:24px;font-weight:900}
    .ls{color:rgba(255,255,255,.9);font-size:14px;margin-top:4px}
    .b{padding:36px 40px;color:#333;}
    .pwd-box{background:#F1F5F9;border:1px dashed #94A3B8;border-radius:8px;padding:16px;margin:20px 0;text-align:center;font-size:18px;font-family:monospace;font-weight:bold;color:#0F172A}
    .btn{display:inline-block;background:#4F46E5;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700}
  </style>
</head>
<body>
  <div class="c">
    <div class="h">
      <div class="lt">PeopleHub</div>
      <div class="ls">Chao mung ban da gia nhap doi ngu!</div>
    </div>
    <div class="b">
      <h2>Chuc mung ung tuyen thanh cong!</h2>
      <p>Xin chao <b>${candidate_name}</b>,</p>
      <p>Chung toi rat vui mung thong bao ban da trung tuyen cho vi tri <b>${position_applied || 'Nhan vien'}</b> tai he thong HR cua cong ty.</p>
      <p>Tai khoan dang nhap vao he thong PeopleHub cua ban da duoc tao. Duoi day la thong tin mat khau mac dinh de dang nhap vao he thong (Hay doi mat khau ngay sau khi dang nhap nhe):</p>
      
      <div class="pwd-box">${securePassword}</div>

      <div style="text-align:center; margin: 28px 0;"><a href="${loginLink}" class="btn">Dang nhap ngay</a></div>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [candidate_email],
        subject: `[PeopleHub] Chao mung ban gia nhap! Thong tin tai khoan`,
        html: emailHtml,
      }),
    })

    const result = await res.json()

    return new Response(JSON.stringify({ success: true, profile: rpcData, auth_id: newAuthUserId, resend_id: result.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
