import type { Config } from "@netlify/functions";
import { listJSON, store, type Charge, type Client } from "./_shared/core";
import {
  emailConfigured,
  reminderStage,
  sendEmail,
  validEmail,
} from "./_shared/notices";
export default async () => {
  const configured = emailConfigured();
  const enabled =
    configured &&
    Netlify.env.get("EMAIL_NOTIFICATIONS_ENABLED") === "true" &&
    Netlify.env.get("PAYMENT_REMINDERS_ENABLED") === "true";
  if (!enabled) {
    await store.setJSON("notification-health/latest", {
      ranAt: new Date().toISOString(),
      enabled,
      configured,
      accepted: 0,
      reason: "Lembretes desativados ou e-mail não configurado.",
    });
    return;
  }
  const started = Date.now();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const charges = await listJSON<Charge>("charges/");
  let accepted = 0;
  let failed = 0,
    missingEmail = 0,
    eligible = 0,
    alreadySent = 0,
    completed = true;
  for (const charge of charges) {
    if (Date.now() - started > 18000) {
      completed = false;
      break;
    }
    const stage = reminderStage(charge, today);
    if (!stage) continue;
    eligible++;
    const key = `reminder-${charge.id}-${charge.dueDate}-${stage}`;
    if (await store.get(`email-sent/${key}`, { type: "json" })) {
      alreadySent++;
      continue;
    }
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
      !current ||
      current.dueDate !== charge.dueDate ||
      reminderStage(current, today) !== stage
    )
      continue;
    if (!validEmail(client.email)) {
      missingEmail++;
      continue;
    }
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
    else failed++;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  await store.setJSON("notification-health/latest", {
    ranAt: new Date().toISOString(),
    accepted,
    failed,
    missingEmail,
    eligible,
    alreadySent,
    completed,
    configured,
    enabled,
  });
};
export const config: Config = { schedule: "0 * * * *" };
