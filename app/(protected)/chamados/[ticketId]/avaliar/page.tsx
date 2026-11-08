import { Check } from "lucide-react";
import { notFound } from "next/navigation";

import { getTicketRating } from "@/data/ticket-lifecycle";
import { ticketNumber } from "@/lib/portal-format";

import { PortalLink } from "../../../_components/portal-link";
import { TicketRatingForm } from "../../_components/ticket-rating-form";

export default async function RateTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticket = await getTicketRating(ticketId);
  if (!ticket) notFound();
  return (
    <section className="portal-ticket-created">
      <div className="portal-success-icon">
        <Check aria-hidden="true" />
      </div>
      <p className="portal-eyebrow">
        Chamado {ticketNumber(ticket.number)} resolvido
      </p>
      <h1>Como foi o atendimento?</h1>
      <p>Seu retorno ajuda a equipe a cuidar melhor de cada chamado.</p>
      <TicketRatingForm ticket={ticket} />
      <PortalLink href={`/chamados/${ticket.id}`}>Voltar ao chamado</PortalLink>
    </section>
  );
}
