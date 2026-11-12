import { Check } from "lucide-react";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getCreatedTicket } from "@/data/tickets";
import { dateTime, statusLabels } from "@/lib/portal-format";

import { PortalLink } from "../../../_components/portal-link";
import { TicketDetail } from "../../../_components/recent-tickets";

export default async function TicketSentPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticket = await getCreatedTicket(ticketId);
  if (!ticket) notFound();
  return (
    <section className="portal-ticket-created">
      <div className="portal-success-icon">
        <Check aria-hidden="true" />
      </div>
      <p className="portal-eyebrow">Solicitação recebida</p>
      <h1>Já estamos com você.</h1>
      <p>
        Seu chamado <strong>{ticket.formattedNumber}</strong> foi registrado com
        sucesso.
      </p>
      <Card className="portal-card portal-knowledge">
        <h2>{ticket.subject}</h2>
        <dl className="portal-confirmation-data">
          <div>
            <dt>Empresa</dt>
            <dd>{ticket.company.name}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabels[ticket.status]}</dd>
          </div>
          <div>
            <dt>Primeira resposta</dt>
            <dd>
              {ticket.firstResponseDueAt
                ? dateTime(ticket.firstResponseDueAt.toISOString())
                : "Prazo não definido"}
            </dd>
          </div>
          <div>
            <dt>Resolução</dt>
            <dd>
              {ticket.resolutionDueAt
                ? dateTime(ticket.resolutionDueAt.toISOString())
                : "Prazo não definido"}
            </dd>
          </div>
        </dl>
        <p className="portal-muted">
          Horários de Brasília. Acompanhe o atendimento pelo portal.
        </p>
      </Card>
      <p role="status" className="portal-muted">
        {ticket.emailStatus === "sent"
          ? "Confirmação por e-mail enviada."
          : ticket.emailStatus === "disabled"
            ? "A confirmação por e-mail está desativada nas suas preferências. Acompanhe o chamado pelo portal."
            : ticket.emailStatus === "failed"
              ? "Seu chamado foi criado, mas não foi possível enviar a confirmação por e-mail. Não é necessário reenviar o chamado."
              : "Seu chamado está salvo. O envio da confirmação por e-mail ainda não foi confirmado."}
      </p>
      <div className="portal-confirmation-actions">
        <TicketDetail ticket={ticket} label="Ver detalhes" />
        <PortalLink href="/chamados" className="portal-outline-button">
          Ver meus chamados
        </PortalLink>
        <PortalLink href="/chamados/novo">Abrir outro chamado</PortalLink>
      </div>
    </section>
  );
}
