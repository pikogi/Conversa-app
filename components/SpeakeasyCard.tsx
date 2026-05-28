"use client";

import Link from "next/link";
import { DbSpeakeasy } from "@/lib/types";
import { TOPIC_META, LEVEL_META } from "@/lib/mock-data";
import Avatar from "@/components/Avatar";

interface Props {
  speakeasy: DbSpeakeasy;
  joined?: boolean;
  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  view?: "grid" | "list";
}

export default function SpeakeasyCard({ speakeasy, joined = false, favorited = false, onToggleFavorite, view = "grid" }: Props) {
  const topic = TOPIC_META[speakeasy.topic] ?? TOPIC_META["viajes"];
  const level = LEVEL_META[speakeasy.level as keyof typeof LEVEL_META] ?? LEVEL_META["intermedio"];
  const participantCount = speakeasy.participants?.length ?? 0;
  const spots = speakeasy.max_participants - participantCount;
  const isFull = spots === 0;

  const date = new Date(`${speakeasy.date}T${speakeasy.time}`);
  const dateStr = date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const heartBtn = (
    <button
      onClick={(e) => { e.preventDefault(); onToggleFavorite?.(speakeasy.id); }}
      aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
      style={{
        background: favorited ? "rgba(255,107,107,.12)" : "rgba(255,255,255,.9)",
        border: `1.5px solid ${favorited ? "rgba(255,107,107,.3)" : "rgba(132,94,194,.12)"}`,
        borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .15s",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? "#FF6B6B" : "none"}
        stroke={favorited ? "#FF6B6B" : "#A09CB5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );

  /* ── List view ── */
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all"
        style={{ background: "white", border: "1.5px solid rgba(132,94,194,.1)", boxShadow: "0 2px 12px rgba(132,94,194,.06)" }}>

        {/* Topic icon */}
        <div style={{ width: 42, height: 42, borderRadius: 14, background: topic.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
          {topic.emoji}
        </div>

        {/* Main info */}
        <Link href={`/speakeasies/${speakeasy.id}`} className="flex-1 min-w-0" style={{ textDecoration: "none" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#1E1B2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {speakeasy.title}
            </p>
            {joined && (
              <span style={{ padding: "1px 8px", borderRadius: 50, background: "rgba(6,214,160,.1)", color: "#06D6A0", fontSize: ".65rem", fontWeight: 800, flexShrink: 0 }}>✓</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ fontSize: ".75rem", color: "#8E8AA0", fontWeight: 600 }}>📅 {dateStr} · {timeStr}</span>
            <span style={{ padding: "2px 8px", borderRadius: 50, background: level.bg, color: level.color, fontSize: ".68rem", fontWeight: 700 }}>{level.label}</span>
            <span style={{ fontSize: ".75rem", fontWeight: 700, color: isFull ? "#FF6B6B" : "#06D6A0" }}>
              {isFull ? "Completo" : `${spots} libre${spots !== 1 ? "s" : ""}`}
            </span>
          </div>
        </Link>

        {/* Participant avatars */}
        <div className="hidden sm:flex items-center" style={{ flexShrink: 0 }}>
          {speakeasy.participants?.slice(0, 3).map((pt, i) => (
            <Avatar key={pt.user_id ?? i} avatar={pt.profiles?.avatar ?? "?"} size={26} gradient="linear-gradient(135deg, #845EC2, #C8A4D4)" style={{ border: "2px solid white", marginLeft: i === 0 ? 0 : -6 }} />
          ))}
        </div>

        {heartBtn}
      </div>
    );
  }

  /* ── Grid view ── */
  return (
    <div className="rounded-3xl p-5 transition-all duration-200 hover:-translate-y-1 h-full flex flex-col"
      style={{ background: "#fff", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 4px 24px rgba(132,94,194,.08)", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(132,94,194,.16)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(132,94,194,.08)"; }}>

      {/* Top row: topic badge + heart */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: topic.bg, color: topic.color }}>
          {topic.emoji} {topic.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: level.bg, color: level.color }}>
            {level.label}
          </span>
          {heartBtn}
        </div>
      </div>

      <Link href={`/speakeasies/${speakeasy.id}`} className="flex-1 flex flex-col" style={{ textDecoration: "none" }}>
        <h3 className="text-base font-bold mb-1.5 leading-snug" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
          {speakeasy.title}
        </h3>
        <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "#4A4560" }}>
          {speakeasy.description && speakeasy.description.length > 90
            ? speakeasy.description.slice(0, 90) + "…"
            : speakeasy.description}
        </p>

        {/* Participants */}
        <div className="flex items-center gap-1 mb-4">
          {speakeasy.participants?.slice(0, 3).map((pt, i) => (
            <Avatar key={pt.user_id ?? i} avatar={pt.profiles?.avatar ?? "?"} size={26} gradient="linear-gradient(135deg, #845EC2, #C8A4D4)" style={{ border: "2px solid white", marginLeft: i === 0 ? 0 : -6 }} />
          ))}
          {participantCount === 0 && <span className="text-xs" style={{ color: "#C0BCCC" }}>Sin participantes aún</span>}
          <span className="text-xs font-bold ml-2" style={{ color: isFull ? "#FF6B6B" : "#06D6A0" }}>
            {isFull ? "Completo" : `${spots} libre${spots !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(132,94,194,.08)" }}>
          <span className="text-xs font-semibold" style={{ color: "#8E8AA0" }}>📅 {dateStr} · {timeStr}</span>
          {joined ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#06D6A0" }}>✓ Anotado</span>
          ) : isFull ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255,107,107,.1)", color: "#FF6B6B" }}>Sin lugar</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(132,94,194,.1)", color: "#845EC2" }}>Ver →</span>
          )}
        </div>
      </Link>
    </div>
  );
}
