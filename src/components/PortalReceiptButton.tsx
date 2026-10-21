import { useRef, useState } from "react";
export function PortalReceiptButton({
  token,
  id,
  chargeId,
}: {
  token: string;
  id?: string;
  chargeId?: string;
}) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams(
        id ? { id } : { chargeId: chargeId || "" },
      );
      const response = await fetch(`/api/portal/receipt?${params}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw Error("Não foi possível abrir o comprovante.");
      setHtml(await response.text());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="button button-ghost button-small"
        disabled={busy}
        onClick={() => void load()}
      >
        {busy ? "Abrindo…" : "Comprovante"}
      </button>
      {error && <span role="alert">{error}</span>}
      {html && (
        <div className="editor-backdrop">
          <section
            className="portal-card portal-receipt-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Meu comprovante"
          >
            <header>
              <h2>Comprovante</h2>
              <button
                className="button button-ghost"
                onClick={() => setHtml("")}
              >
                Fechar
              </button>
            </header>
            <iframe
              ref={frame}
              title="Comprovante de pagamento"
              srcDoc={html}
            />
            <button
              className="button"
              onClick={() => frame.current?.contentWindow?.print()}
            >
              Imprimir / salvar PDF
            </button>
          </section>
        </div>
      )}
    </>
  );
}
