"use server";
import { revalidatePath } from "next/cache";

import { readScopedNotifications } from "@/data/notification-store";
import { getPortalContext } from "@/data/portal-context";
import { SupportInputError } from "@/data/service-store";
import { actionClient } from "@/lib/action-client";
import { notificationReadSchema } from "@/lib/validations/portal";
export const readNotifications = actionClient
  .inputSchema(notificationReadSchema)
  .action(async ({ parsedInput }) => {
    const context = await getPortalContext();
    if (!context.company)
      return {
        ok: false as const,
        message: "Selecione uma empresa autorizada.",
      };
    try {
      const count = await readScopedNotifications(
        context.user.id,
        context.company.id,
        parsedInput,
      );
      revalidatePath("/(protected)", "layout");
      return { ok: true as const, count };
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
  });
