"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useProfile, facilitatorLabel } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { TOPIC_META, LEVEL_META } from "@/lib/mock-data";

const TOPICS = ["viajes", "musica", "series", "trabajo", "amor", "mundo"];
const LEVELS = ["básico", "intermedio", "avanzado"] as const;

type Participant = {
  user_id: string;
  profiles: { id: string; name: string; avatar: string; city: string | null; bio: string | null };
};

type Speakeasy = {
  id: string;
  title: string;
  topic: string;
  date: string;
  time: string;
  meeting_url: string;
  level: string;
  max_participants: number;
  participants: Participant[];
};

export default function PerfilPage() {
  const router = useRouter();
  const { profile, loading: profileLoading, isFacilitator } = useProfile();
  const p = profile as any;

  const [facilitated, setFacilitated] = useState<Speakeasy[]>([]);
  const [joined, setJoined] = useState<Speakeasy[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; city: string; bio: string; english_level: string; topics: string[]; avatar: string } | null>(null);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const supabase = createClient();

    async function fetchData() {
      // Grupos que facilita
      const { data: myGroups } = await supabase
        .from("speakeasies")
        .select(`
          id, title, topic, date, time, meeting_url, level, max_participants,
          participants ( user_id, profiles ( id, name, avatar, city, bio ) )
        `)
        .eq("facilitator_id", profile!.id)
        .order("date", { ascending: true });

      // Grupos en los que está anotado
      const { data: myParticipations } = await supabase
        .from("participants")
        .select(`
          speakeasies ( id, title, topic, date, time, level, max_participants,
            participants ( user_id, profiles ( id, name, avatar ) ),
            profiles!facilitator_id ( id, name, avatar )
          )
        `)
        .eq("user_id", profile!.id);

      setFacilitated((myGroups as any) ?? []);
      setJoined((myParticipations?.map((r: any) => r.speakeasies).filter(Boolean) as any) ?? []);
      setDataLoading(false);
    }

    fetchData();
  }, [profile, profileLoading]);

  const startEdit = () => {
    if (!profile) return;
    setForm({ name: p.name ?? "", city: p.city ?? "", bio: p.bio ?? "", english_level: p.english_level ?? "básico", topics: p.topics ?? [], avatar: p.avatar ?? "" });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!profile || !form) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      name: form.name, city: form.city, bio: form.bio,
      english_level: form.english_level, topics: form.topics,
      avatar: form.avatar || form.name.charAt(0).toUpperCase(),
    }).eq("id", profile.id);
    setSaving(false);
    setEditing(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const toggleTopic = (t: string) => setForm((f) => f ? ({
    ...f, topics: f.topics.includes(t) ? f.topics.filter((x) => x !== t) : [...f.topics, t],
  }) : f);

  if (profileLoading) return <LoadingScreen />;

  const levelMeta = LEVEL_META[(p?.english_level as keyof typeof LEVEL_META) ?? "básico"];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* ── Perfil header ── */}
        <div className="rounded-3xl p-6 sm:p-8" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.1)", boxShadow: "0 4px 24px rgba(132,94,194,.07)" }}>
          <div className="flex items-start gap-5 mb-5">
            <Avatar avatar={p?.avatar ?? "?"} size={64} gradient="linear-gradient(135deg, #FF6B6B, #FF9E4F)" style={{ borderRadius: 16 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.65rem", fontWeight: 700, color: "#1E1B2E", lineHeight: 1.1 }}>
                    {p?.name}
                  </h1>
                  {p?.city && <p style={{ color: "#8E8AA0", fontSize: ".86rem", marginTop: 3 }}>📍 {p.city}</p>}
                </div>
                {!editing && (
                  <button onClick={startEdit}
                    style={{ padding: "7px 16px", borderRadius: 50, border: "1.5px solid rgba(132,94,194,.2)", background: "rgba(132,94,194,.05)", color: "#845EC2", fontFamily: "'Nunito', sans-serif", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    Editar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {isFacilitator && (
                  <span style={{ padding: "4px 12px", borderRadius: 50, background: "rgba(132,94,194,.08)", border: "1.5px solid rgba(132,94,194,.2)", color: "#845EC2", fontFamily: "'Nunito', sans-serif", fontSize: ".72rem", fontWeight: 800 }}>
                    {facilitatorLabel((p as any)?.gender).toUpperCase()}
                  </span>
                )}
                <span style={{ padding: "4px 12px", borderRadius: 50, background: levelMeta.bg, border: `1.5px solid ${levelMeta.color}30`, color: levelMeta.color, fontFamily: "'Nunito', sans-serif", fontSize: ".72rem", fontWeight: 800 }}>
                  INGLÉS {levelMeta.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid gap-3 mb-6 ${isFacilitator ? "grid-cols-3" : "grid-cols-2"}`}>
            {[
              ...(isFacilitator ? [{ label: "Grupos creados", value: dataLoading ? "…" : facilitated.length, color: "#845EC2" }] : []),
              { label: "Me anoté", value: dataLoading ? "…" : joined.length, color: "#FF6B6B" },
              { label: "Nivel", value: levelMeta.label, color: levelMeta.color },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.08)" }}>
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ color: "#8E8AA0", fontSize: ".7rem", fontWeight: 600, marginTop: 1 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio / form */}
          {!editing ? (
            <>
              {p?.bio ? (
                <p style={{ color: "#4A4560", fontSize: ".92rem", lineHeight: 1.7, marginBottom: 16 }}>{p.bio}</p>
              ) : (
                <p style={{ color: "#C0BCCC", fontSize: ".88rem", fontStyle: "italic", marginBottom: 16 }}>
                  Sin bio todavía. ¡Contá algo de vos!
                </p>
              )}
              {p?.topics?.length > 0 ? (
                <div>
                  <p style={{ fontSize: ".72rem", fontWeight: 800, color: "#8E8AA0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Temas que me interesan</p>
                  <div className="flex flex-wrap gap-2">
                    {p.topics.map((t: string) => {
                      const meta = TOPIC_META[t]; if (!meta) return null;
                      return <span key={t} style={{ padding: "5px 14px", borderRadius: 50, background: meta.bg, color: meta.color, fontFamily: "'Nunito', sans-serif", fontSize: ".82rem", fontWeight: 700 }}>{meta.emoji} {meta.label}</span>;
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: ".72rem", fontWeight: 800, color: "#8E8AA0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Temas que me interesan</p>
                  <p style={{ color: "#C0BCCC", fontSize: ".88rem", fontStyle: "italic" }}>Sin temas elegidos todavía.</p>
                </div>
              )}
            </>
          ) : (
            <EditForm form={form!} setForm={setForm} saving={saving} onSave={saveEdit} onCancel={() => setEditing(false)} toggleTopic={toggleTopic} profileId={profile!.id} onAvatarChange={(url: string) => setForm((f) => f ? { ...f, avatar: url } : f)} />
          )}
        </div>

        {/* ── Grupos que facilito ── */}
        {isFacilitator && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#1E1B2E" }}>Grupos que facilito</h2>
              <Link href="/speakeasies/crear"
                style={{ padding: "7px 16px", borderRadius: 50, background: "#845EC2", color: "white", fontFamily: "'Nunito', sans-serif", fontSize: ".8rem", fontWeight: 700, textDecoration: "none" }}>
                + Nuevo
              </Link>
            </div>

            {dataLoading ? <SectionSkeleton /> : facilitated.length === 0 ? (
              <EmptyState icon="🎙️" text="Todavía no creaste ningún Speakeasy." link="/speakeasies/crear" linkText="Crear mi primer grupo →" />
            ) : (
              <div className="space-y-4">
                {facilitated.map((s) => {
                  const topic = TOPIC_META[s.topic] ?? TOPIC_META["viajes"];
                  const level = LEVEL_META[s.level as keyof typeof LEVEL_META] ?? LEVEL_META["intermedio"];
                  const date = new Date(`${s.date}T${s.time}`);
                  const spots = s.max_participants - (s.participants?.length ?? 0);
                  return (
                    <div key={s.id} className="rounded-3xl p-5 sm:p-6" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", boxShadow: "0 2px 16px rgba(132,94,194,.06)" }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span style={{ padding: "3px 10px", borderRadius: 50, background: topic.bg, color: topic.color, fontSize: ".75rem", fontWeight: 700 }}>{topic.emoji} {topic.label}</span>
                            <span style={{ padding: "3px 10px", borderRadius: 50, background: level.bg, color: level.color, fontSize: ".75rem", fontWeight: 700 }}>{level.label}</span>
                          </div>
                          <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#1E1B2E" }}>{s.title}</h3>
                          <p style={{ color: "#8E8AA0", fontSize: ".78rem", marginTop: 3 }}>
                            📅 {date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} · {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: spots === 0 ? "#FF6B6B" : "#06D6A0", lineHeight: 1 }}>
                            {s.participants?.length ?? 0}/{s.max_participants}
                          </p>
                          <p style={{ color: "#8E8AA0", fontSize: ".7rem", fontWeight: 600 }}>anotados</p>
                        </div>
                      </div>

                      {s.participants?.length > 0 && (
                        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bg)", border: "1px solid rgba(132,94,194,.08)" }}>
                          <p style={{ fontSize: ".7rem", fontWeight: 800, color: "#8E8AA0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Participantes</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {s.participants.map((pt) => (
                              <Link key={pt.user_id} href={`/perfil/${pt.user_id}`}
                                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
                                className="hover:opacity-80 transition-opacity">
                                <Avatar avatar={pt.profiles?.avatar ?? "?"} size={32} />
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: ".85rem", fontWeight: 700, color: "#1E1B2E" }}>
                                    {pt.profiles?.name}{pt.profiles?.city ? ` · ${pt.profiles.city}` : ""}
                                  </p>
                                  {pt.profiles?.bio && <p style={{ fontSize: ".75rem", color: "#8E8AA0" }}>{pt.profiles.bio}</p>}
                                </div>
                                <span style={{ fontSize: ".72rem", color: "#845EC2", fontWeight: 700 }}>Ver →</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Link href={`/speakeasies/${s.id}`}
                          style={{ padding: "6px 14px", borderRadius: 50, background: "rgba(132,94,194,.1)", color: "#845EC2", fontFamily: "'Nunito', sans-serif", fontSize: ".78rem", fontWeight: 700, textDecoration: "none" }}>
                          Ver grupo →
                        </Link>
                        {s.meeting_url && (
                          <a href={s.meeting_url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "6px 14px", borderRadius: 50, background: "#06D6A0", color: "white", fontFamily: "'Nunito', sans-serif", fontSize: ".78rem", fontWeight: 700, textDecoration: "none" }}>
                            🎥 Abrir Meet
                          </a>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: ".75rem", fontWeight: 700, color: spots === 0 ? "#FF6B6B" : "#06D6A0" }}>
                          {spots === 0 ? "Completo" : `${spots} lugar${spots !== 1 ? "es" : ""} libre${spots !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Próximas sesiones ── */}
        <section>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 16 }}>
            Próximas sesiones
          </h2>
          {dataLoading ? <SectionSkeleton /> : (() => {
            const now = new Date();
            const upcoming = joined.filter((s) => new Date(`${s.date}T${s.time}`) >= now);
            return upcoming.length === 0 ? (
              <EmptyState icon="🔍" text="Todavía no te anotaste a ningún grupo." link="/speakeasies" linkText="Ver Speakeasies disponibles →" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map((s) => {
                  const topic = TOPIC_META[s.topic] ?? TOPIC_META["viajes"];
                  const level = LEVEL_META[s.level as keyof typeof LEVEL_META] ?? LEVEL_META["intermedio"];
                  const date = new Date(`${s.date}T${s.time}`);
                  return (
                    <Link key={s.id} href={`/speakeasies/${s.id}`}
                      className="rounded-3xl p-5 flex gap-4 items-start hover:opacity-90 transition-opacity"
                      style={{ background: "white", border: "1.5px solid rgba(132,94,194,.12)", textDecoration: "none" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: topic.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                        {topic.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#1E1B2E" }}>{s.title}</p>
                        <p style={{ color: "#8E8AA0", fontSize: ".76rem", marginTop: 2 }}>
                          📅 {date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <span style={{ display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 50, background: level.bg, color: level.color, fontSize: ".72rem", fontWeight: 700 }}>{level.label}</span>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 50, background: "rgba(6,214,160,.1)", color: "#06D6A0", fontSize: ".72rem", fontWeight: 800, flexShrink: 0, alignSelf: "flex-start" }}>✓ Anotado</span>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* ── Pasaporte ── */}
        {!dataLoading && (() => {
          const now = new Date();
          const past = joined.filter((s) => new Date(`${s.date}T${s.time}`) < now);
          if (past.length === 0) return null;
          return (
            <section>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                Mi Pasaporte
              </h2>
              <p style={{ color: "#8E8AA0", fontSize: ".82rem", marginBottom: 16 }}>
                {past.length} conversación{past.length !== 1 ? "es" : ""} completada{past.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {past.map((s) => {
                  const topic = TOPIC_META[s.topic] ?? TOPIC_META["viajes"];
                  const date = new Date(`${s.date}T${s.time}`);
                  return (
                    <div key={s.id} className="rounded-2xl p-4"
                      style={{ background: "white", border: `2px solid ${topic.color}25`, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: -10, right: -10, fontSize: "3.5rem", opacity: .08, userSelect: "none" }}>
                        {topic.emoji}
                      </div>
                      <Link href={`/speakeasies/${s.id}`} style={{ textDecoration: "none" }}>
                        <p style={{ fontSize: "1.4rem", marginBottom: 4 }}>{topic.emoji}</p>
                        <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: ".88rem", fontWeight: 700, color: "#1E1B2E", lineHeight: 1.2, marginBottom: 4 }}>{s.title}</p>
                        <p style={{ fontSize: ".7rem", color: "#8E8AA0", fontWeight: 600, marginBottom: 8 }}>
                          {date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </Link>
                      {/* Participantes */}
                      <div className="flex gap-1 flex-wrap">
                        {[(s as any).profiles, ...((s as any).participants ?? []).map((p: any) => p.profiles)]
                          .filter((p: any) => p && p.id !== profile!.id)
                          .slice(0, 3)
                          .map((p: any) => (
                            <Link key={p.id} href={`/perfil/${p.id}`} title={p.name} style={{ textDecoration: "none", flexShrink: 0 }}
                              className="hover:opacity-80 transition-opacity">
                              <Avatar avatar={p.avatar} size={28} />
                            </Link>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-3 rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity"
          style={{ background: "white", border: "1.5px solid rgba(255,107,107,.2)", color: "#FF6B6B", fontFamily: "'Nunito', sans-serif" }}>
          Cerrar sesión
        </button>

      </main>
    </div>
  );
}

/* ── Helpers ── */

function LoadingScreen() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div style={{ width: 32, height: 32, border: "3px solid rgba(132,94,194,.2)", borderTopColor: "#845EC2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ height: 80, borderRadius: 20, background: "white", border: "1.5px solid rgba(132,94,194,.08)", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

function EmptyState({ icon, text, link, linkText }: { icon: string; text: string; link: string; linkText: string }) {
  return (
    <div className="rounded-3xl p-10 text-center" style={{ background: "white", border: "1.5px dashed rgba(132,94,194,.2)" }}>
      <p style={{ fontSize: "2.5rem", marginBottom: 10 }}>{icon}</p>
      <p style={{ color: "#4A4560", fontWeight: 600, marginBottom: 12 }}>{text}</p>
      <Link href={link} style={{ color: "#845EC2", fontWeight: 700, fontSize: ".9rem" }}>{linkText}</Link>
    </div>
  );
}

function EditForm({ form, setForm, saving, onSave, onCancel, toggleTopic, profileId, onAvatarChange }: any) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;
    setUploadingPhoto(true);
    const supabase = createClient();
    await supabase.storage.from("avatars").upload(profileId, file, { upsert: true, contentType: file.type });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(profileId);
    onAvatarChange(`${publicUrl}?t=${Date.now()}`);
    setUploadingPhoto(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Photo upload */}
      <div>
        <label style={{ display: "block", fontSize: ".8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 8 }}>Foto de perfil</label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar avatar={form.avatar || form.name?.charAt(0)?.toUpperCase() || "?"} size={56} style={{ borderRadius: 14 }} />
          <label style={{ padding: "8px 16px", borderRadius: 50, border: "1.5px solid rgba(132,94,194,.2)", background: "rgba(132,94,194,.05)", color: "#845EC2", fontFamily: "'Nunito', sans-serif", fontSize: ".82rem", fontWeight: 700, cursor: uploadingPhoto ? "default" : "pointer", opacity: uploadingPhoto ? 0.6 : 1 }}>
            {uploadingPhoto ? "Subiendo…" : "Cambiar foto"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} disabled={uploadingPhoto} />
          </label>
        </div>
      </div>

      {[{ label: "Nombre", key: "name", placeholder: "Tu nombre" }, { label: "Ciudad", key: "city", placeholder: "Buenos Aires" }].map(({ label, key, placeholder }) => (
        <div key={key}>
          <label style={{ display: "block", fontSize: ".8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 5 }}>{label}</label>
          <input type="text" value={form[key] ?? ""} placeholder={placeholder}
            onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: "1.5px solid rgba(132,94,194,.15)", background: "var(--bg)", fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", color: "#1E1B2E", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
        </div>
      ))}
      <div>
        <label style={{ display: "block", fontSize: ".8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 5 }}>Bio</label>
        <textarea value={form.bio ?? ""} placeholder="Contá algo de vos…" rows={2}
          onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value }))}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: "1.5px solid rgba(132,94,194,.15)", background: "var(--bg)", fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", color: "#1E1B2E", outline: "none", resize: "none" }}
          onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: ".8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 8 }}>Nivel de inglés</label>
        <div style={{ display: "flex", gap: 8 }}>
          {LEVELS.map((l) => {
            const meta = LEVEL_META[l]; const sel = form.english_level === l;
            return <button type="button" key={l} onClick={() => setForm((f: any) => ({ ...f, english_level: l }))}
              style={{ flex: 1, padding: "8px", borderRadius: 12, border: `1.5px solid ${sel ? meta.color : "rgba(132,94,194,.15)"}`, background: sel ? meta.bg : "var(--bg)", color: sel ? meta.color : "#4A4560", fontFamily: "'Nunito', sans-serif", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}>
              {meta.label}
            </button>;
          })}
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontSize: ".8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 8 }}>Temas de interés</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {["viajes", "musica", "series", "trabajo", "amor", "mundo"].map((t) => {
            const meta = TOPIC_META[t]; const sel = form.topics.includes(t);
            return <button type="button" key={t} onClick={() => toggleTopic(t)}
              style={{ padding: "8px 4px", borderRadius: 12, border: `1.5px solid ${sel ? meta.color : "rgba(132,94,194,.15)"}`, background: sel ? meta.bg : "var(--bg)", color: sel ? meta.color : "#4A4560", fontFamily: "'Nunito', sans-serif", fontSize: ".78rem", fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "1.1rem" }}>{meta.emoji}</span>{meta.label}
            </button>;
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onSave} disabled={saving}
          style={{ flex: 1, padding: "11px", borderRadius: 50, border: "none", background: "linear-gradient(135deg, #845EC2, #6d4aab)", color: "white", fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", fontWeight: 800, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "11px 20px", borderRadius: 50, border: "1.5px solid rgba(132,94,194,.2)", background: "white", color: "#845EC2", fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", fontWeight: 700, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
