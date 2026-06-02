"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "register";
type Level = "básico" | "intermedio" | "avanzado";

const QUIZ = [
  {
    q: "You're at a restaurant abroad. How do you ask for the bill?",
    options: ["Can I have the check, please?", "Give me the money paper.", "I want pay now.", "Check me!"],
    correct: 0,
  },
  {
    q: 'Complete the sentence: "I ___ to Paris three times."',
    options: ["was", "have been", "went", "did go"],
    correct: 1,
  },
  {
    q: 'Your friend says "I\'m under the weather." What does this mean?',
    options: ["They\'re outside in the rain.", "They\'re feeling sick.", "They\'re very happy.", "They forgot their umbrella."],
    correct: 1,
  },
  {
    q: "Which sentence is correct?",
    options: ["I'm boring in this class.", "I'm bored in this class.", "I bored in this class.", "I'm boring with this."],
    correct: 1,
  },
  {
    q: 'A colleague says "Let\'s touch base next week." What does this mean?',
    options: ["Let\'s play baseball.", "Let\'s go to the beach.", "Let\'s check in / meet briefly.", "Let\'s stop working."],
    correct: 2,
  },
];

const LEVEL_RESULT: Record<Level, { emoji: string; title: string; desc: string; color: string; bg: string }> = {
  básico:     { emoji: "🌱", title: "Básico",     color: "#06D6A0", bg: "rgba(6,214,160,.08)",    desc: "Estás arrancando y está perfecto. En Conversa practicás en un ambiente sin presión donde equivocarse es parte del proceso." },
  intermedio: { emoji: "🚀", title: "Intermedio", color: "#FF9E4F", bg: "rgba(255,158,79,.08)",   desc: "Ya podés mantener una conversación. En Conversa vas a ganar fluidez real hablando de temas que te interesan." },
  avanzado:   { emoji: "⚡", title: "Avanzado",   color: "#845EC2", bg: "rgba(132,94,194,.08)",   desc: "Tu inglés es sólido. En Conversa vas a usarlo en conversaciones profundas sobre temas que realmente te importan." },
};

