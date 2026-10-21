type Ref = { clientId: string; id?: string; chargeId?: string; exp: number };
async function key() {
  const secret = Netlify.env.get("PORTAL_SESSION_SECRET");
  if (!secret) throw Error("Sessão não configurada");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function receiptLink(ref: Omit<Ref, "exp">) {
  const body = Buffer.from(
    JSON.stringify({ ...ref, exp: Date.now() + 30 * 86400000 }),
  ).toString("base64url");
  const sig = await crypto.subtle.sign(
    "HMAC",
    await key(),
    new TextEncoder().encode(`receipt:${body}`),
  );
  return `https://acstech.dev.br/api/portal/receipt?share=${body}.${Buffer.from(sig).toString("base64url")}`;
}
export async function readReceiptLink(token: string): Promise<Ref | null> {
  try {
    const [body, sig, ...rest] = token.split(".");
    if (!body || !sig || rest.length) return null;
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await key(),
        Buffer.from(sig, "base64url"),
        new TextEncoder().encode(`receipt:${body}`),
      ))
    )
      return null;
    const ref = JSON.parse(Buffer.from(body, "base64url").toString()) as Ref;
    return typeof ref.clientId === "string" &&
      typeof (ref.id || ref.chargeId) === "string" &&
      ref.exp > Date.now()
      ? ref
      : null;
  } catch {
    return null;
  }
}
