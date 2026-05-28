"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TOPIC_META, LEVEL_META } from "@/lib/mock-data";
import { facilitatorLabel } from "@/lib/hooks/useProfile";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

type PublicProfile = {
  id: string;
  name: string;
  avatar: string;
  bio: string | null;
  city: string | null;
  english_level: string | null;
  gender: string | null;
  topics: string[] | null;
  role: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string; avatar: string } | null;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: me } = useProfile();

  const [person, setPerson] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ facilitated: 0, joined: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: p }, { data: revs }, { data: fac }, { data: par }] = await Promise.all([
        supabase.from("profiles").select("id, name, avatar, bio, city, english_level, gender, topics, role").eq("id", id).single(),
        supabase.from("reviews").select("id, rating, comment, created_at, profiles!reviewer_id(name, avatar)").eq("facilitator_id", id).order("created_at", { ascending: false }),
        supabase.from("speakeasies").select("id", { count: "exact", head: true }).eq("facilitator_id", id),
        supabase.from("participants").select("speakeasy_id", { count: "exact", head: true }).eq("user_id", id),
      ]);

      if (!p) { setNotFound(true); setLoading(false); return; }
      setPerson(p as PublicProfile);
      setReviews((revs as unknown as Review[]) ?? []);
      setStats({ facilitated: (fac as any)?.length ?? 0, joined: (par as any)?.length ?? 0 });
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div style={{ width: 32, height: 32, border: "3px solid rgba(132,94,194,.2)", borderTopColor: "#845EC2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );

  if (notFound || !person) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <p style={{ fontSize: "3rem", marginBottom: 12 }}>😕</p>
        <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.2rem", fontWeight: 600, color: "#4A4560" }}>Perfil no encontrado</p>
        <Link href="/speakeasies" style={{ color: "#845EC2", fontWeight: 700, fontSize: ".9rem" }}>← Volver</Link>
      </div>
    </div>
  );

  const isFacilitator = person.role === "facilitator";
  const levelMeta = LEVEL_META[(person.english_level as keyof typeof LEVEL_META) ?? "básico"];
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const isMe = me?.id === person.id;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        <Link href="/speakeasies" className="inline-flex items-center gap-1 text-sm font-bold mb-2 hover:opacity-70 transition-opacity"
          style={{ color: "#845EC2" }}>
          ← Volver
        </Link>

        {/* Profile card */}
        <div className="rounded-3xl p-6 sm:p-8" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.1)", boxShadow: "0 4px 24px rgba(132,94,194,.07)" }}>
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: isFacilitator ? "linear-gradient(135deg, #845EC2, #C8A4D4)" : "linear-gradient(135deg, #FF6B6B, #FF9E4F)" }}>
              {person.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: "#1E1B2E", lineHeight: 1.1 }}>
                    {person.name}
                    {isMe && <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#8E8AA0", marginLeft: 8 }}>(vos)</span>}
                  </h1>
                  {person.city && <p style={{ color: "#8E8AA0", fontSize: ".86rem", marginTop: 3 }}>📍 {person.city}</p>}
                </div>
                {avgRating !== null && (
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#FF9E4F", lineHeight: 1 }}>
                      {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                    </p>
                    <p style={{ fontSize: ".72rem", color: "#8E8AA0", fontWeight: 600 }}>{avgRating.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {isFacilitator && (
                  <span style={{ padding: "4px 12px", borderRadius: 50, background: "rgba(132,94,194,.08)", border: "1.5px solid rgba(132,94,194,.2)", color: "#845EC2", fontSize: ".72rem", fontWeight: 800 }}>
                    {facilitatorLabel(person.gender).toUpperCase()}
                  </span>
                )}
                <span style={{ padding: "4px 12px", borderRadius: 50, background: levelMeta.bg, border: `1.5px solid ${levelMeta.color}30`, color: levelMeta.color, fontSize: ".72rem", fontWeight: 800 }}>
                  INGLÉS {levelMeta.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid gap-3 mb-6 ${isFacilitator ? "grid-cols-2" : "grid-cols-2"}`}>
            {isFacilitator && (
              <div className="rounded-2xl p-3 text-center" style={{ background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.08)" }}>
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#845EC2" }}>{stats.facilitated}</p>
                <p style={{ color: "#8E8AA0", fontSize: ".7rem", fontWeight: 600, marginTop: 1 }}>Clases facilitadas</p>
              </div>
            )}
            <div className="rounded-2xl p-3 text-center" style={{ background: "var(--bg)", border: "1.5px solid rgba(132,94,194,.08)" }}>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#FF6B6B" }}>{stats.joined}</p>
              <p style={{ color: "#8E8AA0", fontSize: ".7rem", fontWeight: 600, marginTop: 1 }}>Clases tomadas</p>
            </div>
          </div>

          {/* Bio */}
          {person.bio && (
            <p style={{ color: "#4A4560", fontSize: ".92rem", lineHeight: 1.7, marginBottom: 16 }}>{person.bio}</p>
          )}

          {/* Topics */}
          {(person.topics?.length ?? 0) > 0 && (
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 800, color: "#8E8AA0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Temas de interés
              </p>
              <div className="flex flex-wrap gap-2">
                {person.topics!.map((t) => {
                  const meta = TOPIC_META[t]; if (!meta) return null;
                  return (
                    <span key={t} style={{ padding: "5px 14px", borderRadius: 50, background: meta.bg, color: meta.color, fontSize: ".82rem", fontWeight: 700 }}>
                      {meta.emoji} {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        {isFacilitator && reviews.length > 0 && (
          <section>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 14 }}>
              Reseñas
            </h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl p-4" style={{ background: "white", border: "1.5px solid rgba(132,94,194,.1)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #FF6B6B, #FF9E4F)" }}>
                        {(r.profiles as any)?.avatar ?? "?"}
                      </div>
                      <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#1E1B2E" }}>{(r.profiles as any)?.name ?? "Anónimo"}</span>
                    </div>
                    <span style={{ color: "#FF9E4F", fontSize: ".95rem", letterSpacing: 1 }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                  {r.comment && <p style={{ color: "#4A4560", fontSize: ".85rem", lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
