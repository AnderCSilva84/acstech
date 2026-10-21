import type { Config } from "@netlify/functions";
import {
  adminAllowed,
  json,
  store,
  type Charge,
  type Client,
} from "./_shared/core";
import { receiptLink } from "./_shared/receipt-links";
import { sendEmail, validEmail } from "./_shared/notices";
export default async (req: Request) => {
  if (!(await adminAllowed(req))) return json({ error: "Acesso negado." }, 401);
  if (req.method !== "POST")
    return json({ error: "Método não permitido." }, 405);
  const body = await req.json().catch(() => ({}));
  const { clientId, id, chargeId } = body;
  if (
    typeof clientId !== "string" ||
    typeof (id || chargeId) !== "string" ||
    /[\\/]/.test(clientId + (id || chargeId))
  )
    return json({ error: "Informe o comprovante." }, 400);
  const client = (await store.get(`clients/id-${clientId}`, {
    type: "json",
  })) as Client | null;
  if (!client) return json({ error: "Cliente não encontrado." }, 404);
  const record = (await store.get(
    id ? `payments/${clientId}/${id}` : `charges/${clientId}/${chargeId}`,
    { type: "json" },
  )) as (Charge & { paidAt?: string }) | null;
  if (
    !record ||
    record.clientId !== clientId ||
    (!id && record.status !== "paid")
  )
    return json({ error: "Pagamento não confirmado." }, 404);
  const url = await receiptLink({ clientId, ...(id ? { id } : { chargeId }) });
  if (body.action === "email") {
    const email = body.email || client.email;
    if (!validEmail(email))
      return json(
        { error: "Informe um e-mail válido para este cliente." },
        400,
      );
    const ok = await sendEmail(
      { ...client, email },
      `manual-receipt-${clientId}-${id || chargeId}-${crypto.randomUUID()}`,
      "Comprovante de pagamento · ACS Tecnologia",
      `Segue o comprovante de ${record.description}.`,
      url,
    );
    return ok
      ? json({ ok: true, url })
      : json(
          {
            error:
              "O provedor não confirmou o envio. Confira a configuração de e-mail.",
          },
          502,
        );
  }
  return json({ url }, 200, { "cache-control": "no-store" });
};
export const config: Config = { path: "/api/portal/receipt-share" };
