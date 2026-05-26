"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";

export default function Navbar() {
  const path = usePathname();
  const { profile, isFacilitator } = useProfile();

  const avatar = profile?.avatar ?? "?";
  const name = profile?.name ?? "";

  const navLinks = [
    { href: "/speakeasies", label: "Speakeasies" },
    ...(isFacilitator ? [{ href: "/speakeasies/crear", label: "Crear grupo" }] : []),
  ];

  return (
    <>
      {/* ── Top navbar ── */}
      <nav className="sticky top-0 z-50"
        style={{ background: "rgba(255,251,245,.96)", borderBottom: "1px solid rgba(132,94,194,.1)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-15"
          style={{ height: 60 }}>

          {/* Logo */}
          <Link href="/speakeasies" style={{ textDecoration: "none", flexShrink: 0, flex: 1 }}>
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#845EC2", letterSpacing: "-0.3px" }}>
              Conver<span style={{ color: "#FF6B6B" }}>sa</span>
            </span>
          </Link>

          {/* Right — links + avatar */}
          <div className="flex items-center gap-1">
            {navLinks.map((l) => {
              const active = path === l.href || (l.href !== "/speakeasies" && path.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} className="hidden sm:block" style={{ textDecoration: "none" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "6px 16px",
                    borderRadius: 50,
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: ".88rem",
                    fontWeight: 700,
                    color: active ? "#845EC2" : "#6B6882",
                    background: active ? "rgba(132,94,194,.1)" : "transparent",
                    transition: "all .15s",
                  }}>
                    {l.label}
                  </span>
                </Link>
              );
            })}
          <Link href="/perfil" style={{ textDecoration: "none" }}>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-all hover:bg-purple-50"
              style={{ cursor: "pointer" }}>
              {name && (
                <span className="hidden sm:block text-sm font-bold" style={{ color: "#4A4560", fontFamily: "'Nunito', sans-serif" }}>
                  {name.split(" ")[0]}
                </span>
              )}
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6B6B, #FF9E4F)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: ".85rem", fontWeight: 700,
                boxShadow: "0 2px 8px rgba(255,107,107,.35)",
              }}>
                {avatar}
              </div>
            </div>
          </Link>
          </div>

        </div>
      </nav>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "rgba(255,251,245,.97)", borderTop: "1px solid rgba(132,94,194,.1)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", height: 60 }}>

          {/* Speakeasies */}
          <BottomTab href="/speakeasies" active={path === "/speakeasies"} label="Grupos">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </BottomTab>

          {/* Crear — solo facilitadores */}
          {isFacilitator && (
            <BottomTab href="/speakeasies/crear" active={path === "/speakeasies/crear"} label="Crear">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </BottomTab>
          )}

          {/* Perfil */}
          <BottomTab href="/perfil" active={path === "/perfil"} label="Mi perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </BottomTab>

        </div>
      </nav>

    </>
  );
}

function BottomTab({ href, active, label, children }: { href: string; active: boolean; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: "none", flex: 1 }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", gap: 3,
        color: active ? "#845EC2" : "#A09CB5",
        transition: "color .15s",
      }}>
        <div style={{ position: "relative" }}>
          {children}
          {active && (
            <span style={{
              position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
              width: 4, height: 4, borderRadius: "50%", background: "#845EC2",
            }} />
          )}
        </div>
        <span style={{ fontSize: ".65rem", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{label}</span>
      </div>
    </Link>
  );
}
