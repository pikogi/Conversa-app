"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SPEAKEASIES, TOPIC_META, LEVEL_META, USERS, CURRENT_USER } from "@/lib/mock-data";

export default function FacilitadorPage() {
  const mySpeakeasies = SPEAKEASIES.filter((s) => s.facilitatorId === CURRENT_USER.id);
  const joinedSpeakeasies = SPEAKEASIES.filter((s) =>
    s.participants.includes(CURRENT_USER.id) && s.facilitatorId !== CURRENT_USER.id
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
              Mi panel
            </h1>
            <p className="text-sm mt-1" style={{ color: "#4A4560" }}>
              Hola, {CURRENT_USER.name}. Acá ves los grupos que creaste y los que te anotaste.
            </p>
          </div>
          <Link href="/speakeasies/crear"
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
            + Nuevo Speakeasy
          </Link>
        </div>

        {/* Perfil */}
        <div className="rounded-3xl p-6 mb-8 flex items-center gap-5"
          style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 4px 24px rgba(132,94,194,.08)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FF6B6B, #FF9E4F)" }}>
            {CURRENT_USER.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
              {CURRENT_USER.name}, {CURRENT_USER.age}
            </h2>
            <p className="text-sm" style={{ color: "#4A4560" }}>{CURRENT_USER.city}</p>
            <p className="text-sm mt-1" style={{ color: "#8E8AA0" }}>{CURRENT_USER.bio}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#845EC2" }}>
              {mySpeakeasies.length}
            </div>
            <div className="text-xs font-semibold" style={{ color: "#8E8AA0" }}>grupos creados</div>
          </div>
        </div>

        {/* Mis Speakeasies como facilitador */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
            Grupos que facilito
          </h2>

          {mySpeakeasies.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "white", border: "1.5px dashed rgba(132,94,194,.2)" }}>
              <p className="text-4xl mb-3">🎙️</p>
              <p className="text-base font-semibold" style={{ color: "#4A4560" }}>Todavía no creaste ningún Speakeasy.</p>
              <Link href="/speakeasies/crear" className="mt-4 inline-block text-sm font-bold" style={{ color: "#845EC2" }}>
                Crear mi primer grupo →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mySpeakeasies.map((s) => {
                const topic = TOPIC_META[s.topic];
                const level = LEVEL_META[s.level];
                const date = new Date(`${s.date}T${s.time}`);
                const dateStr = date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
                const participants = s.participants.map((pid) => USERS.find((u) => u.id === pid)).filter(Boolean);
                const spots = s.maxParticipants - s.participants.length;

                return (
                  <div key={s.id} className="rounded-3xl p-6"
                    style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 2px 16px rgba(132,94,194,.06)" }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: topic.bg, color: topic.color }}>
                            {topic.emoji} {topic.label}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: level.bg, color: level.color }}>
                            {level.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
                          {s.title}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: "#8E8AA0" }}>📅 {dateStr} · {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: spots === 0 ? "#FF6B6B" : "#06D6A0" }}>
                          {s.participants.length}/{s.maxParticipants}
                        </div>
                        <div className="text-xs font-semibold" style={{ color: "#8E8AA0" }}>participantes</div>
                      </div>
                    </div>

                    {/* Participant list */}
                    {participants.length > 0 ? (
                      <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bg)", border: "1px solid rgba(132,94,194,.08)" }}>
                        <p className="text-xs font-bold mb-3" style={{ color: "#8E8AA0" }}>PARTICIPANTES ANOTADOS</p>
                        <div className="space-y-2">
                          {participants.map((p) => p && (
                            <div key={p.id} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, #845EC2, #C8A4D4)" }}>
                                {p.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: "#1E1B2E" }}>{p.name}, {p.age} · {p.city}</p>
                                <p className="text-xs" style={{ color: "#8E8AA0" }}>{p.bio}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mb-4" style={{ color: "#8E8AA0" }}>Todavía no se anotó nadie. Compartí el link.</p>
                    )}

                    <div className="flex items-center gap-3">
                      <Link href={`/speakeasies/${s.id}`}
                        className="px-4 py-2 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
                        style={{ background: "rgba(132,94,194,.1)", color: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
                        Ver grupo →
                      </Link>
                      <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80"
                        style={{ background: "#06D6A0", fontFamily: "'Nunito', sans-serif" }}>
                        🎥 Abrir Meet
                      </a>
                      <span className="ml-auto text-xs font-semibold" style={{ color: spots === 0 ? "#FF6B6B" : "#06D6A0" }}>
                        {spots === 0 ? "Completo" : `${spots} lugar${spots !== 1 ? "es" : ""} libre${spots !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Grupos en los que me anoté */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
            Grupos en los que me anoté
          </h2>

          {joinedSpeakeasies.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "white", border: "1.5px dashed rgba(132,94,194,.2)" }}>
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-base font-semibold" style={{ color: "#4A4560" }}>Todavía no te anotaste a ningún grupo.</p>
              <Link href="/speakeasies" className="mt-4 inline-block text-sm font-bold" style={{ color: "#845EC2" }}>
                Ver Speakeasies disponibles →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {joinedSpeakeasies.map((s) => {
                const topic = TOPIC_META[s.topic];
                const date = new Date(`${s.date}T${s.time}`);
                return (
                  <Link key={s.id} href={`/speakeasies/${s.id}`}
                    className="rounded-3xl p-5 flex gap-4 items-start hover:opacity-90 transition-opacity"
                    style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: topic.bg }}>
                      {topic.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>{s.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8E8AA0" }}>
                        📅 {date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: "rgba(6,214,160,.1)", color: "#06D6A0" }}>
                      ✓ Anotado
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
