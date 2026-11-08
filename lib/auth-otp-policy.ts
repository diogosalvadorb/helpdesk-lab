import { APIError } from "better-auth/api";

import { consumeAuthLimits, type RateRule } from "@/data/auth-rate-limit";
import { emailSchema, otpPurposeSchema } from "@/lib/validations/otp";

const sendPaths = new Set([
  "/email-otp/send-verification-otp",
  "/email-otp/request-password-reset",
  "/forget-password/email-otp",
]);
const verifyPaths = new Set([
  "/email-otp/verify-email",
  "/email-otp/check-verification-otp",
  "/email-otp/reset-password",
]);
const disabledPaths = new Set([
  "/sign-in/email-otp",
  "/email-otp/request-email-change",
  "/email-otp/change-email",
  "/send-verification-email",
  "/request-password-reset",
  "/forget-password",
]);

export function isOtpSendPath(path: string) {
  return sendPaths.has(path);
}

export function authLimitRules(
  path: string,
  email: string,
  purpose: string,
  ip: string,
): RateRule[] {
  if (sendPaths.has(path))
    return [
      { key: `send:${purpose}:email:${email}`, max: 1, seconds: 60 },
      { key: `send:${purpose}:ip:${ip}`, max: 5, seconds: 900 },
    ];
  if (verifyPaths.has(path))
    return [
      { key: `verify:${purpose}:email:${email}`, max: 10, seconds: 300 },
      { key: `verify:${purpose}:ip:${ip}`, max: 30, seconds: 300 },
    ];
  return [
    { key: `${path}:email:${email}`, max: 5, seconds: 900 },
    { key: `${path}:ip:${ip}`, max: 20, seconds: 900 },
  ];
}

export async function enforceOtpPolicy(
  path: string,
  body: Record<string, unknown> | undefined,
  headers: Headers | undefined,
) {
  if (disabledPaths.has(path))
    throw new APIError("NOT_FOUND", { message: "Operação indisponível." });
  const credentialPath = path === "/sign-in/email" || path === "/sign-up/email";
  if (!credentialPath && !sendPaths.has(path) && !verifyPaths.has(path)) return;
  const parsedEmail = emailSchema.safeParse(body?.email);
  if (!parsedEmail.success)
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_EMAIL",
      message: "Informe um e-mail válido.",
    });
  const email = parsedEmail.data;
  if (body) body.email = email;
  const purpose =
    path === "/email-otp/send-verification-otp" ||
    path === "/email-otp/check-verification-otp"
      ? body?.type
      : path === "/email-otp/verify-email"
        ? "email-verification"
        : "forget-password";
  if (!credentialPath && !otpPurposeSchema.safeParse(purpose).success)
    throw new APIError("BAD_REQUEST", { message: "Finalidade inválida." });
  if (
    verifyPaths.has(path) &&
    (typeof body?.otp !== "string" || !/^\d{6}$/.test(body.otp))
  )
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_OTP",
      message: "Informe os seis dígitos do código.",
    });
  // Enable only behind a proxy that overwrites this header; otherwise all
  // requests share the conservative unknown-IP bucket rather than trusting input.
  const trustedHeader = process.env.AUTH_TRUSTED_IP_HEADER;
  const ip =
    (trustedHeader
      ? headers?.get(trustedHeader)?.split(",")[0]?.trim()
      : undefined) || "unknown";
  const retryAfter = await consumeAuthLimits(
    authLimitRules(path, email, String(purpose), ip),
  );
  if (retryAfter)
    throw new APIError("TOO_MANY_REQUESTS", {
      code: "AUTH_RATE_LIMITED",
      message: "Aguarde antes de tentar novamente.",
      retryAfter,
    });
}
