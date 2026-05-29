import sgMail from "@sendgrid/mail";
import { NextRequest, NextResponse } from "next/server";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  const { to, name, title, date, time, meetingUrl, level, topic, type = "join", repeatToken } = await req.json();

  if (!to || !title) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const dateFormatted = new Date(`${date}T${time}`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const timeFormatted = new Date(`${date}T${time}`).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });

  const calStart = new Date(`${date}T${time}-03:00`);
  const calEnd = new Date(calStart.getTime() + 60 * 60 * 1000);
  const fmtCal = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmtCal(calStart)}/${fmtCal(calEnd)}&details=${encodeURIComponent(`Speakeasy de inglés en Conversa\n\nLink: ${meetingUrl ?? ""}`)}&location=${encodeURIComponent(meetingUrl ?? "")}`;
  const icsContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Conversa//ES",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${fmtCal(calStart)}`,
    `DTEND:${fmtCal(calEnd)}`,
    `DESCRIPTION:Speakeasy de inglés en Conversa\\nLink: ${meetingUrl ?? ""}`,
    `LOCATION:${meetingUrl ?? ""}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");

  const isCreated = type === "created";
  const isFollowup = type === "followup";

  const subject = isCreated
    ? `¡Tu Speakeasy "${title}" ya está publicado! 🚀`
    : isFollowup
    ? `¿Cómo fue "${title}"? ¿Repetimos? 🔁`
    : `¡Te anotaste a "${title}"! 🎉`;

  const headerSubtitle = isCreated
    ? "¡Tu grupo ya está en línea!"
    : isFollowup
    ? "¿Cómo estuvo la sesión?"
    : "¡Ya sos parte del grupo!";

  const bodyIntro = isCreated
    ? `Hola${name ? ` <strong>${name}</strong>` : ""}! Tu Speakeasy quedó publicado y los participantes ya pueden anotarse.`
    : isFollowup
    ? `Hola${name ? ` <strong>${name}</strong>` : ""}! Esperamos que haya sido una buena sesión. ¿Te gustaría repetir con este grupo?`
    : `Hola${name ? ` <strong>${name}</strong>` : ""}! Te confirmamos que quedaste anotado/a en:`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://conversa-app-blush.vercel.app";
  const buttonText = isCreated ? "Ver mi Speakeasy →" : isFollowup ? "¡Sí, quiero repetir! 🔁" : "Entrar al Speakeasy →";
  const buttonHref = isFollowup && repeatToken
    ? `${appUrl}/api/quedamos?token=${repeatToken}`
    : meetingUrl;

  const footerNote = isCreated
    ? "Guardá este mail — tiene el link de tu clase. Te avisamos cuando alguien se anote."
    : isFollowup
    ? "Si no podés repetir, no hay problema — el cupo se libera para otra persona."
    : "Guardá este mail — tiene tu link de acceso. Si no podés asistir, avisanos desde la app para liberar el lugar.";

  const attachments = !isFollowup ? [{
    content: Buffer.from(icsContent).toString("base64"),
    filename: `${title.replace(/\s+/g, "-")}.ics`,
    type: "text/calendar",
    disposition: "attachment" as const,
  }] : undefined;

  try {
    await sgMail.send({
      from: { email: "hi@repeat.la", name: "Conversa" },
      replyTo: "no-reply@repeat.la",
      to,
      subject,
      ...(attachments ? { attachments } : {}),
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(132,94,194,.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#845EC2,#a97fd4);padding:36px 40px 32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:1.8rem;font-weight:700;color:white;letter-spacing:-0.5px;">
        Conver<span style="color:#FF6B6B">sa</span>
      </p>
      <p style="margin:0;color:rgba(255,255,255,.8);font-size:.9rem;">${headerSubtitle}</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="margin:0 0 24px;font-size:1rem;color:#4A4560;line-height:1.6;">
        ${bodyIntro}
      </p>

      <!-- Speakeasy info -->
      <div style="background:#FFFBF5;border:1.5px solid rgba(132,94,194,.15);border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:1.2rem;font-weight:700;color:#1E1B2E;">${title}</p>
        <p style="margin:0 0 16px;font-size:.85rem;color:#845EC2;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${topic} · ${level}</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <span style="font-size:.9rem;color:#4A4560;">📅 ${dateFormatted}</span>
          <span style="font-size:.9rem;color:#4A4560;">🕐 ${timeFormatted}</span>
        </div>
      </div>

      <!-- CTA -->
      ${!isFollowup ? `<p style="margin:0 0 12px;font-size:.9rem;color:#4A4560;">Tu link para entrar a la clase:</p>` : ""}
      <a href="${buttonHref}" style="display:block;background:linear-gradient(135deg,#845EC2,#6d4aab);color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:50px;font-weight:700;font-size:.95rem;margin-bottom:24px;">
        ${buttonText}
      </a>

      ${!isFollowup ? `
      <!-- Calendar -->
      <div style="background:#F7F4FC;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:.82rem;font-weight:700;color:#4A4560;">📅 Agregá la sesión a tu calendario</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="${googleCalUrl}" style="display:inline-block;padding:8px 16px;border-radius:50px;border:1.5px solid rgba(132,94,194,.3);background:white;color:#845EC2;text-decoration:none;font-size:.8rem;font-weight:700;">
            Google Calendar
          </a>
          <span style="display:inline-block;padding:8px 16px;border-radius:50px;border:1.5px solid rgba(132,94,194,.15);background:white;color:#8E8AA0;font-size:.8rem;font-weight:700;">
            iCal / Outlook — adjunto ↓
          </span>
        </div>
      </div>` : ""}

      <p style="margin:0;font-size:.82rem;color:#A09CB5;line-height:1.6;">
        ${footerNote}
      </p>
    </div>

    <!-- Footer -->
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
