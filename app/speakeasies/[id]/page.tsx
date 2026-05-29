"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { TOPIC_META, LEVEL_META, ICE_BREAKERS } from "@/lib/mock-data";
import { useProfile, facilitatorLabel } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

type Participant = {
  user_id: string;
  profiles: { id: string; name: string; avatar: string; city: string | null; bio: string | null; english_level: string | null } | null;
};

type Speakeasy = {
  id: string;
  title: string;
  topic: string;
  description: string;
  date: string;
  time: string;
  meeting_url: string;
  facilitator_id: string;
  level: string;
  max_participants: number;
  participants: Participant[];
  profiles: { id: string; name: string; avatar: string; city: string | null; bio: string | null } | null;
};

export default function SpeakeasyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const wantsRepeat = searchParams.get("repito") === "1";
  const fromCalendar = searchParams.get("calendar") === "1";
  const { profile } = useProfile();

  const [speakeasy, setSpeakeasy] = useState<Speakeasy | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [iceIndex, setIceIndex] = useState(0);
  const [iceTab, setIceTab] = useState<"warmup"|"wouldYouRather"|"hotTake"|"story"|"hypothetical">("warmup");
  const [copied, setCopied] = useState(false);
  const [userReview, setUserReview] = useState<{ rating: number; comment: string } | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [calendarPrompt, setCalendarPrompt] = useState(fromCalendar);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("speakeasies")
      .select(`
        id, title, topic, description, date, time, meeting_url,
        facilitator_id, level, max_participants,
        participants ( user_id, profiles ( id, name, avatar, city, bio, english_level ) ),
        profiles!facilitator_id ( id, name, avatar, city, bio )
      `)
      .eq("id", id)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setNotFound(true); setPageLoading(false); return; }
        setSpeakeasy(data as unknown as Speakeasy);
        if (profile?.id) {
          const { data: rev } = await supabase
            .from("reviews").select("rating, comment").eq("speakeasy_id", id).eq("reviewer_id", profile.id).single();
          if (rev) { setUserReview(rev); setReviewSaved(true); }
        }
        setPageLoading(false);
      });
  }, [id]);

  const handleJoin = async () => {
    if (!profile || !speakeasy) return;
    setJoining(true);
    const supabase = createClient();
    await supabase.from("participants").insert({ speakeasy_id: speakeasy.id, user_id: profile.id });

    // Enviar email de confirmación
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          name: profile.name,
          title: speakeasy.title,
          date: speakeasy.date,
          time: speakeasy.time,
          meetingUrl: speakeasy.meeting_url,
          level: speakeasy.level,
          topic: speakeasy.topic,
          type: "join",
        }),
      });
      if (!res.ok) console.error("Error enviando email de join:", await res.text());
    }

    // Refetch
    const { data } = await supabase
      .from("speakeasies")
      .select(`id, title, topic, description, date, time, meeting_url, facilitator_id, level, max_participants, participants ( user_id, profiles ( id, name, avatar, city, bio, english_level ) ), profiles!facilitator_id ( id, name, avatar, city, bio )`)
      .eq("id", id)
      .single();
    if (data) setSpeakeasy(data as unknown as Speakeasy);
    setCalendarPrompt(true);
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!profile || !speakeasy) return;
    setLeaving(true);
    const supabase = createClient();
    await supabase.from("participants").delete().eq("speakeasy_id", speakeasy.id).eq("user_id", profile.id);
    const { data } = await supabase
      .from("speakeasies")
      .select(`id, title, topic, description, date, time, meeting_url, facilitator_id, level, max_participants, participants ( user_id, profiles ( id, name, avatar, city, bio, english_level ) ), profiles!facilitator_id ( id, name, avatar, city, bio )`)
      .eq("id", id)
      .single();
    if (data) setSpeakeasy(data as unknown as Speakeasy);
    setLeaving(false);
  };

  if (pageLoading) return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div style={{ width: 32, height: 32, border: "3px solid rgba(132,94,194,.2)", borderTopColor: "#845EC2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );

  if (notFound || !speakeasy) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <p style={{ fontSize: "3.5rem", marginBottom: 16 }}>😕</p>
        <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 600, color: "#4A4560", marginBottom: 16 }}>Speakeasy no encontrado</p>
        <Link href="/speakeasies" style={{ color: "#845EC2", fontWeight: 700, fontSize: ".9rem" }}>← Volver</Link>
      </div>
    </div>
  );

  const topic = TOPIC_META[speakeasy.topic] ?? TOPIC_META["viajes"];
  const level = LEVEL_META[speakeasy.level as keyof typeof LEVEL_META] ?? LEVEL_META["intermedio"];
  const facilitator = speakeasy.profiles;
  const participants = speakeasy.participants ?? [];
  const spots = speakeasy.max_participants - participants.length;
  const isFull = spots === 0;
  const isJoined = !!profile && participants.some((p) => p.user_id === profile.id);
  const isFacilitator = !!profile && speakeasy.facilitator_id === profile.id;

  const date = new Date(`${speakeasy.date}T${speakeasy.time}`);
  const dateStr = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const calStart = new Date(`${speakeasy.date}T${speakeasy.time}-03:00`);
  const calEnd = new Date(calStart.getTime() + 60 * 60 * 1000);
  const fmtCal = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const googleCalUrl = (() => {
    const u = new URL("https://calendar.google.com/calendar/render");
    u.searchParams.set("action", "TEMPLATE");
    u.searchParams.set("text", speakeasy.title);
    u.searchParams.set("dates", `${fmtCal(calStart)}/${fmtCal(calEnd)}`);
    u.searchParams.set("details", `Speakeasy de inglés en Conversa\n\n${speakeasy.description ?? ""}\n\nLink: ${speakeasy.meeting_url ?? ""}`);
    u.searchParams.set("location", speakeasy.meeting_url ?? "");
    return u.toString();
  })();
  const downloadICS = () => {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Conversa//ES",
      "BEGIN:VEVENT",
      `SUMMARY:${speakeasy.title}`,
      `DTSTART:${fmtCal(calStart)}`,
      `DTEND:${fmtCal(calEnd)}`,
      `DESCRIPTION:Speakeasy de inglés en Conversa\\n${speakeasy.description ?? ""}\\nLink: ${speakeasy.meeting_url ?? ""}`,
      `LOCATION:${speakeasy.meeting_url ?? ""}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `${speakeasy.title.replace(/\s+/g, "-")}.ics`;
    a.click();
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {wantsRepeat && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: "rgba(132,94,194,.08)", border: "1.5px solid rgba(132,94,194,.2)" }}>
            <span style={{ fontSize: "1.4rem" }}>🔁</span>
            <div>
              <p className="text-sm font-bold" style={{ color: "#845EC2" }}>¡Gracias por confirmar!</p>
              <p className="text-xs" style={{ color: "#4A4560" }}>Le avisamos al grupo que querés repetir.</p>
            </div>
          </div>
        )}

        {calendarPrompt && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.2)", boxShadow: "0 4px 20px rgba(132,94,194,.1)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: "#1E1B2E" }}>📅 ¿Lo agregás a tu calendario?</p>
                <p className="text-xs mt-0.5" style={{ color: "#8E8AA0" }}>Para no olvidarte de la sesión</p>
              </div>
              <button onClick={() => setCalendarPrompt(false)} style={{ color: "#C0BCCC", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <CalendarButtons googleUrl={googleCalUrl} onICS={downloadICS} />
            </div>
          </div>
        )}

        <Link href="/speakeasies" className="inline-flex items-center gap-1 text-sm font-bold mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "#845EC2" }}>
          ← Volver a Speakeasies
        </Link>

        <div className="rounded-3xl p-6 sm:p-8 mb-6" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 4px 32px rgba(132,94,194,.1)" }}>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: topic.bg, color: topic.color }}>
              {topic.emoji} {topic.label}
            </span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: level.bg, color: level.color }}>
              {level.label}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
            {speakeasy.title}
          </h1>
          <p className="text-base leading-relaxed mb-6" style={{ color: "#4A4560" }}>
            {speakeasy.description}
          </p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { icon: "📅", label: "Fecha", value: dateStr },
              { icon: "🕐", label: "Hora", value: timeStr },
              { icon: "👥", label: "Formato", value: `Máximo ${speakeasy.max_participants} personas` },
              { icon: "🌐", label: "Modalidad", value: "Online (Google Meet)" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid rgba(132,94,194,.08)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#8E8AA0" }}>{item.icon} {item.label}</p>
                <p className="text-sm font-bold" style={{ color: "#1E1B2E" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Facilitador */}
          {facilitator && (
            <Link href={`/perfil/${speakeasy.facilitator_id}`}
              className="flex items-center gap-3 p-4 rounded-2xl mb-6 hover:opacity-90 transition-opacity"
              style={{ background: "rgba(132,94,194,.06)", border: "1px solid rgba(132,94,194,.1)", textDecoration: "none" }}>
              <Avatar avatar={facilitator.avatar} size={44} gradient="linear-gradient(135deg, #845EC2, #C8A4D4)" />
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: "#8E8AA0" }}>{facilitatorLabel((facilitator as any)?.gender)} · ver perfil →</p>
                <p className="text-sm font-bold" style={{ color: "#1E1B2E" }}>
                  {facilitator.name}{facilitator.city ? ` · ${facilitator.city}` : ""}
                </p>
                {facilitator.bio && <p className="text-xs mt-0.5" style={{ color: "#4A4560" }}>{facilitator.bio}</p>}
              </div>
            </Link>
          )}

          {/* Participantes */}
          <div className="mb-6">
            <p className="text-sm font-bold mb-3" style={{ color: "#1E1B2E" }}>
              Participantes ({participants.length}/{speakeasy.max_participants})
            </p>
            <div className="flex gap-3 flex-wrap">
              {participants.map((pt) => pt.profiles && (
                <Link key={pt.user_id} href={`/perfil/${pt.user_id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:opacity-80 transition-opacity"
                  style={{ background: "var(--bg)", border: "1px solid rgba(132,94,194,.1)", textDecoration: "none" }}>
                  <Avatar avatar={pt.profiles.avatar} size={32} gradient="linear-gradient(135deg, #FF6B6B, #FF9E4F)" />
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#1E1B2E" }}>{pt.profiles.name}</p>
                    {pt.profiles.city && <p className="text-xs" style={{ color: "#8E8AA0" }}>{pt.profiles.city}</p>}
                  </div>
                </Link>
              ))}
              {Array.from({ length: spots }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{ background: "white", border: "1.5px dashed rgba(132,94,194,.2)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: "rgba(132,94,194,.06)" }}>👤</div>
                  <p className="text-xs font-semibold" style={{ color: "#8E8AA0" }}>Lugar libre</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {isFacilitator ? (
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(132,94,194,.06)", border: "1.5px solid rgba(132,94,194,.15)" }}>
              <p className="text-base font-bold mb-3" style={{ fontFamily: "'Fredoka', sans-serif", color: "#845EC2" }}>
                Sos {(profile as any)?.gender === "femenino" ? "la" : (profile as any)?.gender === "masculino" ? "el" : "el/la"} {facilitatorLabel((profile as any)?.gender).toLowerCase()} de este grupo
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {speakeasy.meeting_url && (
                  <a href={speakeasy.meeting_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#845EC2" }}>
                    🎥 Abrir Google Meet
                  </a>
                )}
                <CalendarButtons googleUrl={googleCalUrl} onICS={downloadICS} />
              </div>
            </div>
          ) : isJoined ? (
            <div className="rounded-2xl p-5" style={{ background: "rgba(6,214,160,.08)", border: "1.5px solid rgba(6,214,160,.2)" }}>
              <p className="text-lg font-bold mb-1 text-center" style={{ fontFamily: "'Fredoka', sans-serif", color: "#06D6A0" }}>
                ✓ ¡Estás anotado/a!
              </p>
              <p className="text-sm mb-4 text-center" style={{ color: "#4A4560" }}>
                El link de Meet va a estar disponible acá el día de la sesión.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {speakeasy.meeting_url && (
                  <a href={speakeasy.meeting_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#06D6A0" }}>
                    🎥 Abrir Google Meet
                  </a>
                )}
                <CalendarButtons googleUrl={googleCalUrl} onICS={downloadICS} />
                <button onClick={handleLeave} disabled={leaving}
                  className="px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ background: "white", border: "1.5px solid rgba(255,107,107,.3)", color: "#FF6B6B", fontFamily: "'Nunito', sans-serif" }}>
                  {leaving ? "Saliendo…" : "Salir del grupo"}
                </button>
              </div>
            </div>
          ) : isFull ? (
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,107,107,.06)", border: "1.5px solid rgba(255,107,107,.15)" }}>
              <p className="text-base font-bold" style={{ color: "#FF6B6B" }}>😔 Este Speakeasy está completo</p>
              <p className="text-sm mt-1" style={{ color: "#4A4560" }}>Fijate en los otros grupos disponibles.</p>
            </div>
          ) : (
            <button onClick={handleJoin} disabled={joining}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #845EC2, #6d4aab)", fontFamily: "'Nunito', sans-serif", boxShadow: "0 6px 20px rgba(132,94,194,.35)" }}>
              {joining ? "Anotándote…" : `Unirme a este Speakeasy (${spots} lugar${spots !== 1 ? "es" : ""} libre${spots !== 1 ? "s" : ""})`}
            </button>
          )}
        </div>

        {/* Review del facilitador — solo participantes, sesión pasada */}
        {isJoined && !isFacilitator && new Date(`${speakeasy.date}T${speakeasy.time}`) < new Date() && (() => {
          const handleSubmit = async () => {
            if (!profile || reviewDraft.rating === 0) return;
            setSubmittingReview(true);
            const supabase = createClient();
            await supabase.from("reviews").upsert({
              speakeasy_id: speakeasy.id,
              reviewer_id: profile.id,
              facilitator_id: speakeasy.facilitator_id,
              rating: reviewDraft.rating,
              comment: reviewDraft.comment || null,
            }, { onConflict: "speakeasy_id,reviewer_id" });
            setUserReview(reviewDraft);
            setReviewSaved(true);
            setSubmittingReview(false);
          };

          return (
            <div className="rounded-3xl p-6" style={{ background: "white", border: "1.5px solid rgba(255,158,79,.2)", boxShadow: "0 4px 24px rgba(255,158,79,.08)" }}>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                ⭐ ¿Cómo estuvo la clase?
              </p>
              <p className="text-xs mb-4" style={{ color: "#8E8AA0" }}>
                Tu reseña se muestra en el perfil del/la facilitador/a.
              </p>
              {reviewSaved && userReview ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "1.3rem", color: "#FF9E4F", letterSpacing: 2 }}>{"★".repeat(userReview.rating)}{"☆".repeat(5 - userReview.rating)}</span>
                  <span className="text-sm font-bold" style={{ color: "#06D6A0" }}>✓ Reseña guardada</span>
                  <button onClick={() => setReviewSaved(false)} style={{ marginLeft: "auto", fontSize: ".75rem", color: "#845EC2", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Editar</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewDraft((d) => ({ ...d, rating: star }))}
                        style={{ fontSize: "1.8rem", background: "none", border: "none", cursor: "pointer", transition: "transform .15s", transform: reviewDraft.rating >= star ? "scale(1.1)" : "scale(1)", color: reviewDraft.rating >= star ? "#FF9E4F" : "#D8D4E8" }}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewDraft.comment} onChange={(e) => setReviewDraft((d) => ({ ...d, comment: e.target.value }))}
                    placeholder="Contá algo sobre la clase (opcional)…" rows={2}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none mb-3"
                    style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                    onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
                  <button onClick={handleSubmit} disabled={reviewDraft.rating === 0 || submittingReview}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #FF9E4F, #FF6B6B)", fontFamily: "'Nunito', sans-serif" }}>
                    {submittingReview ? "Guardando…" : "Publicar reseña"}
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* Teacher's Toolkit — solo facilitador */}
        {isFacilitator && (() => {
          const set = ICE_BREAKERS[speakeasy.topic] ?? ICE_BREAKERS["viajes"];
          const TABS: { key: typeof iceTab; label: string; icon: string }[] = [
            { key: "warmup",         label: "Warm-up",          icon: "👋" },
            { key: "wouldYouRather", label: "Would you rather", icon: "🤔" },
            { key: "hotTake",        label: "Hot take",         icon: "🔥" },
            { key: "story",          label: "Story starter",    icon: "📖" },
            { key: "hypothetical",   label: "Hypothetical",     icon: "💭" },
          ];
          const questions = set[iceTab];
          const q = questions[iceIndex % questions.length];

          const handleCopy = () => {
            navigator.clipboard.writeText(q);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          };

          const next = () => setIceIndex((i) => (i + 1) % questions.length);
          const prev = () => setIceIndex((i) => (i - 1 + questions.length) % questions.length);

          return (
            <div className="rounded-3xl overflow-hidden" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.15)", boxShadow: "0 4px 32px rgba(132,94,194,.1)" }}>

              {/* Header */}
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(132,94,194,.08)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#8E8AA0", textTransform: "uppercase", letterSpacing: 1 }}>
                  🎓 Teacher's Toolkit
                </p>
                <p className="text-sm" style={{ color: "#4A4560" }}>
                  Conversation starters to keep the class flowing
                </p>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto px-4 pt-4 gap-2" style={{ scrollbarWidth: "none" }}>
                {TABS.map((tab) => (
                  <button key={tab.key}
                    onClick={() => { setIceTab(tab.key); setIceIndex(0); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                    style={{
                      background: iceTab === tab.key ? "#845EC2" : "var(--bg)",
                      color: iceTab === tab.key ? "white" : "#4A4560",
                      border: `1.5px solid ${iceTab === tab.key ? "#845EC2" : "rgba(132,94,194,.12)"}`,
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="px-6 py-6">
                <p className="leading-snug mb-6" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "clamp(1.1rem, 3vw, 1.35rem)", fontWeight: 600, color: "#1E1B2E", minHeight: "3.5rem" }}>
                  "{q}"
                </p>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Counter + dots */}
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#8E8AA0" }}>
                      {(iceIndex % questions.length) + 1} / {questions.length}
                    </span>
                    <div className="flex gap-1.5">
                      {questions.map((_, i) => (
                        <button key={i} onClick={() => setIceIndex(i)}
                          style={{ width: 7, height: 7, borderRadius: "50%", border: "none", cursor: "pointer", background: i === iceIndex % questions.length ? "#845EC2" : "rgba(132,94,194,.2)", transition: "background .2s" }} />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
                      style={{ background: copied ? "rgba(6,214,160,.1)" : "var(--bg)", color: copied ? "#06D6A0" : "#4A4560", border: `1.5px solid ${copied ? "rgba(6,214,160,.3)" : "rgba(132,94,194,.12)"}`, fontFamily: "'Nunito', sans-serif" }}>
                      {copied ? "✓ Copied!" : "📋 Copy"}
                    </button>
                    <button onClick={prev}
                      className="px-3 py-2 rounded-full text-sm font-bold hover:opacity-80 transition-opacity"
                      style={{ background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
                      ←
                    </button>
                    <button onClick={next}
                      className="px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity text-white"
                      style={{ background: "#845EC2", border: "none", fontFamily: "'Nunito', sans-serif" }}>
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}

function CalendarButtons({ googleUrl, onICS }: { googleUrl: string; onICS: () => void }) {
  return (
    <>
      <a href={googleUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
        style={{ background: "white", border: "1.5px solid rgba(132,94,194,.2)", color: "#845EC2", textDecoration: "none", fontFamily: "'Nunito', sans-serif" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Google Calendar
      </a>
      <button onClick={onICS}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-80 transition-opacity"
        style={{ background: "white", border: "1.5px solid rgba(132,94,194,.15)", color: "#8E8AA0", fontFamily: "'Nunito', sans-serif", cursor: "pointer" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        iCal / Outlook
      </button>
    </>
  );
}
