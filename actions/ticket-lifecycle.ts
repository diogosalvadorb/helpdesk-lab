"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { persistLifecycle, persistTicketRating } from "@/data/ticket-lifecycle";
import { SupportInputError } from "@/data/ticket-service";
import { actionClient } from "@/lib/action-client";
import { deliverEmail } from "@/lib/mail";
import { ticketNumber } from "@/lib/portal-format";
import {
  lifecycleSchema,
  ratingSchema,
} from "@/lib/validations/ticket-lifecycle";

export const updateTicketLifecycle = actionClient
  .inputSchema(lifecycleSchema)
  .action(async ({ parsedInput }) => {
    let result;
    try {
      result = await persistLifecycle(parsedInput);
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
        await deliverEmail(
          {
            to: result.email,
            subject: `Atualização · ${ticketNumber(result.number)} · Helpdesk Lab`,
            text: `O chamado ${ticketNumber(result.number)} recebeu uma atualização de atendimento.\n\nAcesse com sua conta e empresa autorizada para conferir:\n${new URL(`/chamados/${result.ticketId}`, base).href}\n\nHelpdesk Lab`,
          },
          `lifecycle-${result.ticketId}-${parsedInput.submissionKey}`,
        );
      } catch {
        emailFailed = true;
      }
    }
    revalidatePath("/(protected)", "layout");
    if (parsedInput.operation === "escalate")
      redirect(
        `/operacao/filas${emailFailed ? "?notice=email-unavailable" : ""}`,
      );
    return { ok: true as const, ticketId: result.ticketId, emailFailed };
  });
export const rateTicket = actionClient
  .inputSchema(ratingSchema)
  .action(async ({ parsedInput }) => {
    try {
      await persistTicketRating(parsedInput);
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
    revalidatePath("/(protected)", "layout");
    return { ok: true as const };
  });
