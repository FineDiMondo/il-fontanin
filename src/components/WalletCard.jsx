import { useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext.jsx";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export default function WalletCard() {
  const { isConnected, connectWallet, algorandAddress: address } = useWallet();
  const [status, setStatus] = useState("idle"); // idle | connecting | error
  const [copied, setCopied] = useState(false);

  const handleConnect = useCallback(async () => {
    setStatus("connecting");
    try {
      await connectWallet();
      setStatus("idle");
    } catch (err) {
      console.error("Wallet unlock failed:", err?.message); // mai loggare oggetti chiave
      setStatus("error");
    }
  }, [connectWallet]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponibile (webview): fallback silenzioso,
         l'indirizzo resta selezionabile a mano */
    }
  }, [address]);

  return (
    <section
      aria-labelledby="wallet-title"
      className="fn-card"
      style={{ padding: "1.5rem", maxWidth: 560 }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="fn-icon-cat" aria-hidden="true">💧</div>
        <div>
          <h2
            id="wallet-title"
            style={{
              fontSize: "var(--fn-text-xl)",
              color: "var(--fn-humus-900)",
              margin: 0,
            }}
          >
            Il tuo portafoglio
          </h2>
          <p
            style={{
              fontSize: "var(--fn-text-sm)",
              color: "var(--fn-humus-700)",
              margin: ".25rem 0 0",
              lineHeight: "var(--fn-leading-body)",
            }}
          >
            Qui ricevi e custodisci i tuoi gettoni «f» della comunità.
          </p>
        </div>
      </header>

      <div style={{ marginTop: "1.25rem" }}>
        {/* ---- STATO: NON CONNESSO -------------------------------- */}
        {!isConnected && status !== "connecting" && (
          <>
            <p
              style={{
                fontSize: "var(--fn-text-base)",
                color: "var(--fn-humus-700)",
                lineHeight: "var(--fn-leading-body)",
              }}
            >
              Il portafoglio è chiuso. Aprilo quando ti serve: la tua chiave
              resta solo tua, nessuno dell'associazione può vederla.
            </p>
            <button
              type="button"
              className="fn-btn fn-btn--primary"
              onClick={handleConnect}
            >
              Apri il portafoglio
            </button>
            {status === "error" && (
              <p
                role="alert"
                style={{
                  marginTop: ".75rem",
                  fontSize: "var(--fn-text-sm)",
                  color: "var(--fn-humus-900)",
                  background: "var(--fn-humus-100)",
                  borderRadius: 8,
                  padding: ".625rem .875rem",
                }}
              >
                L'apertura non è riuscita. Controlla la connessione e riprova
                con il pulsante qui sopra.
              </p>
            )}
          </>
        )}

        {/* ---- STATO: CONNESSIONE IN CORSO ------------------------- */}
        {status === "connecting" && (
          <p
            role="status"
            aria-live="polite"
            style={{
              fontSize: "var(--fn-text-base)",
              color: "var(--fn-humus-700)",
            }}
          >
            Sto aprendo il portafoglio in modo sicuro… pochi secondi.
          </p>
        )}

        {/* ---- STATO: CONNESSO -------------------------------------- */}
        {isConnected && (
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "var(--fn-text-sm)",
                fontWeight: 700,
                letterSpacing: "var(--fn-tracking-caps)",
                textTransform: "uppercase",
                color: "var(--fn-bambu-700)",
                marginBottom: ".5rem",
              }}
            >
              ● Portafoglio aperto
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--fn-tap-gap)",
                flexWrap: "wrap",
              }}
            >
              <code
                title={address}
                style={{
                  fontSize: "var(--fn-text-base)",
                  background: "var(--fn-acqua-100)",
                  color: "var(--fn-humus-900)",
                  borderRadius: 8,
                  padding: ".5rem .75rem",
                  userSelect: "all",
                }}
              >
                {shorten(address)}
              </code>

              <button
                type="button"
                className="fn-btn fn-btn--ghost"
                onClick={handleCopy}
                aria-label="Copia l'indirizzo completo del portafoglio"
              >
                {copied ? "Copiato ✓" : "Copia indirizzo"}
              </button>

              <a
                className="fn-btn fn-btn--ghost"
                href={`https://allo.info/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vedi su Algorand
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
