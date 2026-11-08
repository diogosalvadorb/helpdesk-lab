"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";

import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { registerSchema } from "@/lib/validations/register";

export const register = actionClient
  .inputSchema(registerSchema)
  .action(async ({ parsedInput }) => {
    const { name, email, company, password } = parsedInput;
    try {
      await auth.api.signUpEmail({
        body: { name, email, company, password },
        headers: await headers(),
      });
    } catch (error) {
      if (error instanceof APIError && error.statusCode < 500) {
        returnValidationErrors(registerSchema, {
          _errors: [error.message || "Não foi possível criar a conta."],
        });
      }
      throw error;
    }
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await auth.api.sendVerificationOTP({
        body: { email: normalizedEmail, type: "email-verification" },
        headers: await headers(),
      });
      return {
        success: true,
        email: normalizedEmail,
        sent: true,
        message: "Confira seu e-mail para confirmar o cadastro.",
      };
    } catch (error) {
      return {
        success: true,
        email: normalizedEmail,
        sent: false,
        message: authErrorMessage(error),
      };
    }
  });
