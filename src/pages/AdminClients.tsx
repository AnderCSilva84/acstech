import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ClientFinancialProfile,
  type ProfilePayment,
} from "../components/ClientFinancialProfile";
import { Seo } from "../components/Seo";

type Establishment = { id: string; name: string; system: string; url: string };
type Client = {
  id: string;
  name: string;
  phone: string;
  personType: "pf" | "pj";
  document: string;
  establishments: Establishment[];
  active: boolean;
};
type Charge = {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
};
type RequestItem = {
  id: string;
  clientId: string;
  title: string;
  details: string;
  status: string;
  createdAt: string;
};
const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );

export default function AdminClients() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [newCharge, setNewCharge] = useState(false);
  const [payments, setPayments] = useState<ProfilePayment[]>([]);
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [places, setPlaces] = useState([{ name: "", system: "", url: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [settling, setSettling] = useState<Charge | null>(null);
  const [saving, setSaving] = useState(false);
  async function settle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settling || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/portal/admin", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "payment",
          clientId: settling.clientId,
          chargeId: settling.id,
          paidAt: form.get("paidAt"),
          method: form.get("method"),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Não foi possível registrar a baixa.");
        return;
      }
      setSettling(null);
      await load();
      setMessage("Pagamento registrado e cobrança baixada.");
    } catch {
      setError(
        "Não foi possível confirmar a baixa. Atualize a página antes de tentar novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/admin", {
        credentials: "same-origin",
      });
      if (!response.ok) {
        setAuthenticated(false);
        return false;
      }
      const result = await response.json();
      setClients(result.clients || []);
      setCharges(result.charges || []);
      setPayments(result.payments || []);
      setRequests(result.requests || []);
      setAuthenticated(true);
      setError("");
      return true;
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setAuthenticated(false);
      return false;
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const pin = new FormData(event.currentTarget).get("pin");
    const response = await fetch("/api/portal/admin-session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const result = await response
      .json()
      .catch(() => ({ error: "Servidor indisponível." }));
    if (!response.ok) return setError(result.error || "PIN inválido.");
    await load();
  }
  async function logout() {
    await fetch("/api/portal/admin-session", {
      method: "DELETE",
      credentials: "same-origin",
    });
    setAuthenticated(false);
  }
  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: "client" | "charge",
  ) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body =
      action === "client"
        ? {
            action,
            personType,
            name: form.get("name"),
            document: form.get("document"),
            phone: form.get("phone"),
            pin: form.get("pin"),
            establishments: personType === "pj" ? places : [],
          }
        : {
            action,
            clientId: form.get("clientId"),
            description: form.get("description"),
            amount: form.get("amount"),
            dueDate: form.get("dueDate"),
            category: form.get("category"),
          };
    const response = await fetch("/api/portal/admin", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response
      .json()
      .catch(() => ({ error: `Erro do servidor (${response.status}).` }));
    if (!response.ok)
      return setError(result.error || "Não foi possível salvar.");
    formElement.reset();
    if (action === "client") {
      setPersonType("pf");
      setPlaces([{ name: "", system: "", url: "" }]);
    }
    setNewCharge(false);
    setMessage(
      action === "client" ? "Cliente cadastrado." : "Cobrança emitida.",
    );
    await load();
  }
  async function saveEdit(client: Client, pin: string) {
    setError("");
    const response = await fetch("/api/portal/admin", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "client", ...client, pin }),
    });
    const result = await response
      .json()
      .catch(() => ({ error: "Resposta inválida." }));
    if (!response.ok)
      return setError(result.error || "Não foi possível atualizar.");
    setEditing(null);
    setMessage("Cliente atualizado.");
    await load();
  }
  async function classify(charge:Charge,category:string){
    setError('');
    try{const response=await fetch('/api/portal/admin',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({action:'charge-category',clientId:charge.clientId,chargeId:charge.id,category})});const result=await response.json();if(!response.ok){setError(result.error||'Não foi possível classificar.');return}await load();setMessage('Classificação atualizada.');}catch{setError('Não foi possível confirmar a classificação. Atualize para conferir.');}
  }
  async function remove(
    type: "client" | "charge" | "request",
    id: string,
    clientId?: string,
  ) {
    const labels = {
      client: "este cliente e todos os dados vinculados",
      charge: "esta cobrança",
      request: "esta solicitação",
    };
    if (
      !window.confirm(
        `Excluir ${labels[type]}? Essa ação não poderá ser desfeita.`,
      )
    )
      return;
    const response = await fetch("/api/portal/admin", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id, clientId }),
    });
    const result = await response
      .json()
      .catch(() => ({ error: "Resposta inválida." }));
    if (!response.ok)
      return setError(result.error || "Não foi possível excluir.");
    setMessage("Item excluído com sucesso.");
    await load();
  }
  const selected = clients.find((client) => client.id === selectedId);
  const visibleClients = clients.filter((client) =>
    [client.name, client.document, client.phone].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const clientName = (id: string) =>
    clients.find((client) => client.id === id)?.name || "Cliente removido";

  if (authenticated === null)
    return <div className="page-loader">Verificando sessão…</div>;
  if (!authenticated)
    return (
      <>
        <Seo
          title="Gestão de clientes"
          description="Gestão segura do Portal do Cliente."
        />
        <section className="admin-login">
          <form className="admin-auth-card" onSubmit={connect}>
            <span className="admin-lock">
              <KeyRound />
            </span>
            <span className="kicker">Portal do Cliente</span>
            <h1>Gestão financeira.</h1>
            <p>Use seu PIN administrativo de 6 dígitos.</p>
            <label>
              PIN administrativo
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button">Acessar gestão</button>
          </form>
        </section>
      </>
    );
  return (
    <>
      <Seo
        title="Clientes e cobranças"
        description="Gestão do Portal do Cliente."
      />
      <section className="admin-page">
        <Link className="back" to="/admin">
          <ArrowLeft /> Voltar aos projetos
        </Link>
        <header className="admin-heading">
          <div>
            <span className="kicker">Portal do Cliente</span>
            <h1>Clientes e cobranças</h1>
            <p>
              Abra um cliente para consultar sua ficha financeira, produtos,
              serviços e comprovantes.
            </p>
          </div>
          <button className="button button-ghost" onClick={logout}>
            <LogOut /> Sair
          </button>
        </header>
        {message && (
          <div className="admin-notice">
            <CheckCircle2 />
            {message}
          </div>
        )}
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {!selected && (
          <details className="portal-card">
            <summary>Cadastrar novo cliente</summary>
            <div className="client-admin-grid">
              <form
                className="portal-card client-form"
                onSubmit={(e) => submit(e, "client")}
              >
                <span className="portal-icon">
                  <UsersRound />
                </span>
                <h2>Novo cliente</h2>
                <div className="client-type">
                  <button
                    type="button"
                    className={personType === "pf" ? "active" : ""}
                    onClick={() => setPersonType("pf")}
                  >
                    <UserRound /> Pessoa física
                  </button>
                  <button
                    type="button"
                    className={personType === "pj" ? "active" : ""}
                    onClick={() => setPersonType("pj")}
                  >
                    <Building2 /> Empresa
                  </button>
                </div>
                <label>
                  {personType === "pf"
                    ? "Nome completo"
                    : "Responsável pela empresa"}
                  <input name="name" required />
                </label>
                <label>
                  {personType === "pf" ? "CPF" : "CNPJ"}
                  <input name="document" inputMode="numeric" required />
                </label>
                <label>
                  Telefone com DDD
                  <input name="phone" inputMode="tel" required />
                </label>
                <label>
                  PIN inicial
                  <input
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    required
                  />
                </label>
                {personType === "pj" && (
                  <fieldset className="establishments">
                    <legend>Estabelecimentos e sistemas</legend>
                    {places.map((place, index) => (
                      <div className="establishment-row" key={index}>
                        <label>
                          Estabelecimento
                          <input
                            value={place.name}
                            onChange={(e) =>
                              setPlaces((all) =>
                                all.map((item, i) =>
                                  i === index
                                    ? { ...item, name: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            required
                          />
                        </label>
                        <label>
                          Sistema
                          <input
                            value={place.system}
                            onChange={(e) =>
                              setPlaces((all) =>
                                all.map((item, i) =>
                                  i === index
                                    ? { ...item, system: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="system-url">
                          Link do sistema
                          <input
                            type="url"
                            value={place.url}
                            onChange={(e) =>
                              setPlaces((all) =>
                                all.map((item, i) =>
                                  i === index
                                    ? { ...item, url: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder="https://..."
                          />
                        </label>
                        {places.length > 1 && (
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() =>
                              setPlaces((all) =>
                                all.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-establishment"
                      onClick={() =>
                        setPlaces((all) => [
                          ...all,
                          { name: "", system: "", url: "" },
                        ])
                      }
                    >
                      <Plus /> Adicionar estabelecimento
                    </button>
                  </fieldset>
                )}
                <button className="button">
                  <Plus /> Cadastrar cliente
                </button>
              </form>
            </div>
          </details>
        )}
        {!selected && (
          <section className="portal-card client-catalog">
            <header>
              <div>
                <span className="kicker">Cadastros</span>
                <h2>Clientes</h2>
              </div>
            </header>
            <label>
              Buscar cliente
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, CPF/CNPJ ou telefone"
              />
            </label>
            <div className="client-card-grid">
              {visibleClients.map((client) => (
                <article
                  className="client-card"
                  key={client.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir ficha de ${client.name}`}
                  onClick={() => setSelectedId(client.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(client.id);
                    }
                  }}
                >
                  <div className="client-card-top">
                    <span className="client-avatar">
                      {client.personType === "pj" ? (
                        <Building2 />
                      ) : (
                        <UserRound />
                      )}
                    </span>
                    <span className="edit-hint">Abrir ficha financeira</span>
                    <button
                      className="delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void remove("client", client.id);
                      }}
                      aria-label={`Excluir ${client.name}`}
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <div className="client-card-copy">
                    <strong>{client.name}</strong>
                    <small>
                      {client.personType === "pj"
                        ? `CNPJ · ${client.establishments?.length || 0} estabelecimento(s)`
                        : "Pessoa física"}{" "}
                      · {client.phone}
                    </small>
                  </div>
                  {client.establishments?.length > 0 && (
                    <div className="client-places">
                      {client.establishments.map((place) => (
                        <div key={place.id}>
                          <span>
                            <b>{place.name}</b>
                            <small>
                              {place.system || "Sistema não informado"}
                            </small>
                          </span>
                          {place.url && (
                            <a
                              href={place.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Abrir <ExternalLink />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
            {!clients.length && (
              <p className="portal-empty">Nenhum cliente cadastrado.</p>
            )}
          </section>
        )}
        {selected && (
          <ClientFinancialProfile
            key={selected.id}
            client={selected}
            charges={charges}
            payments={payments}
            requests={requests}
            onBack={() => {
              setSelectedId("");
              setNewCharge(false);
            }}
            onEdit={() => setEditing(selected)}
            onCharge={() => setNewCharge(true)}
            onSettle={(charge) => {
              setError("");
              setSettling(charge);
            }}
            onCategory={(charge,category)=>void classify(charge,category)}
            onRemove={(charge) =>
              void remove("charge", charge.id, charge.clientId)
            }
          />
        )}
        {selected && newCharge && (
          <div className="editor-backdrop">
            {" "}
            <form className="portal-card" onSubmit={(e) => submit(e, "charge")}>
              <span className="portal-icon">
                <CreditCard />
              </span>
              <h2>Nova cobrança</h2>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setNewCharge(false)}
              >
                Cancelar
              </button>
              <input type="hidden" name="clientId" value={selectedId} />
              <p>
                Cliente: <strong>{selected.name}</strong>
              </p>
              <label>
                Tipo
                <select name="category" defaultValue="">
                  <option value="">Sem categoria</option>
                  <option value="product">Produto / sistema</option>
                  <option value="service">Serviço</option>
                </select>
              </label>
              <label>
                Descrição
                <input name="description" required />
              </label>
              <div className="field-row">
                <label>
                  Valor (R$)
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  Vencimento
                  <input name="dueDate" type="date" required />
                </label>
              </div>
              <button className="button" disabled={!clients.length}>
                <CreditCard /> Emitir cobrança
              </button>
            </form>
          </div>
        )}
      </section>
      {settling && (
        <div className="editor-backdrop">
          <form
            className="project-editor"
            role="dialog"
            aria-modal="true"
            aria-label="Dar baixa na cobrança"
            onSubmit={settle}
          >
            <header>
              <h2>Dar baixa na cobrança</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar"
                disabled={saving}
                onClick={() => setSettling(null)}
              >
                ×
              </button>
            </header>
            <p>
              {clientName(settling.clientId)} · {settling.description} ·{" "}
              {money(settling.amount)}
            </p>
            <label>
              Data do pagamento
              <input
                name="paidAt"
                type="date"
                required
                defaultValue={new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 10)}
              />
            </label>
            <label>
              Forma de pagamento
              <select name="method" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {["PIX", "Dinheiro", "Transferência", "Cartão", "Outro"].map(
                  (method) => (
                    <option key={method}>{method}</option>
                  ),
                )}
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                className="button button-ghost"
                disabled={saving}
                onClick={() => setSettling(null)}
              >
                Cancelar
              </button>
              <button className="button" disabled={saving}>
                {saving ? "Registrando…" : "Confirmar baixa"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {editing && (
        <ClientEditor
          client={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </>
  );
}

function ClientEditor({
  client,
  onClose,
  onSave,
}: {
  client: Client;
  onClose: () => void;
  onSave: (client: Client, pin: string) => void;
}) {
  const [form, setForm] = useState({
    ...client,
    establishments: client.establishments || [],
  });
  const [pin, setPin] = useState("");
  const updatePlace = (
    index: number,
    key: keyof Establishment,
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      establishments: current.establishments.map((place, i) =>
        i === index ? { ...place, [key]: value } : place,
      ),
    }));
  return (
    <div className="editor-backdrop">
      <form
        className="project-editor"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(form, pin);
        }}
      >
        <header>
          <div>
            <span className="kicker">Ficha do cliente</span>
            <h2>{form.name}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="editor-grid">
          <label>
            Nome ou responsável
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            {form.personType === "pj" ? "CNPJ" : "CPF"}
            <input
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
              required
            />
          </label>
          <label>
            Telefone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </label>
          <label>
            Novo PIN <small>deixe vazio para manter</small>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
            />
          </label>
          {form.personType === "pj" && (
            <fieldset className="establishments wide">
              <legend>Estabelecimentos</legend>
              {form.establishments.map((place, index) => (
                <div className="establishment-row" key={place.id}>
                  <label>
                    Nome
                    <input
                      value={place.name}
                      onChange={(e) =>
                        updatePlace(index, "name", e.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    Sistema
                    <input
                      value={place.system}
                      onChange={(e) =>
                        updatePlace(index, "system", e.target.value)
                      }
                    />
                  </label>
                  <label className="system-url">
                    Link
                    <input
                      type="url"
                      value={place.url}
                      onChange={(e) =>
                        updatePlace(index, "url", e.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        establishments: current.establishments.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-establishment"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    establishments: [
                      ...current.establishments,
                      {
                        id: crypto.randomUUID(),
                        name: "",
                        system: "",
                        url: "",
                      },
                    ],
                  }))
                }
              >
                <Plus /> Adicionar estabelecimento
              </button>
            </fieldset>
          )}
        </div>
        <footer>
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button">Salvar alterações</button>
        </footer>
      </form>
    </div>
  );
}
