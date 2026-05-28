"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SpeakeasyCard from "@/components/SpeakeasyCard";
import { TOPIC_META } from "@/lib/mock-data";
import { DbSpeakeasy, Topic } from "@/lib/types";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

const TOPICS = ["todos", "viajes", "musica", "series", "trabajo", "amor", "mundo"] as const;

export default function SpeakeasiesPage() {
  const { profile, isFacilitator } = useProfile();
  const [speakeasies, setSpeakeasies] = useState<DbSpeakeasy[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | Topic>("todos");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: rows } = await supabase
        .from("speakeasies")
        .select(`
          id, title, topic, description, date, time, meeting_url,
          facilitator_id, level, max_participants,
          participants ( user_id, profiles ( avatar, name ) ),
          profiles!facilitator_id ( name, avatar )
        `)
        .order("date", { ascending: true });

      setSpeakeasies((rows as unknown as DbSpeakeasy[]) ?? []);

      if (profile?.id) {
        const [{ data: mine }, { data: favs }] = await Promise.all([
          supabase.from("participants").select("speakeasy_id").eq("user_id", profile.id),
          supabase.from("favorites").select("speakeasy_id").eq("user_id", profile.id),
        ]);
        setJoinedIds((mine ?? []).map((r: any) => r.speakeasy_id));
        setFavoriteIds((favs ?? []).map((r: any) => r.speakeasy_id));
      }

      setLoading(false);
    }

    fetchData();
  }, [profile?.id]);

  async function handleToggleFavorite(id: string) {
    if (!profile?.id) return;
    const supabase = createClient();
    const isFav = favoriteIds.includes(id);
    if (isFav) {
      setFavoriteIds((prev) => prev.filter((f) => f !== id));
      await supabase.from("favorites").delete().eq("user_id", profile.id).eq("speakeasy_id", id);
    } else {
      setFavoriteIds((prev) => [...prev, id]);
      await supabase.from("favorites").insert({ user_id: profile.id, speakeasy_id: id });
    }
  }

  const filtered = speakeasies.filter((s) => {
    const matchTopic = filter === "todos" || s.topic === filter;
    const matchSearch = search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  const available = speakeasies.filter((s) => (s.participants?.length ?? 0) < s.max_participants).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 700, color: "#1E1B2E", lineHeight: 1.15 }}>
              Speakeasies disponibles
            </h1>
            {isFacilitator && (
              <div className="sm:hidden flex gap-2">
                <Link href="/speakeasies/crear?express=1"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
                  style={{ background: "rgba(255,158,79,.12)", color: "#FF9E4F", fontFamily: "'Nunito', sans-serif", border: "1.5px solid rgba(255,158,79,.3)", marginTop: 4 }}>
                  ⚡ Exprés
                </Link>
                <Link href="/speakeasies/crear"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #845EC2, #6d4aab)", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 16px rgba(132,94,194,.3)", marginTop: 4 }}>
                  + Crear
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <p style={{ color: "#4A4560", fontSize: ".9rem" }}>
              Grupos de 4 personas · 60 min · 100% conversacional
            </p>
            {isFacilitator && (
              <div className="hidden sm:flex gap-2">
                <Link href="/speakeasies/crear?express=1"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                  style={{ background: "rgba(255,158,79,.12)", color: "#FF9E4F", fontFamily: "'Nunito', sans-serif", border: "1.5px solid rgba(255,158,79,.3)" }}>
                  ⚡ Exprés
                </Link>
                <Link href="/speakeasies/crear"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #845EC2, #6d4aab)", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 16px rgba(132,94,194,.3)" }}>
                  + Crear Speakeasy
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Esta semana", value: loading ? "…" : speakeasies.length, color: "#845EC2", bg: "rgba(132,94,194,.08)", icon: "📅" },
            { label: "Con lugar",   value: loading ? "…" : available,          color: "#06D6A0", bg: "rgba(6,214,160,.08)",    icon: "✅" },
            { label: "Me anoté",   value: loading ? "…" : joinedIds.length,    color: "#FF6B6B", bg: "rgba(255,107,107,.08)", icon: "🙋" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4"
              style={{ background: "white", border: "1.5px solid rgba(132,94,194,.1)", padding: "14px 12px" }}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                style={{ background: stat.bg }}>
                {stat.icon}
              </div>
              <div className="text-center sm:text-left">
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ color: "#8E8AA0", fontSize: ".72rem", fontWeight: 600, marginTop: 2 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters + View toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base" aria-hidden="true">🔍</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tema o título…"
              style={{
                width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
                borderRadius: 50, border: "1.5px solid rgba(132,94,194,.15)", background: "white",
                fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", color: "#1E1B2E", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile: custom dropdown */}
            <div className="sm:hidden relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  paddingLeft: 14, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                  borderRadius: 50, border: `1.5px solid ${dropdownOpen || filter !== "todos" ? "#845EC2" : "rgba(132,94,194,.18)"}`,
                  background: dropdownOpen || filter !== "todos" ? "rgba(132,94,194,.08)" : "white",
                  fontFamily: "'Nunito', sans-serif", fontSize: ".88rem", fontWeight: 700,
                  color: filter !== "todos" ? "#845EC2" : "#4A4560", cursor: "pointer", transition: "all .15s",
                }}>
                <span>
                  {filter === "todos" ? "Todos los temas" : `${TOPIC_META[filter as Topic].emoji} ${TOPIC_META[filter as Topic].label}`}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
                  background: "white", borderRadius: 16, padding: 6, minWidth: 180,
                  border: "1.5px solid rgba(132,94,194,.15)", boxShadow: "0 8px 32px rgba(132,94,194,.18)",
                }}>
                  {TOPICS.map((t) => {
                    const meta = t !== "todos" ? TOPIC_META[t as Topic] : null;
                    const isActive = filter === t;
                    return (
                      <button key={t} onClick={() => { setFilter(t); setDropdownOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                          fontFamily: "'Nunito', sans-serif", fontSize: ".88rem", fontWeight: 700,
                          background: isActive ? "rgba(132,94,194,.1)" : "transparent",
                          color: isActive ? "#845EC2" : "#4A4560", transition: "background .12s",
                          textAlign: "left",
                        }}>
                        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{meta ? meta.emoji : "🌐"}</span>
                        <span>{meta ? meta.label : "Todos los temas"}</span>
                        {isActive && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#845EC2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop: pills */}
            {TOPICS.map((t) => {
              const isActive = filter === t;
              const meta = t !== "todos" ? TOPIC_META[t] : null;
              return (
                <button key={t} onClick={() => setFilter(t)}
                  className="hidden sm:block px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: isActive ? "#845EC2" : "white",
                    color: isActive ? "white" : "#4A4560",
                    border: `1.5px solid ${isActive ? "#845EC2" : "rgba(132,94,194,.18)"}`,
                    boxShadow: isActive ? "0 4px 12px rgba(132,94,194,.25)" : "none",
                  }}>
                  {meta ? `${meta.emoji} ${meta.label}` : "Todos"}
                </button>
              );
            })}

            {/* View toggle */}
            <div className="flex items-center rounded-xl overflow-hidden ml-auto sm:ml-0 flex-shrink-0"
              style={{ border: "1.5px solid rgba(132,94,194,.18)", background: "white" }}>
              <button onClick={() => setView("grid")} aria-label="Vista cuadrícula"
                style={{ padding: "8px 10px", background: view === "grid" ? "rgba(132,94,194,.1)" : "transparent", color: view === "grid" ? "#845EC2" : "#A09CB5", transition: "all .15s", display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              </button>
              <button onClick={() => setView("list")} aria-label="Vista lista"
                style={{ padding: "8px 10px", background: view === "list" ? "rgba(132,94,194,.1)" : "transparent", color: view === "list" ? "#845EC2" : "#A09CB5", transition: "all .15s", display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-3"}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: view === "grid" ? 280 : 72, borderRadius: 16, background: "white", border: "1.5px solid rgba(132,94,194,.08)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ background: "white", border: "1.5px dashed rgba(132,94,194,.2)" }}>
            <p style={{ fontSize: "3.5rem", marginBottom: 12 }}>🔍</p>
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.3rem", fontWeight: 600, color: "#4A4560", marginBottom: 6 }}>
              {speakeasies.length === 0 ? "Todavía no hay grupos creados." : "No hay grupos con ese filtro."}
            </p>
            <p style={{ color: "#8E8AA0", fontSize: ".9rem", marginBottom: 20 }}>
              {isFacilitator ? "¡Creá el primero!" : "Volvé pronto, los facilitadores están armando grupos."}
            </p>
            {isFacilitator && (
              <Link href="/speakeasies/crear"
                className="inline-block px-6 py-3 rounded-full text-sm font-bold text-white"
                style={{ background: "#845EC2", fontFamily: "'Nunito', sans-serif" }}>
                Crear Speakeasy
              </Link>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <SpeakeasyCard key={s.id} speakeasy={s} view="grid"
                joined={joinedIds.includes(s.id)}
                favorited={favoriteIds.includes(s.id)}
                onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((s) => (
              <SpeakeasyCard key={s.id} speakeasy={s} view="list"
                joined={joinedIds.includes(s.id)}
                favorited={favoriteIds.includes(s.id)}
                onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
