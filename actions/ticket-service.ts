"use server";

import { revalidatePath } from "next/cache";

import {
  persistServiceAction,
  persistTicketReply,
  SupportInputError,
} from "@/data/ticket-service";
import { actionClient } from "@/lib/action-client";
import { deliverEmail } from "@/lib/mail";
import { ticketNumber } from "@/lib/portal-format";
import {
  replySchema,
  serviceActionSchema,
} from "@/lib/validations/ticket-service";

export const sendTicketReply = actionClient
  .inputSchema(replySchema)
  .action(async ({ parsedInput }) => {
    let result;
    try {
      result = await persistTicketReply(parsedInput);
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
    let emailFailed = false;
    if (result.created && result.email) {
      try {
        const base = new URL(process.env.BETTER_AUTH_URL || "");
        if (!["http:", "https:"].includes(base.protocol))
          throw new Error("Email unavailable");
        const path =
          parsedInput.audience === "operation"
            ? `/chamados/${result.ticketId}`
            : `/operacao/chamados/${result.ticketId}`;
        await deliverEmail(
          {
            to: result.email,
            subject: `Nova resposta · ${ticketNumber(result.number)} · Helpdesk Lab`,
            text: `Há uma nova resposta no chamado ${ticketNumber(result.number)}.\n\nAcesse o portal com sua conta e contexto autorizado:\n${new URL(path, base).href}\n\nHelpdesk Lab`,
          },
          `reply-${result.messageId}`,
        );
      } catch {
        emailFailed = true;
      }
    }
    revalidatePath("/(protected)", "layout");
    return { ok: true as const, messageId: result.messageId, emailFailed };
  });

export const updateTicketService = actionClient
  .inputSchema(serviceActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      await persistServiceAction(parsedInput);
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
    revalidatePath("/(protected)", "layout");
    return { ok: true as const };
  });
