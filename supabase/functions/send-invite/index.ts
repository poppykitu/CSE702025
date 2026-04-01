import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? 're_jgQEtvYj_DXfdo2fzymWZtYWmGX4j4wrB'
const APP_URL = Deno.env.get('APP_URL') ?? 'http://peoplehub.osteup.io.vn'
const FROM_EMAIL = 'PeopleHub HR <peoplehub@osteup.io.vn>'

interface InvitePayload {
  email: string
  note?: string
  position?: string
  sender_name?: string
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
    const body: InvitePayload = await req.json()
    const { email, note, position, sender_name = 'PeopleHub HR Team' } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const applyLink = `${APP_URL}/apply`

    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loi moi Ung tuyen - PeopleHub</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F8FAFC;padding:24px}
    .c{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .h{background:linear-gradient(135deg,#4F46E5,#0891B2);padding:36px 40px;text-align:center}
    .lt{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}
    .ls{color:rgba(255,255,255,.7);font-size:12px;margin-top:4px}
    .b{padding:36px 40px}
    h1{font-size:20px;font-weight:800;color:#0F172A;margin-bottom:16px}
    p{font-size:15px;color:#475569;line-height:1.7;margin-bottom:14px}
    .hi{font-weight:700;color:#0F172A}
    .nb{background:#F1F5F9;border-left:3px solid #4F46E5;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0 24px;font-size:14px;color:#334155;font-style:italic;line-height:1.6}
    .bw{text-align:center;margin:28px 0}
    .btn{display:inline-block;background:linear-gradient(135deg,#4F46E5,#0891B2);color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700}
    .lk{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:12px;color:#64748B;word-break:break-all;font-family:monospace;margin-top:8px}
    .f{padding:20px 40px 24px;text-align:center;font-size:12px;color:#94A3B8;border-top:1px solid #F1F5F9;background:#FAFAFA;line-height:1.7}
  </style>
</head>
<body>
  <div class="c">
    <div class="h">
      <div class="lt">PeopleHub</div>
      <div class="ls">Human Resource Management System</div>
    </div>
    <div class="b">
      <h1>Ban duoc moi ung tuyen tai PeopleHub!</h1>
      <p>Xin chao,</p>
      <p><span class="hi">${sender_name}</span> tu he thong <span class="hi">PeopleHub HRM</span> muon moi ban nop ho so ung tuyen ${position ? `cho vi tri <span class="hi">${position}</span>` : 'vao cong ty chung toi'}.</p>
      ${note ? `<div class="nb">&ldquo;${note}&rdquo;</div>` : ''}
      <p>Nhan vao nut duoi day de mo trang nop ho so ung tuyen:</p>
      <div class="bw"><a href="${applyLink}" class="btn">Nop Ho so Ung tuyen Ngay</a></div>
      <p style="font-size:13px;color:#94A3B8">Neu nut khong hoat dong, sao chep link nay vao trinh duyet:</p>
      <div class="lk">${applyLink}</div>
    </div>
    <div class="f">
      <strong>PeopleHub HRM</strong> &mdash; peoplehub.osteup.io.vn<br>
      Email nay duoc gui tu he thong quan tri nhan su tu dong.
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
        subject: `[PeopleHub] Loi moi Ung tuyen${position ? ` — ${position}` : ''}`,
        html: emailHtml,
      }),
    })

    const result = await res.json()
    console.log(`send-invite: ${res.status} -> ${email}`, JSON.stringify(result))

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
