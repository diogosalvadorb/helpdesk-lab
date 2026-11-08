"use server";
import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/data/authenticated-user";
import { saveKnowledgeArticle } from "@/data/knowledge-store";
import { SupportInputError } from "@/data/service-store";
import { Prisma } from "@/generated/prisma/client";
import { actionClient } from "@/lib/action-client";
import { articleSchema } from "@/lib/validations/portal";
export const saveArticle = actionClient
  .inputSchema(articleSchema)
  .action(async ({ parsedInput }) => {
    const user = await getAuthenticatedUser();
    try {
      const result = await saveKnowledgeArticle(user.id, parsedInput);
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
          message: "Este endereço já está em uso. Escolha outro slug.",
        };
      throw error;
    }
  });
