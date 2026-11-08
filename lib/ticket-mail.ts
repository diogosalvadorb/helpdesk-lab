import "server-only";

import { deliverEmail } from "@/lib/mail";
import { ticketNumber } from "@/lib/portal-format";

export async function sendTicketConfirmation(ticket: {
  id: string;
  number: number;
  email: string;
}) {
  const base = new URL(process.env.BETTER_AUTH_URL || "");
  if (!["http:", "https:"].includes(base.protocol))
    throw new Error("Email unavailable");
  const url = new URL(
    `/chamados/${encodeURIComponent(ticket.id)}/enviado`,
    base,
  );
  await deliverEmail(
    {
      to: ticket.email,
      subject: `Chamado ${ticketNumber(ticket.number)} recebido · Helpdesk Lab`,
      text: `Recebemos seu chamado ${ticketNumber(ticket.number)}.\n\nAcesse o portal com sua conta e a empresa correspondente selecionada para acompanhar os dados e prazos disponíveis:\n${url.href}\n\nHelpdesk Lab · Suporte que acompanha você`,
    },
    `ticket-created-${ticket.id}`,
  );
}
