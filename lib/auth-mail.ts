import "server-only";

import { APIError } from "better-auth/api";
import { Resend } from "resend";

import type { OtpPurpose } from "@/lib/validations/otp";

// Better Auth awaits but catches errors from background callbacks in this
// version. Carry a request-local marker to its after hook to surface failures.
export const otpDeliveryFailure = Symbol("otp-delivery-failure");

export async function sendAuthCode({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: OtpPurpose;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const unavailable = () =>
    new APIError("SERVICE_UNAVAILABLE", {
      code: "EMAIL_DELIVERY_UNAVAILABLE",
      message:
        "Não foi possível enviar o código. Tente novamente em instantes.",
    });
  if (!apiKey || !from) throw unavailable();
  const verification = type === "email-verification";
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: email,
      subject: verification
        ? "Confirme seu cadastro · Helpdesk Lab"
        : "Recupere seu acesso · Helpdesk Lab",
      text: `${verification ? "Confirme seu e-mail para concluir o cadastro." : "Use este código para redefinir sua senha."}\n\nSeu código: ${otp}\n\nVálido por 5 minutos e para uma única utilização.\nNão compartilhe este código. Se você não fez esta solicitação, ignore esta mensagem.\n\nHelpdesk Lab · Suporte que acompanha você`,
    });
    if (error) throw unavailable();
  } catch {
    throw unavailable();
  }
}
