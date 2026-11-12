"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  resetPasswordSchema,
  sendCodeSchema,
  verifyCodeSchema,
} from "@/lib/validations/otp";

export const sendCode = actionClient
  .inputSchema(sendCodeSchema)
  .action(async ({ parsedInput: { email, purpose } }) => {
    try {
      await auth.api.sendVerificationOTP({
        body: { email, type: purpose },
        headers: await headers(),
      });
    } catch (error) {
      // Public requests acknowledge acceptance, never account existence or delivery.
      // A provider failure must look identical to a request for an unknown address.
      if (
        !(error instanceof APIError) ||
        error.body?.code !== "EMAIL_DELIVERY_UNAVAILABLE"
      )
        return { ok: false as const, message: authErrorMessage(error) };
    }
    return {
      ok: true as const,
      retryAfter: 60,
      message:
        "Se houver uma conta para este e-mail, você receberá um código. Caso não chegue, tente reenviar.",
    };
  });

export const verifyCode = actionClient
  .inputSchema(verifyCodeSchema)
  .action(async ({ parsedInput: { email, purpose, otp } }) => {
    try {
      if (purpose === "email-verification")
        await auth.api.verifyEmailOTP({
          body: { email, otp },
          headers: await headers(),
        });
      else
        await auth.api.checkVerificationOTP({
          body: { email, otp, type: purpose },
          headers: await headers(),
        });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        message: authErrorMessage(error),
        codeState:
          error instanceof APIError && error.body?.code === "OTP_EXPIRED"
            ? ("expired" as const)
            : ("invalid" as const),
      };
    }
  });

export const resetPassword = actionClient
  .inputSchema(resetPasswordSchema)
  .action(async ({ parsedInput: { email, purpose, otp, password } }) => {
    if (purpose !== "forget-password")
      return {
        ok: false as const,
        message: "Reinicie a recuperação de senha.",
      };
    try {
      await auth.api.resetPasswordEmailOTP({
        body: { email, otp, password },
        headers: await headers(),
      });
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: authErrorMessage(error) };
    }
  });
