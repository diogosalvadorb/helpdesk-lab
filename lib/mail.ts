import "server-only";

import { Resend } from "resend";

export async function deliverEmail(
  message: { to: string; subject: string; text: string },
  idempotencyKey?: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new Error("Email unavailable");
  const { error } = await new Resend(apiKey).emails.send(
    { from, ...message },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error("Email unavailable");
}
