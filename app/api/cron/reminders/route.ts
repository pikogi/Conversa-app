import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import { NextRequest, NextResponse } from "next/server";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Window: sessions starting between 55 and 65 minutes from now
  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

  const { data: speakeasies, error } = await supabase
    .from("speakeasies")
    .select(`
      id, title, topic, date, time, meeting_url, level,
      participants ( user_id, profiles ( name, email ) ),
      profiles!facilitator_id ( name, email )
    `)
    .eq("reminder_sent", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Times are stored in Argentina time (UTC-3)
  const toSend = (speakeasies ?? []).filter((s: any) => {
    const t = new Date(`${s.date}T${s.time}-03:00`);
    return t >= windowStart && t <= windowEnd;
  });

  let sent = 0;

  for (const s of toSend) {
    const sessionTime = new Date(`${s.date}T${s.time}-03:00`);
    const dateFormatted = sessionTime.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const timeFormatted = sessionTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    // Deduplicate recipients by email
    const recipients = new Map<string, string>();
    if (s.profiles?.email) recipients.set(s.profiles.email, s.profiles.name ?? "");
    for (const p of s.participants ?? []) {
      if (p.profiles?.email) recipients.set(p.profiles.email, p.profiles.name ?? "");
    }

    for (const [email, name] of recipients) {
      try {
        await sgMail.send({
          from: { email: "hi@repeat.la", name: "Conversa" },
          replyTo: "no-reply@repeat.la",
          to: email,
          subject: `⏰ "${s.title}" empieza en 1 hora`,
          html: buildReminderHtml({ name, title: s.title, topic: s.topic, level: s.level, dateFormatted, timeFormatted, meetingUrl: s.meeting_url }),
        });
        sent++;
      } catch (e) {
        console.error(`Failed to send reminder to ${email}:`, e);
      }
    }

    await supabase.from("speakeasies").update({ reminder_sent: true }).eq("id", s.id);
  }

  return NextResponse.json({ ok: true, sent, checked: toSend.length });
}

function buildReminderHtml({ name, title, topic, level, dateFormatted, timeFormatted, meetingUrl }: {
  name: string; title: string; topic: string; level: string;
  dateFormatted: string; timeFormatted: string; meetingUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(132,94,194,.12);">

    <div style="background:linear-gradient(135deg,#845EC2,#a97fd4);padding:36px 40px 32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:1.8rem;font-weight:700;color:white;letter-spacing:-0.5px;">
        Conver<span style="color:#FF6B6B">sa</span>
      </p>
      <p style="margin:0;color:rgba(255,255,255,.8);font-size:.9rem;">⏰ Tu clase empieza en 1 hora</p>
    </div>

    <div style="padding:36px 40px;">
      <p style="margin:0 0 24px;font-size:1rem;color:#4A4560;line-height:1.6;">
        Hola${name ? ` <strong>${name}</strong>` : ""}! En <strong>1 hora</strong> empieza tu Speakeasy:
      </p>

      <div style="background:#FFFBF5;border:1.5px solid rgba(132,94,194,.15);border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:1.2rem;font-weight:700;color:#1E1B2E;">${title}</p>
        <p style="margin:0 0 16px;font-size:.85rem;color:#845EC2;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${topic} · ${level}</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <span style="font-size:.9rem;color:#4A4560;">📅 ${dateFormatted}</span>
          <span style="font-size:.9rem;color:#4A4560;">🕐 ${timeFormatted}</span>
        </div>
      </div>

      <a href="${meetingUrl}" style="display:block;background:linear-gradient(135deg,#845EC2,#6d4aab);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:50px;font-weight:700;font-size:.95rem;margin-bottom:24px;">
        Entrar al Speakeasy →
      </a>

      <p style="margin:0;font-size:.82rem;color:#A09CB5;line-height:1.6;">
        ¡Nos vemos ahí! Si no podés asistir, avisanos desde la app para liberar el lugar.
      </p>
    </div>

    <div style="background:#F7F4FC;padding:20px 40px;text-align:center;border-top:1px solid rgba(132,94,194,.1);">
      <p style="margin:0;font-size:.8rem;color:#A09CB5;">
        Conversa — Hello, Stranger. · Grupos de conversación en inglés
      </p>
    </div>

  </div>
</body>
</html>`;
}
