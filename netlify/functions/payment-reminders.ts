import type { Config } from "@netlify/functions";
import {
  adminAllowed,
  json,
  listJSON,
  store,
  type Charge,
  type Client,
} from "./_shared/core";
import { emailConfigured, sendEmail, validEmail } from "./_shared/notices";
type Attempt = {
  clientId: string;
  subject: string;
  status: string;
  attemptedAt: string;
  providerId?: string;
  reason?: string;
};
export default async (req: Request) => {
  if (!(await adminAllowed(req))) return json({ error: "Acesso negado." }, 401);
  if (!["GET", "POST"].includes(req.method))
    return json({ error: "Método não permitido." }, 405);
  const body =
    req.method === "POST"
      ? await req.json().catch(() => ({}))
      : Object.fromEntries(new URL(req.url).searchParams);
  const { clientId } = body;
  const scope = body.scope || "overdue";
  if (
    typeof clientId !== "string" ||
    !clientId ||
    /[\\/]/.test(clientId) ||
    !["overdue", "open"].includes(scope)
  )
    return json({ error: "Informe o cliente e o filtro." }, 400);
  const client = (await store.get(`clients/id-${clientId}`, {
    type: "json",
  })) as Client | null;
  if (!client) return json({ error: "Cliente não encontrado." }, 404);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const charges = (await listJSON<Charge>(`charges/${clientId}/`))
    .filter(
      (c) =>
        c.clientId === clientId &&
        c.status !== "paid" &&
        (scope === "open" || c.dueDate < today),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const configured = emailConfigured();
  const enabled =
    configured &&
    Netlify.env.get("EMAIL_NOTIFICATIONS_ENABLED") === "true" &&
    Netlify.env.get("PAYMENT_REMINDERS_ENABLED") === "true";
  const total = charges.reduce((sum, c) => sum + c.amount, 0);
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n / 100);
  const message = `Segue o lembrete ${scope === "overdue" ? "das cobranças em atraso" : "das cobranças em aberto"}:\n\n${charges.map((c) => `${c.description} — ${money(c.amount)} — vencimento ${c.dueDate.split("-").reverse().join("/")}`).join("\n")}\n\nTotal: ${money(total)}.\nSe já efetuou o pagamento, entre em contato para confirmar a baixa.`;
  const url = "https://acstech.dev.br/cliente";
  if (req.method === "POST") {
    if (!charges.length)
      return json({ error: "Não há cobranças neste filtro." }, 409);
    if (!configured)
      return json({ error: "O serviço de e-mail não está configurado." }, 503);
    if (!client.active || !validEmail(client.email))
      return json(
        {
          error: "Cadastre um e-mail válido e ative o cliente antes de enviar.",
        },
        400,
      );
    if (
      typeof body.requestId !== "string" ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(body.requestId)
    )
      return json({ error: "Identificador de envio inválido." }, 400);
    const ok = await sendEmail(
      client,
      `manual-reminder-${clientId}-${body.requestId}`,
      "Lembrete de pagamento · ACS Tecnologia",
      message,
      url,
    );
    return ok
      ? json({ ok: true, message: "Lembrete aceito pelo provedor para envio." })
      : json(
          {
            error:
              "O provedor não confirmou o envio. Consulte o histórico e tente novamente.",
          },
          502,
        );
  }
  const attempts = await listJSON<Attempt>(`email-attempts/${clientId}/`);
  const accepted = await listJSON<{
    clientId: string;
    subject: string;
    acceptedAt: string;
    providerId: string;
  }>("email-sent/");
  const history = [
    ...attempts,
    ...accepted
      .filter(
        (a) =>
          a.clientId === clientId &&
          !attempts.some((t) => t.providerId === a.providerId),
      )
      .map((a) => ({ ...a, status: "accepted", attemptedAt: a.acceptedAt })),
  ]
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt))
    .slice(0, 20);
  return json(
    {
      charges: charges.map((c) => ({
        id: c.id,
        description: c.description,
        amount: c.amount,
        dueDate: c.dueDate,
      })),
      total,
      message,
      email: client.email || "",
      phone: client.phone,
      emailValid: validEmail(client.email),
      configured,
      enabled,
      health: await store.get("notification-health/latest", { type: "json" }),
      history,
    },
    200,
    { "cache-control": "no-store" },
  );
};
export const config: Config = { path: "/api/portal/payment-reminders" };
