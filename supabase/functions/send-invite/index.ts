import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'http://peoplehub.osteup.io.vn'

interface InvitePayload {
  email: string
  note?: string
  position?: string
  sender_name?: string
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body: InvitePayload = await req.json()
    const { email, note, position, sender_name = 'PeopleHub HR Team' } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
    }

    const applyLink = `${APP_URL}/apply`

    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loi moi Ung tuyen</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #0891B2 100%); padding: 36px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo span { opacity: 0.7; font-weight: 400; font-size: 13px; display: block; margin-top: 4px; }
    .body { padding: 36px 40px; }
    h1 { font-size: 21px; font-weight: 800; color: #0F172A; margin-bottom: 12px; }
    p { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 16px; }
    .note-box { background: #F1F5F9; border-left: 3px solid #4F46E5; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 24px; font-size: 14px; color: #334155; font-style: italic; }
    .btn { display: block; text-align: center; background: #4F46E5; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-size: 16px; font-weight: 700; margin: 24px 0; }
    .link-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #64748B; word-break: break-all; margin-top: 8px; }
    .footer { padding: 20px 40px; border-top: 1px solid #F1F5F9; background: #FAFAFA; text-align: center; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        PeopleHub
        <span>Human Resource Management</span>
      </div>
    </div>
    <div class="body">
      <h1>Ban vua duoc moi ung tuyen!</h1>
      <p>Xin chao,</p>
      <p>
        ${sender_name} tren he thong <strong>PeopleHub HRM</strong> muon moi ban nop ho so ung tuyen
        ${position ? `cho vi tri <strong>${position}</strong>` : 'vao cong ty chung toi'}.
      </p>
      ${note ? `<div class="note-box">"${note}"</div>` : ''}
      <p>Nhan vao nut duoi day de mo trang nop ho so truc tuyen cua chung toi:</p>
      <a href="${applyLink}" class="btn">Nop Ho so Ung tuyen</a>
      <p style="font-size: 13px; color: #94A3B8; margin-top: 16px;">
        Neu nut khong hoat dong, sao chep va dan link nay vao trinh duyet:
      </p>
      <div class="link-box">${applyLink}</div>
    </div>
    <div class="footer">
      PeopleHub HRM &mdash; Email nay duoc gui tu he thong quan tri nhan su.<br>
      Ban nhan duoc email nay vi dia chi email cua ban da duoc dang ky trong he thong tuyen dung.
    </div>
  </div>
</body>
</html>
`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PeopleHub HR <noreply@peoplehub.vn>',
        to: [email],
        subject: `[PeopleHub] Loi moi Ung tuyen${position ? ` — ${position}` : ''}`,
        html: emailHtml,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error('Resend error:', errorData)
      return new Response(JSON.stringify({ error: 'Email send failed', detail: errorData }), { status: 500 })
    }

    const result = await res.json()
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
