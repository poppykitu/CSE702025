import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? 're_jgQEtvYj_DXfdo2fzymWZtYWmGX4j4wrB'
const APP_URL = Deno.env.get('APP_URL') ?? 'http://peoplehub.osteup.io.vn'
const FROM_EMAIL = 'PeopleHub HR <peoplehub@osteup.io.vn>'

interface HiredPayload {
  email: string
  name: string
  password?: string
  position?: string
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
    const body: HiredPayload = await req.json()
    const { email, name, password, position } = body

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const baseUrl = APP_URL.replace(/\/$/, '')
    const loginLink = `${baseUrl}/login`

    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chao mung gia nhap - PeopleHub</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F8FAFC;padding:24px}
    .c{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .h{background:linear-gradient(135deg,#10B981,#059669);padding:36px 40px;text-align:center}
    .lt{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}
    .ls{color:rgba(255,255,255,.9);font-size:14px;margin-top:4px}
    .b{padding:36px 40px}
    h1{font-size:20px;font-weight:800;color:#0F172A;margin-bottom:16px}
    p{font-size:15px;color:#475569;line-height:1.7;margin-bottom:14px}
    .hi{font-weight:700;color:#0F172A}
    .pwd-box{background:#F1F5F9;border:1px dashed #94A3B8;border-radius:8px;padding:16px;margin:20px 0;text-align:center;font-size:18px;font-family:monospace;letter-spacing:2px;font-weight:bold;color:#0F172A}
    .bw{text-align:center;margin:28px 0}
    .btn{display:inline-block;background:linear-gradient(135deg,#10B981,#059669);color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700}
    .lk{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:12px;color:#64748B;word-break:break-all;font-family:monospace;margin-top:8px}
    .f{padding:20px 40px 24px;text-align:center;font-size:12px;color:#94A3B8;border-top:1px solid #F1F5F9;background:#FAFAFA;line-height:1.7}
  </style>
</head>
<body>
  <div class="c">
    <div class="h">
      <div class="lt">PeopleHub</div>
      <div class="ls">Chao mung ban da gia nhap doi ngu!</div>
    </div>
    <div class="b">
      <h1>Chuc mung ung tuyen thanh cong!</h1>
      <p>Xin chao <span class="hi">${name}</span>,</p>
      <p>Chung toi rat vui mung thong bao ban da trung tuyen cho vi tri <span class="hi">${position || 'Nhan vien'}</span> tai he thong HR cua cong ty.</p>
      <p>Tai khoan dang nhap vao he thong PeopleHub cua ban da duoc tao. Duoi day la thong tin mat khau mac dinh de dang nhap vao he thong (Hay doi mat khau ngay sau khi dang nhap nhe):</p>
      
      <div class="pwd-box">${password || '12345678'}</div>

      <p>Nhan vao nut duoi day de tien hanh dang nhap vao he thong:</p>
      <div class="bw"><a href="${loginLink}" class="btn">Dang nhap ngay</a></div>
      <p style="font-size:13px;color:#94A3B8">Neu link tren bi loi, hay sao chep duong link duoi day vao trinh duyet cua ban:</p>
      <div class="lk">${loginLink}</div>
    </div>
    <div class="f">
      <strong>PeopleHub HRM</strong> &mdash; peoplehub.osteup.io.vn<br>
      Email nay duoc gui tu he thong quan tri nhan su.
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
        to: [email],
        subject: `[PeopleHub] Chao mung ban gia nhap! Thong tin tai khoan`,
        html: emailHtml,
      }),
    })

    const result = await res.json()
    console.log(`send-hired: ${res.status} -> ${email}`, JSON.stringify(result))

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Resend API failed', detail: result }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Edge Function error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
