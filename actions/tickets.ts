"use server";

import { revalidatePath } from "next/cache";

import {
  persistNewTicket,
  recordTicketEmailStatus,
  TicketInputError,
} from "@/data/tickets";
import { actionClient } from "@/lib/action-client";
import { sendTicketConfirmation } from "@/lib/ticket-mail";
import { createTicketSchema } from "@/lib/validations/ticket";

export const createTicket = actionClient
  .inputSchema(createTicketSchema)
  .action(async ({ parsedInput }) => {
    let ticket;
    try {
      ticket = await persistNewTicket(parsedInput);
    } catch (error) {
      if (error instanceof TicketInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
    if (ticket.created && ticket.emailEnabled) {
      let status: "sent" | "failed" = "failed";
      try {
        await sendTicketConfirmation(ticket);
        status = "sent";
      } catch {
        /* The ticket is committed. A mail failure must never invite a duplicate. */
      }
      try {
        await recordTicketEmailStatus(ticket.id, status);
      } catch {
        /* Pending is displayed honestly if status persistence fails. */
      }
    }
    revalidatePath("/(protected)", "layout");
    return { ok: true as const, ticketId: ticket.id };
  });
