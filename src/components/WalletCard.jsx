import { useState, useCallback, useEffect } from "react";
import { useWallet } from "../context/WalletContext.jsx";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

// ASA ID del gettone «f»: mai hardcodato. Se la env var non è impostata,
// la sezione saldo mostra un placeholder invece di un numero (o di un errore).
const ASA_ID = import.meta.env.VITE_FONTANIN_ASA_ID || null;
const INDEXER_BASE = "https://mainnet-idx.algonode.cloud/v2";

function formatTokenAmount(rawAmount, decimals) {
  if (!decimals) return String(rawAmount);
  const value = rawAmount / 10 ** decimals;
  return value.toLocaleString("it-IT", { maximumFractionDigits: decimals });
}

export default function WalletCard() {
  const { isConnected, connectWallet, algorandAddress: address } = useWallet();
  const [status, setStatus] = useState("idle"); // idle | connecting | error
  const [copied, setCopied] = useState(false);

  // ---- Saldo gettoni «f» via Algorand indexer (sola lettura, nessuna chiave coinvolta) ----
  const [tokenStatus, setTokenStatus] = useState("idle"); // idle | loading | ready | error | unavailable
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenUnitName, setTokenUnitName] = useState("");

  useEffect(() => {
    if (!isConnected || !address) return;
    if (!ASA_ID) {
      setTokenStatus("unavailable");
      return;
    }

    let cancelled = false;
    setTokenStatus("loading");

    (async () => {
      try {
        const [assetsRes, assetInfoRes] = await Promise.all([
          fetch(`${INDEXER_BASE}/accounts/${address}/assets`),
          fetch(`${INDEXER_BASE}/assets/${ASA_ID}`),
        ]);
        if (!assetsRes.ok || !assetInfoRes.ok) {
          throw new Error("Indexer non raggiungibile");
        }
        const assetsData = await assetsRes.json();
        const assetInfo = await assetInfoRes.json();

        const held = (assetsData.assets || []).find(
          (a) => String(a["asset-id"]) === String(ASA_ID)
        );
        const decimals = assetInfo?.asset?.params?.decimals ?? 0;
        const unitName = assetInfo?.asset?.params?.["unit-name"] || "";

        if (cancelled) return;
        setTokenUnitName(unitName);
        setTokenBalance(formatTokenAmount(Number(held?.amount ?? 0), decimals));
        setTokenStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Saldo token 'f' non disponibile:", err?.message); // mai loggare oggetti chiave
        setTokenStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

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

            {/* ---- Saldo gettoni «f» ---------------------------------- */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--fn-humus-100)",
              }}
            >
              <p
                style={{
                  fontSize: "var(--fn-text-sm)",
                  color: "var(--fn-humus-700)",
                  margin: "0 0 .375rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "var(--fn-tracking-caps)",
                }}
              >
                Saldo gettoni «f»
              </p>

              {tokenStatus === "unavailable" && (
                <p
                  style={{
                    fontSize: "var(--fn-text-base)",
                    color: "var(--fn-humus-700)",
                    margin: 0,
                  }}
                >
                  Saldo non disponibile
                </p>
              )}

              {tokenStatus === "loading" && (
                <p
                  role="status"
                  aria-live="polite"
                  style={{
                    fontSize: "var(--fn-text-base)",
                    color: "var(--fn-humus-700)",
                    margin: 0,
                  }}
                >
                  Verifica del saldo in corso…
                </p>
              )}

              {tokenStatus === "error" && (
                <p
                  role="alert"
                  style={{
                    fontSize: "var(--fn-text-sm)",
                    color: "var(--fn-humus-900)",
                    background: "var(--fn-humus-100)",
                    borderRadius: 8,
                    padding: ".5rem .75rem",
                    margin: 0,
                  }}
                >
                  Saldo non disponibile al momento. Riprova più tardi.
                </p>
              )}

              {tokenStatus === "ready" && (
                <p
                  style={{
                    fontSize: "var(--fn-text-xl)",
                    color: "var(--fn-humus-900)",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {tokenBalance} {tokenUnitName}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
