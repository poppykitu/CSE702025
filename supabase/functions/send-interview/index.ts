import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import dayjs from "npm:dayjs"
import utc from "npm:dayjs/plugin/utc.js"
import timezone from "npm:dayjs/plugin/timezone.js"

dayjs.extend(utc)
dayjs.extend(timezone)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? 're_jgQEtvYj_DXfdo2fzymWZtYWmGX4j4wrB'
const APP_URL = Deno.env.get('APP_URL') ?? 'http://peoplehub.osteup.io.vn'
const FROM_EMAIL = 'PeopleHub HR <peoplehub@osteup.io.vn>'

interface InterviewPayload {
  email: string
  name: string
  position?: string
  time: string
  location: string
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
    const body: InterviewPayload = await req.json()
    const { email, name, position, time, location } = body

    if (!email || !name || !time || !location) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const formattedTime = dayjs(time).tz('Asia/Ho_Chi_Minh').format('HH:mm - DD/MM/YYYY')

    const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lich Phong van - PeopleHub</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F8FAFC;padding:24px}
    .c{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .h{background:linear-gradient(135deg,#3B82F6,#2563EB);padding:36px 40px;text-align:center}
    .lt{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}
    .ls{color:rgba(255,255,255,.9);font-size:14px;margin-top:4px}
    .b{padding:36px 40px}
    h1{font-size:20px;font-weight:800;color:#0F172A;margin-bottom:16px}
    p{font-size:15px;color:#475569;line-height:1.7;margin-bottom:14px}
    .hi{font-weight:700;color:#0F172A}
    .info-box{background:#F1F5F9;border-left:4px solid #3B82F6;border-radius:0 8px 8px 0;padding:20px;margin:24px 0}
    .row{margin-bottom:12px;font-size:15px}
    .row:last-child{margin-bottom:0}
    .label{color:#64748B;display:inline-block;width:120px;font-weight:600}
    .val{color:#0F172A;font-weight:700}
    .f{padding:20px 40px 24px;text-align:center;font-size:12px;color:#94A3B8;border-top:1px solid #F1F5F9;background:#FAFAFA;line-height:1.7}
  </style>
</head>
<body>
  <div class="c">
    <div class="h">
      <div class="lt">PeopleHub</div>
      <div class="ls">Thong bao Lich Phong van</div>
    </div>
    <div class="b">
      <h1>Thu Mời Phỏng Vấn</h1>
      <p>Xin chao <span class="hi">${name}</span>,</p>
      <p>Chung toi rat an tuong voi ho so ung tuyen cua ban cho vi tri <span class="hi">${position || 'Nhan vien'}</span>. Cong ty tran trong moi ban den tham du buoi phong van truc tiep de trao doi chi tiet hon ve cong viec.</p>
      
      <div class="info-box">
        <div class="row">
          <span class="label">Thoi gian:</span>
          <span class="val">${formattedTime}</span>
        </div>
        <div class="row">
          <span class="label">Dia diem:</span>
          <span class="val">${location}</span>
        </div>
      </div>

      <p>Neu ban co bat ky cau hoi nao hoac can doi lich, vui long phan hoi lai email nay.</p>
      <p>Chuc ban luon tran day nang luong va the hien that tot tai buoi phong van sap toi!</p>
    </div>
    <div class="f">
      <strong>PeopleHub HRM HR Team</strong><br>
      Email nay duoc gui he thong quan tri nhan su dong.
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
        subject: `[PeopleHub] Thu moi phong van - Vi tri ${position || 'Nhan vien'}`,
        html: emailHtml,
      }),
    })

    const result = await res.json()
    console.log(`send-interview: ${res.status} -> ${email}`, JSON.stringify(result))

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
