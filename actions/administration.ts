"use server";

import { revalidatePath } from "next/cache";

import { saveAdministration } from "@/data/administration-store";
import { getAuthenticatedUser } from "@/data/authenticated-user";
import { getPortalContext } from "@/data/portal-context";
import { SupportInputError } from "@/data/service-store";
import { Prisma } from "@/generated/prisma/client";
import { actionClient } from "@/lib/action-client";
import { administrationSchema } from "@/lib/validations/administration";

export const updateAdministration = actionClient
  .inputSchema(administrationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getAuthenticatedUser();
    const company =
      user.role !== "ADMIN" && parsedInput.entity === "department"
        ? (await getPortalContext()).company?.id
        : undefined;
    try {
      const result = await saveAdministration(user.id, parsedInput, company);
      revalidatePath("/(protected)", "layout");
      return { ok: true as const, id: result.id };
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        return {
          ok: false as const,
          message:
            "Já existe um cadastro com este nome, documento ou número. Revise os dados.",
        };
      throw error;
    }
  });
