import { store, type Charge, type Client } from "./core";
export const validEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
export const emailConfigured = () =>
  !!Netlify.env.get("RESEND_API_KEY") &&
  !!Netlify.env.get("CONTACT_FROM_EMAIL");
export function reminderStage(
  charge: Pick<Charge, "status" | "dueDate">,
  today: string,
) {
  if (charge.status === "paid") return null;
  const days =
    (Date.parse(`${today}T00:00:00Z`) -
      Date.parse(`${charge.dueDate}T00:00:00Z`)) /
    86400000;
  return days === -2
    ? "before-2"
    : days >= 1 && days % 2 === 1
      ? `overdue-${days}`
      : null;
}
export async function sendEmail(
  client: Client,
  key: string,
  subject: string,
  message: string,
  url: string,
) {
  if (!emailConfigured() || !client.active || !validEmail(client.email))
    return false;
  if (await store.get(`email-sent/${key}`, { type: "json" })) return true;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(5000),
    headers: {
      Authorization: `Bearer ${Netlify.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: Netlify.env.get("CONTACT_FROM_EMAIL"),
      to: [client.email],
      subject,
      text: `Olá, ${client.name}.\n\n${message}\n\n${url}\n\nACS Tecnologia`,
    }),
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { id?: string };
  if (!result.id) return false;
  await store.setJSON(`email-sent/${key}`, {
    clientId: client.id,
    providerId: result.id,
    subject,
    acceptedAt: new Date().toISOString(),
  });
  return true;
}
