import { ReceiptShare } from "./ReceiptShare";
import { PaymentReminders } from "./PaymentReminders";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";

export type ProfileClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document: string;
  establishments: { id: string; name: string; system: string; url: string }[];
};
export type ProfileCharge = {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
  captureMethod?: string;
  receiptUrl?: string;
  category?: string;
  createdAt?: string;
};
export type ProfilePayment = {
  id: string;
  clientId: string;
  chargeId?: string;
  description: string;
  amount: number;
  paidAt: string;
  method: string;
};
type ServiceRequest = {
  id: string;
  clientId: string;
  title: string;
  details: string;
  status: string;
  createdAt: string;
};
const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v / 100,
  );
const date = (v?: string) =>
  v
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(`${v.slice(0, 10)}T12:00:00Z`),
      )
    : "Data não registrada";
const tabs = ["Financeiro", "Produtos", "Serviços", "Comprovantes"] as const;
type Tab = (typeof tabs)[number];
export function ClientFinancialProfile({
  client,
  charges,
  payments,
  requests,
  onBack,
  onEdit,
  onCharge,
  onSettle,
  onRemove,
  onCategory,
}: {
  client: ProfileClient;
  charges: ProfileCharge[];
  payments: ProfilePayment[];
  requests: ServiceRequest[];
  onBack: () => void;
  onEdit: () => void;
  onCharge: () => void;
  onSettle: (charge: ProfileCharge) => void;
  onRemove: (charge: ProfileCharge) => void;
  onCategory?: (charge: ProfileCharge, category: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Financeiro");
  const [order, setOrder] = useState("desc");
  const [status, setStatus] = useState("all");
  const mine = charges.filter((c) => c.clientId === client.id);
  const received = payments.filter((p) => p.clientId === client.id);
  const services = requests
    .filter((r) => r.clientId === client.id)
    .sort(
      (a, b) =>
        (order === "desc" ? -1 : 1) * a.createdAt.localeCompare(b.createdAt),
    );
  const pending = mine.filter((c) => c.status !== "paid");
  const paid = mine.filter((c) => c.status === "paid");
  const totalReceived =
    received.reduce((sum, p) => sum + p.amount, 0) +
    paid
      .filter((c) => !received.some((p) => p.chargeId === c.id))
      .reduce((sum, c) => sum + c.amount, 0);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const rows = mine
    .filter(
      (c) =>
        (status === "all" ||
          (status === "paid" ? c.status === "paid" : c.status !== "paid")) &&
        (tab === "Produtos"
          ? c.category === "product"
          : tab === "Serviços"
            ? c.category === "service"
            : true),
    )
    .sort(
      (a, b) =>
        (order === "desc" ? -1 : 1) *
        (a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)),
    );
  const receipts = [
    ...received.map((p) => ({
      key: `p-${p.id}`,
      description: p.description,
      amount: p.amount,
      paidAt: p.paidAt,
      method: p.method,
      url: `/api/portal/receipt?clientId=${encodeURIComponent(client.id)}&id=${encodeURIComponent(p.id)}`,
    })),
    ...paid
      .filter((c) => !received.some((p) => p.chargeId === c.id))
      .map((c) => ({
        key: `c-${c.id}`,
        description: c.description,
        amount: c.amount,
        paidAt: c.paidAt || "",
        method: c.captureMethod || "Não registrada",
        url: `/api/portal/receipt?clientId=${encodeURIComponent(client.id)}&chargeId=${encodeURIComponent(c.id)}`,
      })),
  ].sort(
    (a, b) => (order === "desc" ? -1 : 1) * a.paidAt.localeCompare(b.paidAt),
  );
  return (
    <section className="client-financial-profile">
      <button type="button" className="button button-ghost" onClick={onBack}>
        <ArrowLeft /> Voltar aos clientes
      </button>
      <header className="portal-card profile-heading">
        <div>
          <span className="kicker">Ficha financeira do cliente</span>
          <h1>{client.name}</h1>
          <p>
            {client.document} · {client.phone}
          </p>
        </div>
        <div className="profile-actions">
          <PaymentReminders clientId={client.id} clientName={client.name} />
          <button className="button button-ghost" onClick={onEdit}>
            Editar cadastro
          </button>
          <button className="button" onClick={onCharge}>
            Nova cobrança
          </button>
        </div>
      </header>
      <div className="profile-totals">
        <article className="portal-card">
          <small>Em aberto</small>
          <strong>{money(pending.reduce((s, c) => s + c.amount, 0))}</strong>
          <span>{pending.length} cobrança(s)</span>
        </article>
        <article className="portal-card">
          <small>Vencido</small>
          <strong>
            {money(
              pending
                .filter((c) => c.dueDate < today)
                .reduce((s, c) => s + c.amount, 0),
            )}
          </strong>
          <span>Vencimentos anteriores a hoje</span>
        </article>
        <article className="portal-card">
          <small>Total recebido</small>
          <strong>{money(totalReceived)}</strong>
          <span>Pagamentos registrados</span>
        </article>
      </div>
      <nav className="profile-tabs" aria-label="Seções da ficha">
        {tabs.map((name) => (
          <button
            type="button"
            key={name}
            aria-current={tab === name ? "page" : undefined}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name}
            {name === "Comprovantes" ? ` (${receipts.length})` : ""}
          </button>
        ))}
      </nav>
      <section className="portal-card profile-records" aria-label={tab}>
        <header>
          <div>
            <span className="kicker">{client.name}</span>
            <h2>{tab === "Financeiro" ? "Cobranças e pagamentos" : tab}</h2>
          </div>
          <label>
            Ordenar por data
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">Mais recentes primeiro</option>
              <option value="asc">Mais antigas primeiro</option>
            </select>
          </label>
          {tab !== "Comprovantes" && (
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="pending">Em aberto</option>
                <option value="paid">Pagos</option>
              </select>
            </label>
          )}
        </header>
        {tab === "Produtos" && (
          <div className="profile-linked-products">
            <h3>Sistemas vinculados</h3>
            {client.establishments?.map((place) => (
              <article key={place.id}>
                <div>
                  <b>{place.system || "Sistema não informado"}</b>
                  <small>{place.name}</small>
                </div>
                {/^https?:\/\//i.test(place.url) && (
                  <a
                    className="button button-ghost button-small"
                    href={place.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir sistema <ExternalLink />
                  </a>
                )}
              </article>
            ))}
            {!client.establishments?.length && (
              <p>Nenhum sistema vinculado ao cadastro.</p>
            )}
            <h3>Cobranças de produtos</h3>
          </div>
        )}
        {tab === "Comprovantes" ? (
          <>
            <p>
              Ordenados pela data do pagamento. Registros antigos sem data ficam
              separados ao final na ordem mais recente.
            </p>
            {receipts.map((item) => (
              <article className="profile-record" key={item.key}>
                <div>
                  <b>{item.description}</b>
                  <small>
                    Pagamento: {date(item.paidAt)} · {item.method}
                  </small>
                </div>
                <strong>{money(item.amount)}</strong>
                <a
                  className="button button-ghost button-small"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir comprovante
                </a>
                <ReceiptShare
                  clientId={client.id}
                  {...(item.key.startsWith("p-")
                    ? { id: item.key.slice(2) }
                    : { chargeId: item.key.slice(2) })}
                  phone={client.phone}
                  email={client.email}
                  description={item.description}
                />
              </article>
            ))}
            {!receipts.length && (
              <p className="portal-empty">
                Nenhum pagamento confirmado para este cliente.
              </p>
            )}
          </>
        ) : (
          <>
            {tab === "Financeiro" && (
              <p>
                Organizadas pela data de vencimento. Os comprovantes ficam na
                aba Comprovantes.
              </p>
            )}
            {rows.map((c) => (
              <article className="profile-record" key={c.id}>
                <div>
                  <b>{c.description}</b>
                  <small>
                    Vencimento: {date(c.dueDate)}
                    {c.paidAt ? ` · Pago em ${date(c.paidAt)}` : ""}
                  </small>
                  <span
                    className={
                      c.status === "paid"
                        ? "profile-status paid"
                        : "profile-status"
                    }
                  >
                    {c.status === "paid"
                      ? "Pago"
                      : c.dueDate < today
                        ? "Vencido"
                        : "Pendente"}
                  </span>
                </div>
                <strong>{money(c.amount)}</strong>
                {onCategory && (
                  <label>
                    Tipo de lançamento
                    <select
                      aria-label={`Tipo de lançamento: ${c.description}`}
                      value={c.category || ""}
                      onChange={(e) => onCategory(c, e.target.value)}
                    >
                      <option value="">Sem categoria</option>
                      <option value="product">Produto / sistema</option>
                      <option value="service">Serviço</option>
                    </select>
                  </label>
                )}
                <div className="profile-actions">
                  {c.status !== "paid" ? (
                    <button
                      className="button button-small"
                      onClick={() => onSettle(c)}
                    >
                      <CheckCircle2 /> Dar baixa
                    </button>
                  ) : (
                    <a
                      className="button button-ghost button-small"
                      href={`/api/portal/receipt?clientId=${encodeURIComponent(client.id)}&chargeId=${encodeURIComponent(c.id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Comprovante
                    </a>
                  )}
                  <button
                    className="icon-button danger"
                    aria-label={`Excluir cobrança ${c.description}`}
                    onClick={() => onRemove(c)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
            {!rows.length && (
              <p className="portal-empty">Nenhuma cobrança neste filtro.</p>
            )}
            {tab === "Serviços" && (
              <>
                <h3>Solicitações de atendimento</h3>
                {services.map((r) => (
                  <article className="profile-record" key={r.id}>
                    <div>
                      <b>{r.title}</b>
                      <small>
                        {date(r.createdAt)} · {r.status}
                      </small>
                      <p>{r.details}</p>
                    </div>
                  </article>
                ))}
                {!services.length && <p>Nenhuma solicitação deste cliente.</p>}
              </>
            )}
          </>
        )}
      </section>
    </section>
  );
}
