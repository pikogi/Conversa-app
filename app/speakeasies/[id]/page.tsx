"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TOPIC_META, LEVEL_META } from "@/lib/mock-data";
import { useProfile } from "@/lib/hooks/useProfile";
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
  const { profile } = useProfile();

  const [speakeasy, setSpeakeasy] = useState<Speakeasy | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setSpeakeasy(data as unknown as Speakeasy); }
        setPageLoading(false);
      });
  }, [id]);

  const handleJoin = async () => {
    if (!profile || !speakeasy) return;
    setJoining(true);
    const supabase = createClient();
    await supabase.from("participants").insert({ speakeasy_id: speakeasy.id, user_id: profile.id });
    // Refetch
    const { data } = await supabase
      .from("speakeasies")
      .select(`id, title, topic, description, date, time, meeting_url, facilitator_id, level, max_participants, participants ( user_id, profiles ( id, name, avatar, city, bio, english_level ) ), profiles!facilitator_id ( id, name, avatar, city, bio )`)
      .eq("id", id)
      .single();
    if (data) setSpeakeasy(data as Speakeasy);
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
    if (data) setSpeakeasy(data as Speakeasy);
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
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
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
              style={{ background: "rgba(132,94,194,.06)", border: "1px solid rgba(132,94,194,.1)" }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #845EC2, #C8A4D4)" }}>
                {facilitator.avatar}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "#8E8AA0" }}>Facilitador/a</p>
                <p className="text-sm font-bold" style={{ color: "#1E1B2E" }}>
                  {facilitator.name}{facilitator.city ? ` · ${facilitator.city}` : ""}
                </p>
                {facilitator.bio && <p className="text-xs mt-0.5" style={{ color: "#4A4560" }}>{facilitator.bio}</p>}
              </div>
            </div>
          )}

          {/* Participantes */}
          <div className="mb-6">
            <p className="text-sm font-bold mb-3" style={{ color: "#1E1B2E" }}>
              Participantes ({participants.length}/{speakeasy.max_participants})
            </p>
            <div className="flex gap-3 flex-wrap">
              {participants.map((pt) => pt.profiles && (
                <div key={pt.user_id} className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{ background: "var(--bg)", border: "1px solid rgba(132,94,194,.1)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #FF6B6B, #FF9E4F)" }}>
                    {pt.profiles.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#1E1B2E" }}>{pt.profiles.name}</p>
                    {pt.profiles.city && <p className="text-xs" style={{ color: "#8E8AA0" }}>{pt.profiles.city}</p>}
                  </div>
                </div>
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
              <p className="text-base font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif", color: "#845EC2" }}>
                Sos el/la facilitador/a de este grupo
              </p>
              {speakeasy.meeting_url && (
                <a href={speakeasy.meeting_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white mt-3 hover:opacity-90 transition-opacity"
                  style={{ background: "#845EC2" }}>
                  🎥 Abrir Google Meet
                </a>
              )}
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
      </main>
    </div>
  );
}
