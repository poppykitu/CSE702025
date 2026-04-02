import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? 're_jgQEtvYj_DXfdo2fzymWZtYWmGX4j4wrB';
const FROM_EMAIL = 'PeopleHub HRM <peoplehub@osteup.io.vn>';

function generateStrongPassword(length = 12): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  
  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  
  for (let i = 4; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }
  
  return password.sort(() => Math.random() - 0.5).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Xác thực người gọi có quyền admin hoặc hr không
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser(token);
      if (callerError || !caller) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Token không hợp lệ' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', caller.id)
        .single();
      if (!callerProfile || !['admin', 'hr'].includes(callerProfile.role)) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Bạn không có quyền thực hiện thao tác này' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { email, full_name } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Vui lòng cung cấp email và họ tên đầy đủ.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPassword = generateStrongPassword(12);
    console.log(`invite-hr: Creating HR account for ${email}`);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: rawPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name }
    });

    if (authError) {
      console.error('createUser error:', authError.message);
      return new Response(
        JSON.stringify({ error: `Không thể tạo tài khoản: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = authData.user;
    console.log(`invite-hr: User created ${user.id}`);

    // Chờ trigger tạo profile
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name,
        role: 'hr',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError.message);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return new Response(
        JSON.stringify({ error: `Lỗi gán quyền HR: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gửi email qua Resend
    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8FAFC;padding:24px;margin:0}
    .c{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .h{background:linear-gradient(135deg,#4F46E5,#0891B2);padding:36px 40px;text-align:center}
    .lt{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}
    .ls{color:rgba(255,255,255,.7);font-size:12px;margin-top:4px}
    .b{padding:36px 40px}
    h1{font-size:20px;font-weight:800;color:#0F172A;margin-bottom:16px}
    p{font-size:15px;color:#475569;line-height:1.7;margin-bottom:14px}
    .creds{background:#EEF2FF;border-left:4px solid #4F46E5;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0 24px}
    .creds p{margin:6px 0;font-size:14px;color:#1e1b4b}
    .pw{font-family:monospace;font-size:20px;font-weight:900;color:#4F46E5;letter-spacing:2px}
    .warn{background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;color:#dc2626;font-size:13px}
    .f{padding:20px 40px;text-align:center;font-size:12px;color:#94A3B8;border-top:1px solid #F1F5F9}
  </style>
</head>
<body>
  <div class="c">
    <div class="h">
      <div class="lt">PeopleHub</div>
      <div class="ls">Human Resource Management System</div>
    </div>
    <div class="b">
      <h1>🎉 Chào mừng ${full_name}!</h1>
      <p>Bạn đã được cấp quyền <strong>Quản Trị Viên Nhân Sự (HR)</strong> trên hệ thống PeopleHub HRM.</p>
      <p>Vui lòng đăng nhập bằng thông tin dưới đây:</p>
      <div class="creds">
        <p>📧 <strong>Email:</strong> ${email}</p>
        <p>🔑 <strong>Mật khẩu tạm thời:</strong></p>
        <p><span class="pw">${rawPassword}</span></p>
      </div>
      <div class="warn">
        ⚠️ <strong>Quan trọng:</strong> Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
      </div>
    </div>
    <div class="f">PeopleHub HRM — peoplehub.osteup.io.vn<br>Email này được gửi tự động từ hệ thống.</div>
  </div>
</body>
</html>`;

    console.log(`invite-hr: Sending email via Resend to ${email}...`);
    const resRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: '[PeopleHub] Tài khoản HR của bạn đã sẵn sàng 🚀',
        html: emailHtml
      })
    });

    const resResult = await resRes.json();
    console.log(`invite-hr: Resend ${resRes.status}`, JSON.stringify(resResult));

    return new Response(
      JSON.stringify({ 
        success: true,
        email_sent: resRes.ok,
        message: resRes.ok 
          ? 'Đã tạo tài khoản HR và gửi email thành công.' 
          : `Tài khoản đã tạo nhưng email gửi thất bại: ${JSON.stringify(resResult)}`,
        user_id: user.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Unexpected error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
