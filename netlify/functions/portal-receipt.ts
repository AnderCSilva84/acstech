import type { Config } from "@netlify/functions";
import {
  adminAllowed,
  authenticate,
  json,
  listJSON,
  store,
  type Charge,
  type Client,
} from "./_shared/core";
import { readReceiptLink } from "./_shared/receipt-links";
type Payment = {
  id: string;
  clientId: string;
  chargeId?: string;
  description: string;
  amount: number;
  paidAt: string;
  method: string;
};
const escape = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export default async (req: Request) => {
  if (req.method !== "GET")
    return json({ error: "Método não permitido." }, 405);
  const params = new URL(req.url).searchParams;
  const shared = await readReceiptLink(params.get("share") || "");
  const admin = await adminAllowed(req);
  const user = admin || shared ? null : await authenticate(req);
  if (!admin && !user && !shared) return json({ error: "Acesso negado." }, 401);
  const clientId =
    shared?.clientId || (admin ? params.get("clientId") : user?.sub);
  const id = shared?.id || (!shared ? params.get("id") : null);
  const chargeId =
    shared?.chargeId || (!shared ? params.get("chargeId") : null);
  if (
    !clientId ||
    (!id && !chargeId) ||
    /[\\/]/.test(clientId + (id || chargeId))
  )
    return json({ error: "Informe o pagamento." }, 400);
  const client = (await store.get(`clients/id-${clientId}`, {
    type: "json",
  })) as Client | null;
  if (!client) return json({ error: "Cliente não encontrado." }, 404);
  let payment: Payment | null = null;
  if (id)
    payment = (await store.get(`payments/${clientId}/${id}`, {
      type: "json",
    })) as Payment | null;
  else {
    const charge = (await store.get(`charges/${clientId}/${chargeId}`, {
      type: "json",
    })) as Charge | null;
    if (!charge || charge.status !== "paid" || charge.clientId !== clientId)
      return json({ error: "Pagamento não confirmado." }, 404);
    const records = await listJSON<Payment>(`payments/${clientId}/`);
    payment = records.find((p) => p.chargeId === chargeId) || {
      id: charge.id,
      clientId,
      chargeId: charge.id,
      description: charge.description,
      amount: charge.amount,
      paidAt: charge.paidAt || "",
      method: charge.captureMethod || "Não registrada",
    };
  }
  if (!payment || payment.clientId !== clientId)
    return json({ error: "Pagamento não encontrado." }, 404);
  const amount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(payment.amount / 100);
  const date = payment.paidAt
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(`${payment.paidAt.slice(0, 10)}T12:00:00Z`),
      )
    : "Não registrada no lançamento original";
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprovante ACS</title><style>body{font:16px/1.7 Arial,sans-serif;color:#102039;max-width:760px;margin:50px auto;padding:24px}header{border-bottom:3px solid #0764ee;padding-bottom:20px}img{width:170px}dl{display:grid;grid-template-columns:160px 1fr;gap:12px;background:#f1f5fb;padding:24px}dd{margin:0;overflow-wrap:anywhere}button{padding:14px;background:#075ded;color:white;border:0;border-radius:8px}@media print{button{display:none}body{margin:0}}@media(max-width:480px){dl{grid-template-columns:1fr}}</style></head><body><header><img src="/acs-informatica-logo.png" alt="ACS Tecnologia"><h1>Comprovante de pagamento</h1><small>Registro ${escape(payment.id)}</small></header><p>Recebimento registrado de <strong>${escape(client.name)}</strong>${client.document ? `, CPF/CNPJ ${escape(client.document)}` : ""}, no valor de <strong>${escape(amount)}</strong>.</p><dl><dt>Referente a</dt><dd>${escape(payment.description)}</dd><dt>Data do pagamento</dt><dd>${escape(date)}</dd><dt>Forma de pagamento</dt><dd>${escape(payment.method)}</dd></dl><p>ACS Tecnologia</p><button onclick="window.print()">Imprimir / salvar PDF</button></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
};
export const config: Config = { path: "/api/portal/receipt" };
