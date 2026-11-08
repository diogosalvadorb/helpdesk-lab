"use server";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";

import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/login";

export const login = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.signInEmail({
        body: parsedInput,
        headers: await headers(),
      });
    } catch (error) {
      if (
        error instanceof APIError &&
        error.body?.code === "EMAIL_NOT_VERIFIED"
      ) {
        return {
          success: false as const,
          needsVerification: true as const,
          email: parsedInput.email.trim().toLowerCase(),
          message: "Confirme seu e-mail para entrar.",
        };
      }
      if (error instanceof APIError && error.statusCode < 500) {
        returnValidationErrors(loginSchema, {
          _errors: [
            error.statusCode === 401
              ? "Email ou senha inválidos."
              : "Não foi possível fazer login. Tente novamente.",
          ],
        });
      }
      throw error;
    }
    return {
      success: true as const,
      needsVerification: false as const,
      message: "Login realizado com sucesso!",
    };
  });
