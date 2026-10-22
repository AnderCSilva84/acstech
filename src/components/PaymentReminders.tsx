import { useCallback, useEffect, useRef, useState } from "react";
type Data = {
  charges: {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
  }[];
  total: number;
  message: string;
  phone: string;
  email: string;
  emailValid: boolean;
  configured: boolean;
  enabled: boolean;
  health?: {
    ranAt: string;
    accepted: number;
    failed?: number;
    missingEmail?: number;
    eligible?: number;
    alreadySent?: number;
    enabled?: boolean;
  };
  history: {
    subject: string;
    status: string;
    attemptedAt: string;
    reason?: string;
    providerId?: string;
  }[];
};
const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
export function PaymentReminders({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("overdue");
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/portal/payment-reminders?clientId=${encodeURIComponent(clientId)}&scope=${scope}`,
        { credentials: "same-origin" },
      );
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Não foi possível consultar os lembretes.");
      setData(result);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }, [clientId, scope]);
  useEffect(() => {
    if (open) {
      requestId.current = crypto.randomUUID();
      void load();
    }
  }, [open, load]);
  async function send() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/payment-reminders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, scope, requestId: requestId.current }),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? "Lembrete aceito pelo provedor para envio."
          : result.error || "Não foi possível enviar.",
      );
      await load();
    } catch {
      setMessage(
        "Não foi possível confirmar o envio. Consulte o histórico antes de repetir.",
      );
    } finally {
      setBusy(false);
    }
  }
  const digits = data?.phone.replace(/\D/g, "") || "";
  const destination = digits.startsWith("55") ? digits : `55${digits}`;
  return (
    <>
      <button
        className="button button-ghost"
        type="button"
        onClick={() => setOpen(true)}
      >
        Lembretes de pagamento
      </button>
      {open && (
        <div className="editor-backdrop">
          <section
            className="portal-card payment-reminders-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Lembretes de pagamento"
          >
            <header>
              <div>
                <h2>Lembretes de pagamento</h2>
                <p>{clientName}</p>
              </div>
              <button
                className="button button-ghost"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </header>
            <label>
              Cobranças incluídas
              <select
                disabled={busy || loading}
                value={scope}
                onChange={(e) => {
                  setData(null);
                  setMessage("");
                  setScope(e.target.value);
                }}
              >
                <option value="overdue">Somente vencidas</option>
                <option value="open">Todas em aberto</option>
              </select>
            </label>
            {loading && <p role="status">Consultando…</p>}
            {data && !loading && (
              <>
                <p>
                  <strong>
                    Automático por e-mail:{" "}
                    {data.enabled
                      ? "ativado"
                      : "desativado ou sem configuração"}
                  </strong>
                  <br />2 dias antes, 1 dia após e depois a cada 2 dias até a
                  baixa.
                </p>
                {data.health?.ranAt && (
                  <p>
                    Última execução:{" "}
                    {new Date(data.health.ranAt).toLocaleString("pt-BR", {
                      timeZone: "America/Fortaleza",
                    })}
                    . Aceitos nesta execução: {data.health.accepted}. Falhas:{" "}
                    {data.health.failed || 0}. Sem e-mail:{" "}
                    {data.health.missingEmail || 0}.
                    {data.health.eligible !== undefined
                      ? ` Cobranças elegíveis: ${data.health.eligible}; avisos já enviados: ${data.health.alreadySent || 0}.`
                      : ""}
                  </p>
                )}
                <h3>Prévia do envio</h3>
                {data.charges.map((c) => (
                  <article className="profile-record" key={c.id}>
                    <div>
                      <b>{c.description}</b>
                      <small>
                        Vencimento: {c.dueDate.split("-").reverse().join("/")}
                      </small>
                    </div>
                    <strong>{money(c.amount)}</strong>
                  </article>
                ))}
                {!data.charges.length && <p>Nenhuma cobrança neste filtro.</p>}
                <p>
                  <strong>Total: {money(data.total)}</strong>
                </p>
                <p>Destino do e-mail: {data.email || "Não cadastrado"}</p>
                {!data.emailValid && (
                  <p role="alert">
                    Cadastre um e-mail válido em Editar cadastro para enviar e
                    receber avisos.
                  </p>
                )}
                <div className="profile-actions">
                  <button
                    type="button"
                    className="button"
                    disabled={
                      busy ||
                      !data.charges.length ||
                      !data.configured ||
                      !data.emailValid
                    }
                    onClick={() => void send()}
                  >
                    Enviar lembrete por e-mail
                  </button>
                  {data.charges.length > 0 && (
                    <a
                      className="button button-ghost"
                      href={`https://wa.me/${digits ? destination : ""}?text=${encodeURIComponent(`Olá, ${clientName}!\n\n${data.message}\n\nAcesse: https://acstech.dev.br/cliente`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir no WhatsApp
                    </a>
                  )}
                </div>
                <h3>Histórico de envios</h3>
                <p>
                  “Aceito” confirma o recebimento pelo provedor, sem confirmar
                  entrega na caixa de entrada.
                </p>
                {data.history.map((h, index) => (
                  <article
                    className="profile-record"
                    key={`${h.attemptedAt}-${index}`}
                  >
                    <div>
                      <b>{h.subject}</b>
                      <small>
                        {new Date(h.attemptedAt).toLocaleString("pt-BR", {
                          timeZone: "America/Fortaleza",
                        })}{" "}
                        ·{" "}
                        {h.status === "accepted"
                          ? "Aceito pelo provedor"
                          : "Falha no envio"}
                      </small>
                      {h.reason && <small>{h.reason}</small>}
                    </div>
                  </article>
                ))}
                {!data.history.length && (
                  <p>Nenhum envio registrado para este cliente.</p>
                )}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
