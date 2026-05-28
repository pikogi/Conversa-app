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

  const now = new Date();
  let remindersSent = 0;
  let followupsSent = 0;

  // ── 1. Recordatorios: sesiones que empiezan en 55-65 minutos ────────────
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

  const { data: upcoming } = await supabase
    .from("speakeasies")
    .select(`id, title, topic, date, time, meeting_url, level,
      participants ( user_id, profiles ( name, email ) ),
      profiles!facilitator_id ( name, email )`)
    .eq("reminder_sent", false);

  for (const s of upcoming ?? []) {
    const t = new Date(`${s.date}T${s.time}-03:00`);
    if (t < windowStart || t > windowEnd) continue;

    const { dateFormatted, timeFormatted } = formatDateTime(s.date, s.time);
    const recipients = collectRecipients(s);

    for (const [email, name] of recipients) {
      try {
        await sgMail.send({
          from: { email: "hi@repeat.la", name: "Conversa" },
          replyTo: "no-reply@repeat.la",
          to: email,
          subject: `⏰ "${s.title}" empieza en 1 hora`,
          html: buildReminderHtml({ name, title: s.title, topic: s.topic, level: s.level, dateFormatted, timeFormatted, meetingUrl: s.meeting_url }),
        });
        remindersSent++;
      } catch (e) {
        console.error(`Reminder failed for ${email}:`, e);
      }
    }

    await supabase.from("speakeasies").update({ reminder_sent: true }).eq("id", s.id);
  }

  // ── 2. Quedamos de nuevo: sesiones que terminaron hace 75-90 minutos ────
  const followupStart = new Date(now.getTime() - 90 * 60 * 1000);
  const followupEnd = new Date(now.getTime() - 75 * 60 * 1000);

  const { data: ended } = await supabase
    .from("speakeasies")
    .select(`id, title, topic, date, time, meeting_url, level,
      participants ( user_id, profiles ( id, name, email ) ),
      profiles!facilitator_id ( id, name, email )`)
    .eq("follow_up_sent", false);

  for (const _s of ended ?? []) {
    const s = _s as any;
    const t = new Date(`${s.date}T${s.time}-03:00`);
    if (t < followupStart || t > followupEnd) continue;

    const { dateFormatted, timeFormatted } = formatDateTime(s.date, s.time);

    // Collect all user_ids for this speakeasy
    const allUsers: { id: string; name: string; email: string }[] = [];
    if (s.profiles?.id && s.profiles?.email) {
      allUsers.push({ id: s.profiles.id, name: s.profiles.name ?? "", email: s.profiles.email });
    }
    for (const p of s.participants ?? []) {
      if (p.profiles?.id && p.profiles?.email && p.profiles.id !== s.profiles?.id) {
        allUsers.push({ id: p.profiles.id, name: p.profiles.name ?? "", email: p.profiles.email });
      }
    }

    for (const user of allUsers) {
      // Create a unique token for this user
      const { data: req } = await supabase
        .from("repeat_requests")
        .insert({ speakeasy_id: s.id, user_id: user.id })
        .select("token")
        .single();

      if (!req?.token) continue;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://conversa-app-blush.vercel.app"}/api/send-invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            name: user.name,
            title: s.title,
            date: s.date,
            time: s.time,
            meetingUrl: s.meeting_url,
            level: s.level,
            topic: s.topic,
            type: "followup",
            repeatToken: req.token,
          }),
        });
        if (res.ok) followupsSent++;
      } catch (e) {
        console.error(`Follow-up failed for ${user.email}:`, e);
      }
    }

    await supabase.from("speakeasies").update({ follow_up_sent: true }).eq("id", s.id);
  }

  return NextResponse.json({ ok: true, remindersSent, followupsSent });
}

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T${time}-03:00`);
  return {
    dateFormatted: d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }),
    timeFormatted: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function collectRecipients(s: any): Map<string, string> {
  const map = new Map<string, string>();
  if (s.profiles?.email) map.set(s.profiles.email, s.profiles.name ?? "");
  for (const p of s.participants ?? []) {
    if (p.profiles?.email) map.set(p.profiles.email, p.profiles.name ?? "");
  }
  return map;
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
      <p style="margin:0 0 8px;font-size:1.8rem;font-weight:700;color:white;letter-spacing:-0.5px;">Conver<span style="color:#FF6B6B">sa</span></p>
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
      <p style="margin:0;font-size:.8rem;color:#A09CB5;">Conversa — Hello, Stranger. · Grupos de conversación en inglés</p>
    </div>
  </div>
</body>
</html>`;
}
