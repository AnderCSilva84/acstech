import { useState } from "react";
export function ReceiptShare({
  clientId,
  id,
  chargeId,
  phone,
  email: initialEmail,
  description,
}: {
  clientId: string;
  id?: string;
  chargeId?: string;
  phone?: string;
  email?: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState(initialEmail || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function prepare() {
    setOpen(true);
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/portal/receipt-share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ clientId, id, chargeId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Falha ao preparar comprovante.");
      setUrl(result.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/receipt-share", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId,
          id,
          chargeId,
          action: "email",
          email,
        }),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? "E-mail aceito pelo provedor para envio."
          : result.error || "Não foi possível enviar.",
      );
    } catch {
      setMessage("Falha de conexão. Confira antes de tentar novamente.");
    } finally {
      setBusy(false);
    }
  }
  const digits = phone?.replace(/\D/g, "") || "";
  const destination = digits.startsWith("55") ? digits : `55${digits}`;
  return (
    <>
      <button
        type="button"
        className="button button-ghost button-small"
        onClick={() => void prepare()}
      >
        Compartilhar
      </button>
      {open && (
        <div className="editor-backdrop">
          <section
            className="portal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Compartilhar comprovante"
          >
            <h2>Compartilhar comprovante</h2>
            <p>{description}</p>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Fechar
            </button>
            {url && (
              <>
                <a
                  className="button"
                  href={`https://wa.me/${digits ? destination : ""}?text=${encodeURIComponent(`Olá! Segue o comprovante de ${description}:\n${url}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Compartilhar via WhatsApp
                </a>
                <p>O link permite consultar este comprovante por 30 dias.</p>
              </>
            )}
            <label>
              E-mail do cliente
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="button"
              disabled={busy || !url || !email}
              onClick={() => void send()}
            >
              Enviar por e-mail
            </button>
            {busy && <p role="status">Processando…</p>}
            {message && <p role="status">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