const TOPICS = [
  { id: "viajes", emoji: "✈️", label: "Viajes" },
  { id: "musica", emoji: "🎵", label: "Música" },
  { id: "series", emoji: "🍿", label: "Series" },
  { id: "trabajo", emoji: "💼", label: "Trabajo" },
  { id: "amor", emoji: "❤️", label: "Amor" },
  { id: "mundo", emoji: "🌍", label: "Mundo" },
];

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("register");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [detectedLevel, setDetectedLevel] = useState<Level>("básico");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    age: "",
    city: "",
    bio: "",
    gender: "",
    topics: [] as string[],
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleQuizAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);
    const newAnswers = [...quizAnswers, optionIndex];

    setTimeout(() => {
      if (quizIndex < QUIZ.length - 1) {
        setQuizAnswers(newAnswers);
        setQuizIndex((i) => i + 1);
        setSelectedOption(null);
      } else {
        const correct = newAnswers.filter((a, i) => a === QUIZ[i].correct).length;
        const level: Level = correct <= 1 ? "básico" : correct <= 3 ? "intermedio" : "avanzado";
        setDetectedLevel(level);
        setQuizAnswers(newAnswers);
        setQuizDone(true);
      }
    }, 900);
  };

  const toggleTopic = (t: string) => {
    setForm((f) => ({
      ...f,
      topics: f.topics.includes(t) ? f.topics.filter((x) => x !== t) : [...f.topics, t],
    }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "register" && step === 1) {
      if (!form.name || !form.email || !form.password) {
        setError("Completá todos los campos.");
        return;
      }
      if (form.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      setStep(2);
      return;
    }

    if (tab === "register" && step === 2) {
      setStep(3);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (tab === "register") {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            age: form.age ? parseInt(form.age) : null,
            city: form.city,
            bio: form.bio,
            gender: form.gender || null,
            avatar: form.name.charAt(0).toUpperCase(),
            english_level: detectedLevel,
            topics: form.topics,
          },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setError("Este email ya tiene una cuenta. Iniciá sesión en vez de registrarte.");
        } else if (msg.includes("password")) {
          setError("La contraseña debe tener al menos 8 caracteres.");
        } else if (msg.includes("email")) {
          setError("El email no es válido.");
        } else {
          setError("Algo salió mal. Intentá de nuevo.");
        }
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) { setError("Email o contraseña incorrectos."); setLoading(false); return; }
    }

    setLoading(false);
    router.push("/speakeasies");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E1B2E 0%, #2d1f4e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: "absolute", width: 400, height: 400, background: "#845EC2", borderRadius: "50%", filter: "blur(80px)", opacity: 0.2, top: -100, left: -100 }} />
          <div style={{ position: "absolute", width: 300, height: 300, background: "#FF6B6B", borderRadius: "50%", filter: "blur(80px)", opacity: 0.15, bottom: -80, right: -60 }} />
        </div>

        <a href="/" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "white", textDecoration: "none", position: "relative", zIndex: 1 }}>
          Conver<span style={{ color: "#FF6B6B" }}>sa</span>
        </a>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "2.8rem", fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 16 }}>
            Hello,<br />Stranger.
          </p>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: "1rem", lineHeight: 1.7, maxWidth: 360 }}>
            Dejá de estudiar inglés.<br />
            Empezá a hablarlo.
          </p>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".88rem", lineHeight: 1.7, maxWidth: 360, marginTop: 10 }}>
            Grupos pequeños, temas que te interesan, sin presión de hablar perfecto.
          </p>
        </div>

        {/* Testimonial */}
        <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: "24px", position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,.85)", fontSize: ".9rem", lineHeight: 1.7, fontStyle: "italic", marginBottom: 16 }}>
            "Después de 3 sesiones perdí el miedo de hablar. Ahora uso el inglés en mi trabajo todos los días."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #FF6B6B, #FF9E4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: ".85rem", fontWeight: 700 }}>M</div>
            <div>
              <p style={{ color: "white", fontSize: ".85rem", fontWeight: 700 }}>Martina R.</p>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".75rem" }}>31 años · Buenos Aires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <a href="/" className="lg:hidden block mb-8 text-center" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#845EC2", textDecoration: "none" }}>
            Conver<span style={{ color: "#FF6B6B" }}>sa</span>
          </a>

          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(132,94,194,.08)", borderRadius: 16, padding: 4, marginBottom: 32 }}>
            {(["register", "login"] as Tab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setStep(1); setError(""); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", fontWeight: 700,
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#845EC2" : "#8E8AA0",
                  boxShadow: tab === t ? "0 2px 8px rgba(132,94,194,.12)" : "none",
                  transition: "all .2s",
                }}>
                {t === "register" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            {/* REGISTER STEP 1 */}
            {tab === "register" && step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                    Empecemos
                  </h2>
                  <p style={{ color: "#8E8AA0", fontSize: ".9rem" }}>Paso 1 de 3 · Los básicos</p>
                </div>

                <Field label="¿Cómo te llamás?" id="name">
                  <Input id="name" type="text" placeholder="Tu nombre" value={form.name} onChange={(v) => set("name", v)} />
                </Field>
                <Field label="Email" id="email">
                  <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={(v) => set("email", v)} />
                </Field>
                <Field label="Contraseña" id="password">
                  <PasswordInput id="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(v) => set("password", v)} show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
                </Field>
                <Field label="Confirmá tu contraseña" id="confirmPassword">
                  <PasswordInput id="confirmPassword" placeholder="Repetí tu contraseña" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} show={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />
                </Field>

                {error && <p style={{ color: "#FF6B6B", fontSize: ".85rem", fontWeight: 600 }}>{error}</p>}

                <SubmitBtn loading={loading}>Continuar →</SubmitBtn>
              </div>
            )}

            {/* REGISTER STEP 2 */}
            {tab === "register" && step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#845EC2", fontSize: ".85rem", fontWeight: 700, padding: 0, marginBottom: 8 }}>
                    ← Volver
                  </button>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                    Contanos un poco
                  </h2>
                  <p style={{ color: "#8E8AA0", fontSize: ".9rem" }}>Paso 2 de 3 · Tu perfil</p>
                </div>

                {/* Género */}
                <div>
                  <p style={{ fontSize: ".85rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 8 }}>¿Con qué género te identificás?</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: "femenino",   label: "Femenino" },
                      { value: "masculino",  label: "Masculino" },
                      { value: "no-binario", label: "No binario" },
                    ].map((g) => (
                      <button type="button" key={g.value} onClick={() => set("gender", g.value)}
                        style={{
                          flex: 1, padding: "10px 8px", borderRadius: 14, cursor: "pointer",
                          fontFamily: "'Nunito', sans-serif", fontSize: ".82rem", fontWeight: 700,
                          border: `1.5px solid ${form.gender === g.value ? "#845EC2" : "rgba(132,94,194,.15)"}`,
                          background: form.gender === g.value ? "rgba(132,94,194,.08)" : "var(--bg)",
                          color: form.gender === g.value ? "#845EC2" : "#4A4560",
                          transition: "all .15s",
                        }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Edad" id="age">
                    <Input id="age" type="number" placeholder="35" value={form.age} onChange={(v) => set("age", v)} />
                  </Field>
                  <Field label="Ciudad" id="city">
                    <Input id="city" type="text" placeholder="Buenos Aires" value={form.city} onChange={(v) => set("city", v)} />
                  </Field>
                </div>

                <Field label="Bio corta (opcional)" id="bio">
                  <textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)}
                    placeholder="Diseñadora. Fan de los viajes y los 90s."
                    rows={2}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 16, border: "1.5px solid rgba(132,94,194,.15)", background: "var(--bg)", fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", color: "#1E1B2E", outline: "none", resize: "none" }}
                  />
                </Field>

                <div>
                  <p style={{ fontSize: ".85rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 10 }}>
                    ¿Qué temas te interesan?
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {TOPICS.map((t) => {
                      const sel = form.topics.includes(t.id);
                      return (
                        <button type="button" key={t.id} onClick={() => toggleTopic(t.id)}
                          style={{
                            padding: "10px 8px", borderRadius: 14, border: `1.5px solid ${sel ? "#845EC2" : "rgba(132,94,194,.15)"}`,
                            background: sel ? "rgba(132,94,194,.08)" : "var(--bg)", cursor: "pointer",
                            fontFamily: "'Nunito', sans-serif", fontSize: ".8rem", fontWeight: 700,
                            color: sel ? "#845EC2" : "#4A4560", transition: "all .15s",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                          <span style={{ fontSize: "1.3rem" }}>{t.emoji}</span>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <p style={{ color: "#FF6B6B", fontSize: ".85rem", fontWeight: 600 }}>{error}</p>}
                <SubmitBtn loading={loading}>Continuar →</SubmitBtn>
              </div>
            )}

            {/* REGISTER STEP 3 — Quiz de inglés */}
            {tab === "register" && step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <button type="button" onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", color: "#845EC2", fontSize: ".85rem", fontWeight: 700, padding: 0, marginBottom: 8 }}>
                    ← Volver
                  </button>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                    ¿Cómo va tu inglés?
                  </h2>
                  <p style={{ color: "#8E8AA0", fontSize: ".9rem" }}>Paso 3 de 3 · 5 preguntas rápidas para encontrarte con personas de tu nivel</p>
                </div>

                {!quizDone ? (
                  <>
                    {/* Progress bar */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {QUIZ.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= quizIndex ? "#845EC2" : "rgba(132,94,194,.15)", transition: "background .3s" }} />
                      ))}
                    </div>

                    {/* Question */}
                    <div style={{ background: "white", borderRadius: 20, padding: "20px 20px 16px", border: "1.5px solid rgba(132,94,194,.12)" }}>
                      <p style={{ fontSize: ".7rem", fontWeight: 800, color: "#845EC2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                        Pregunta {quizIndex + 1} de {QUIZ.length}
                      </p>
                      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.1rem", fontWeight: 600, color: "#1E1B2E", lineHeight: 1.4 }}>
                        {QUIZ[quizIndex].q}
                      </p>
                    </div>

                    {/* Options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {QUIZ[quizIndex].options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === QUIZ[quizIndex].correct;
                        const revealed = selectedOption !== null;
                        let bg = "white";
                        let border = "rgba(132,94,194,.15)";
                        let color = "#1E1B2E";
                        if (revealed && isSelected && isCorrect)  { bg = "rgba(6,214,160,.08)";  border = "#06D6A0"; color = "#06D6A0"; }
                        if (revealed && isSelected && !isCorrect) { bg = "rgba(255,107,107,.08)"; border = "#FF6B6B"; color = "#FF6B6B"; }
                        if (revealed && !isSelected && isCorrect) { bg = "rgba(6,214,160,.06)";  border = "#06D6A0"; color = "#06D6A0"; }
                        return (
                          <button type="button" key={i} onClick={() => handleQuizAnswer(i)} disabled={revealed}
                            style={{
                              padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${border}`,
                              background: bg, cursor: revealed ? "default" : "pointer",
                              fontFamily: "'Nunito', sans-serif", fontSize: ".9rem", fontWeight: 600,
                              color, textAlign: "left", transition: "all .25s",
                            }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Result */
                  <>
                    <div style={{ background: LEVEL_RESULT[detectedLevel].bg, border: `1.5px solid ${LEVEL_RESULT[detectedLevel].color}30`, borderRadius: 20, padding: 24, textAlign: "center" }}>
                      <p style={{ fontSize: "3rem", marginBottom: 8 }}>{LEVEL_RESULT[detectedLevel].emoji}</p>
                      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: LEVEL_RESULT[detectedLevel].color, marginBottom: 8 }}>
                        Tu nivel: {LEVEL_RESULT[detectedLevel].title}
                      </p>
                      <p style={{ fontSize: ".88rem", color: "#4A4560", lineHeight: 1.6 }}>
                        {LEVEL_RESULT[detectedLevel].desc}
                      </p>
                      <p style={{ fontSize: ".8rem", color: "#8E8AA0", marginTop: 12 }}>
                        Respondiste bien {quizAnswers.filter((a, i) => a === QUIZ[i].correct).length} de {QUIZ.length} preguntas
                      </p>
                    </div>
                    <p style={{ fontSize: ".8rem", color: "#8E8AA0", textAlign: "center" }}>
                      Podés cambiar tu nivel en cualquier momento desde tu perfil.
                    </p>
                    {error && <p style={{ color: "#FF6B6B", fontSize: ".85rem", fontWeight: 600 }}>{error}</p>}
                    <SubmitBtn loading={loading}>Crear mi cuenta 🎉</SubmitBtn>
                  </>
                )}
              </div>
            )}

            {/* LOGIN */}
            {tab === "login" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 4 }}>
                    Bienvenido de vuelta
                  </h2>
                  <p style={{ color: "#8E8AA0", fontSize: ".9rem" }}>Tu próxima conversación te está esperando.</p>
                </div>

                <Field label="Email" id="login-email">
                  <Input id="login-email" type="email" placeholder="tu@email.com" value={form.email} onChange={(v) => set("email", v)} />
                </Field>
                <Field label="Contraseña" id="login-password">
                  <PasswordInput id="login-password" placeholder="••••••••" value={form.password} onChange={(v) => set("password", v)} show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
                </Field>

                {error && <p style={{ color: "#FF6B6B", fontSize: ".85rem", fontWeight: 600 }}>{error}</p>}
                <SubmitBtn loading={loading}>Entrar</SubmitBtn>

                <p style={{ textAlign: "center", fontSize: ".82rem", color: "#8E8AA0" }}>
                  ¿Olvidaste tu contraseña?{" "}
                  <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#845EC2", fontWeight: 700, padding: 0 }}>
                    Recuperar
                  </button>
                </p>
              </div>
            )}
          </form>

          <p style={{ textAlign: "center", fontSize: ".8rem", color: "#8E8AA0", marginTop: 24 }}>
            Al registrarte aceptás los términos de uso de Conversa.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers de UI ── */
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#1E1B2E", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ id, type, placeholder, value, onChange }: { id: string; type: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input id={id} type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 16,
        border: "1.5px solid rgba(132,94,194,.15)", background: "var(--bg)",
        fontFamily: "'Nunito', sans-serif", fontSize: ".95rem", color: "#1E1B2E", outline: "none",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")}
    />
  );
}

function PasswordInput({ id, placeholder, value, onChange, show, onToggle }: {
  id: string; placeholder: string; value: string;
  onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input id={id} type={show ? "text" : "password"} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "12px 44px 12px 16px", borderRadius: 16,
          border: "1.5px solid rgba(132,94,194,.15)", background: "var(--bg)",
          fontFamily: "'Nunito', sans-serif", fontSize: ".95rem", color: "#1E1B2E", outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#845EC2")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(132,94,194,.15)")}
      />
      <button type="button" onClick={onToggle} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", padding: 4,
          color: "#8E8AA0", display: "flex", alignItems: "center",
        }}>
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      style={{
        width: "100%", padding: "14px", borderRadius: 50, border: "none", cursor: loading ? "not-allowed" : "pointer",
        background: "linear-gradient(135deg, #845EC2, #6d4aab)", color: "white",
        fontFamily: "'Nunito', sans-serif", fontSize: "1rem", fontWeight: 800,
        boxShadow: "0 6px 20px rgba(132,94,194,.35)", opacity: loading ? 0.7 : 1,
        transition: "opacity .2s, transform .15s",
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
    >
      {loading ? "Un momento…" : children}
    </button>
  );
}
