"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";

import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";
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
    return { success: true, message: "Conta criada com sucesso!" };
  });
