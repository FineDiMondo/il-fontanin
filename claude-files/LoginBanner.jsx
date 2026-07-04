// ============================================================
// EL FONTANIN — BANNER "ACCEDI CON GOOGLE" (Guest Mode)
// File: src/components/LoginBanner.jsx
// Sostituisce i banner grezzi in ForumCategory.jsx, ForumThread.jsx,
// EventDetail.jsx con un'unica card riusabile e coerente.
//
// Uso:
//   <LoginBanner context="forum" />    // "Per scrivere nel forum…"
//   <LoginBanner context="thread" />   // "Per rispondere…"
//   <LoginBanner context="event" />    // "Per iscriverti all'evento…"
//
// Contratto con AuthContext: signInWithGoogle() (popup già esistente).
// ============================================================

import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const COPY = {
  forum:  { verb: "scrivere nel forum",   icon: "✏️" },
  thread: { verb: "rispondere",           icon: "💬" },
  event:  { verb: "iscriverti all'evento", icon: "📅" },
  default:{ verb: "partecipare",          icon: "🌿" },
};

export default function LoginBanner({ context = "default" }) {
  const { signInWithGoogle } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const { verb, icon } = COPY[context] ?? COPY.default;

  const handleLogin = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      aria-label="Accesso richiesto"
      className="fn-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        flexWrap: "wrap",
        /* filo d'acqua a sinistra: firma visiva della risorgiva */
        borderLeft: "4px solid var(--fn-acqua-600)",
      }}
    >
      <div className="fn-icon-cat" aria-hidden="true" style={{ flexShrink: 0 }}>
        {icon}
      </div>

      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--fn-text-base)",
            fontWeight: 600,
            color: "var(--fn-humus-900)",
          }}
        >
          Sei il benvenuto anche così.
        </p>
        <p
          style={{
            margin: ".25rem 0 0",
            fontSize: "var(--fn-text-sm)",
            color: "var(--fn-humus-700)",
            lineHeight: "var(--fn-leading-body)",
          }}
        >
          Per {verb} entra con il tuo account Google: bastano due tocchi.
        </p>
      </div>

      <button
        type="button"
        className="fn-btn fn-btn--primary"
        onClick={handleLogin}
        disabled={busy}
        style={{ flexShrink: 0 }}
      >
        {busy ? "Un attimo…" : "Entra con Google"}
      </button>
    </aside>
  );
}
