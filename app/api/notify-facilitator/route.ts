import sgMail from "@sendgrid/mail";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const { speakeasy_id, participant_name } = await req.json();
  if (!speakeasy_id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Fetch speakeasy + facilitator profile
  const { data: speakeasy } = await supabase
    .from("speakeasies")
    .select("title, date, time, max_participants, facilitator_id, participants(user_id)")
    .eq("id", speakeasy_id)
    .single();

  if (!speakeasy) return NextResponse.json({ error: "Speakeasy no encontrado" }, { status: 404 });

  // Get facilitator email from auth.users (requires service role)
  const { data: { user } } = await supabase.auth.admin.getUserById(speakeasy.facilitator_id);
  const facilitatorEmail = user?.email;
  if (!facilitatorEmail) return NextResponse.json({ ok: true }); // no email, skip silently

  const participantCount = (speakeasy.participants as any[])?.length ?? 0;
  const dateFormatted = new Date(`${speakeasy.date}T${speakeasy.time}`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const timeFormatted = new Date(`${speakeasy.date}T${speakeasy.time}`).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://conversa-app-blush.vercel.app";
  const isFull = participantCount >= speakeasy.max_participants;

  try {
    await sgMail.send({
      from: { email: "hi@repeat.la", name: "Conversa" },
      replyTo: "no-reply@repeat.la",
      to: facilitatorEmail,
      subject: `${participant_name} se unió a "${speakeasy.title}" 🎉`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(132,94,194,.12);">

    <div style="background:linear-gradient(135deg,#845EC2,#a97fd4);padding:36px 40px 32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:1.8rem;font-weight:700;color:white;letter-spacing:-0.5px;">
        Conver<span style="color:#FF6B6B">sa</span>
      </p>
      <p style="margin:0;color:rgba(255,255,255,.8);font-size:.9rem;">¡Alguien se unió a tu grupo!</p>
    </div>

    <div style="padding:36px 40px;">
      <p style="margin:0 0 24px;font-size:1rem;color:#4A4560;line-height:1.6;">
        <strong>${participant_name}</strong> se anotó a tu Speakeasy.
      </p>

      <div style="background:#FFFBF5;border:1.5px solid rgba(132,94,194,.15);border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:1.2rem;font-weight:700;color:#1E1B2E;">${speakeasy.title}</p>
        <p style="margin:0 0 12px;font-size:.9rem;color:#4A4560;">📅 ${dateFormatted} · 🕐 ${timeFormatted}</p>
        <p style="margin:0;font-size:1rem;font-weight:700;color:${isFull ? "#FF6B6B" : "#06D6A0"};">
          ${participantCount}/${speakeasy.max_participants} anotados${isFull ? " · ¡Grupo completo!" : ""}
        </p>
      </div>

      <a href="${appUrl}/speakeasies/${speakeasy_id}" style="display:block;background:linear-gradient(135deg,#845EC2,#6d4aab);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:50px;font-weight:700;font-size:.95rem;margin-bottom:24px;">
        Ver mi Speakeasy →
      </a>

      <p style="margin:0;font-size:.82rem;color:#A09CB5;line-height:1.6;">
        Te avisamos cada vez que alguien se anote o salga de tu grupo.
      </p>
    </div>

    <div style="background:#F7F4FC;padding:20px 40px;text-align:center;border-top:1px solid rgba(132,94,194,.1);">
      <p style="margin:0;font-size:.8rem;color:#A09CB5;">
        Conversa — Hello, Stranger. · Grupos de conversación en inglés
      </p>
    </div>

  </div>
</body>
</html>`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
