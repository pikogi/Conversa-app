"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TOPIC_META } from "@/lib/mock-data";
import { Topic } from "@/lib/types";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

const TOPICS: Topic[] = ["viajes", "musica", "series", "trabajo", "amor", "mundo"];
const LEVELS = ["básico", "intermedio", "avanzado"] as const;

function getExpressDateTime() {
  const now = new Date(Date.now() + 30 * 60 * 1000);
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
}

export default function CrearSpeakeasyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpress = searchParams.get("express") === "1";
  const { profile, loading: profileLoading, isFacilitator } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const expressDefaults = isExpress ? getExpressDateTime() : null;

  const [form, setForm] = useState({
    title: "",
    topic: "" as Topic | "",
    description: "",
    date: expressDefaults?.date ?? "",
    time: expressDefaults?.time ?? "",
    meetingUrl: "",
    level: "intermedio" as "básico" | "intermedio" | "avanzado",
  });

  useEffect(() => {
    if (!profileLoading && profile && !isFacilitator) {
      router.replace("/speakeasies");
    }
  }, [profileLoading, profile, isFacilitator, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title && form.topic && form.description && form.date && form.time && form.meetingUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !profile) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("speakeasies")
      .insert({
        title: form.title,
        topic: form.topic,
        description: form.description,
        date: form.date,
        time: form.time,
        meeting_url: form.meetingUrl,
        level: form.level,
        facilitator_id: profile.id,
        max_participants: 4,
      })
      .select("id")
      .single();

    setLoading(false);

    if (dbError) {
      setError("No se pudo crear el Speakeasy. Intentá de nuevo.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          name: profile.name,
          title: form.title,
          date: form.date,
          time: form.time,
          meetingUrl: form.meetingUrl,
          level: form.level,
          topic: form.topic,
          type: "created",
        }),
      });
    }

    setCreatedId(data.id);
  };

  if (profileLoading || (!isFacilitator && !createdId)) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div style={{ width: 32, height: 32, border: "3px solid rgba(132,94,194,.2)", borderTopColor: "#845EC2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (createdId) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</p>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 8 }}>
            ¡Speakeasy creado!
          </h2>
          <p style={{ color: "#4A4560", fontSize: ".95rem", lineHeight: 1.6, marginBottom: 28 }}>
            Tu grupo <strong>"{form.title}"</strong> ya está publicado. Te avisamos cuando alguien se anote.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => router.push(`/speakeasies/${createdId}?calendar=1`)}
              className="px-6 py-3 rounded-full text-sm font-bold text-white"
              style={{ background: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
              Ver el grupo
            </button>
            <button onClick={() => router.push("/speakeasies")}
              className="px-6 py-3 rounded-full text-sm font-bold"
              style={{ background: "white", border: "1.5px solid rgba(132,94,194,.2)", color: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
              Ver todos los grupos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/speakeasies" className="inline-flex items-center gap-1 text-sm font-bold mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "#845EC2" }}>
          ← Volver
        </Link>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1E1B2E" }}>
          {isExpress ? "⚡ Speakeasy Exprés" : "Crear un Speakeasy"}
        </h1>
        <p className="text-sm mb-8" style={{ color: "#4A4560" }}>
          {isExpress
            ? "La fecha y hora ya están cargadas para dentro de 30 minutos. Completá el resto y publicá."
            : "Vas a ser el/la facilitador/a. Tu trabajo es abrir la conversación y que fluya."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="rounded-3xl p-6 sm:p-8 space-y-6" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 4px 24px rgba(132,94,194,.08)" }}>

            {/* Tema */}
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: "#1E1B2E" }}>Tema del Speakeasy *</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TOPICS.map((t) => {
                  const meta = TOPIC_META[t];
                  const selected = form.topic === t;
                  return (
                    <button type="button" key={t} onClick={() => set("topic", t)}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all text-center"
                      style={{
                        background: selected ? meta.bg : "var(--bg)",
                        border: `1.5px solid ${selected ? meta.color : "rgba(132,94,194,.1)"}`,
                        transform: selected ? "scale(1.04)" : "scale(1)",
                      }}>
                      <span className="text-xl">{meta.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: selected ? meta.color : "#4A4560" }}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>Título *</label>
              <input id="title" type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Ej: El viaje que soñás tener"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="desc" className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>Descripción *</label>
              <textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="¿De qué va a tratar la conversación? Que los participantes entiendan qué van a hablar."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all resize-none"
                style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>Fecha *</label>
                <input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                  style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                  onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>Hora *</label>
                <input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                  style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                  onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
              </div>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>Nivel de inglés</label>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button type="button" key={l} onClick={() => set("level", l)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize"
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      background: form.level === l ? "#845EC2" : "var(--bg)",
                      color: form.level === l ? "white" : "#4A4560",
                      border: `1.5px solid ${form.level === l ? "#845EC2" : "rgba(132,94,194,.15)"}`,
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Meet */}
            <div>
              <label htmlFor="meet" className="block text-sm font-bold mb-2" style={{ color: "#1E1B2E" }}>
                Link de Google Meet / Zoom *
              </label>
              <input id="meet" type="url" value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{ fontFamily: "'Nunito', sans-serif", background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.15)", color: "#1E1B2E" }}
                onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
              <p className="text-xs mt-1.5" style={{ color: "#8E8AA0" }}>Solo los participantes anotados van a ver este link.</p>
            </div>

            {error && <p style={{ color: "#FF6B6B", fontSize: ".85rem", fontWeight: 600 }}>{error}</p>}

            <button type="submit" disabled={!valid || loading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: valid ? "linear-gradient(135deg, #845EC2, #6d4aab)" : "#ccc", fontFamily: "'Nunito', sans-serif", boxShadow: valid ? "0 6px 20px rgba(132,94,194,.3)" : "none" }}>
              {loading ? "Publicando…" : "Publicar Speakeasy"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
