import type { Config } from "@netlify/functions";
import { listJSON, store, type Charge, type Client } from "./_shared/core";
import {
  emailConfigured,
  reminderStage,
  sendEmail,
  validEmail,
} from "./_shared/notices";
export default async () => {
  if (
    !emailConfigured() ||
    Netlify.env.get("EMAIL_NOTIFICATIONS_ENABLED") !== "true" ||
    Netlify.env.get("PAYMENT_REMINDERS_ENABLED") !== "true"
  )
    return;
  const started = Date.now();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const charges = await listJSON<Charge>("charges/");
  let accepted = 0;
  for (const charge of charges) {
    if (Date.now() - started > 18000) break;
    const stage = reminderStage(charge, today);
    if (!stage) continue;
    const key = `reminder-${charge.id}-${charge.dueDate}-${stage}`;
    if (await store.get(`email-sent/${key}`, { type: "json" })) continue;
    const client = (await store.get(`clients/id-${charge.clientId}`, {
      type: "json",
    })) as Client | null;
    const current = (await store.get(
      `charges/${charge.clientId}/${charge.id}`,
      { type: "json" },
    )) as Charge | null;
    if (
      !client ||
      !client.active ||
      !validEmail(client.email) ||
      !current ||
      current.dueDate !== charge.dueDate ||
      reminderStage(current, today) !== stage
    )
      continue;
    const title =
      stage === "before-2"
        ? "Sua cobrança vence em 2 dias"
        : `Sua cobrança está vencida há ${stage.slice(8)} dia(s)`;
    const amount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(current.amount / 100);
    if (
      await sendEmail(
        client,
        key,
        `${title} · ACS Tecnologia`,
        `${title}.\n${current.description} — ${amount} — vencimento ${current.dueDate.split("-").reverse().join("/")}.\nSe já realizou o pagamento, entre em contato para confirmar a baixa.`,
        `https://acstech.dev.br/cliente`,
      )
    )
      accepted++;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  await store.setJSON("notification-health/latest", {
    ranAt: new Date().toISOString(),
    accepted,
  });
};
export const config: Config = { schedule: "0 * * * *" };
