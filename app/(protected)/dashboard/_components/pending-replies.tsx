import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PortalTicket } from "@/data/dashboard";
import { ticketNumber } from "@/lib/portal-format";

import { TicketDetail } from "../../_components/recent-tickets";

export function PendingReplies({
  tickets,
  total,
}: {
  tickets: PortalTicket[];
  total: number;
}) {
  return (
    <Card className="portal-card">
      <div className="portal-card-head">
        <h2>Aguardando você</h2>
        <Badge className="portal-badge" data-tone="warning">
          {total} {total === 1 ? "pendência" : "pendências"}
        </Badge>
      </div>
      {tickets.length ? (
        tickets.map((ticket) => (
          <div className="portal-list-row" key={ticket.id}>
            <div>
              <strong>{ticket.subject}</strong>
              <small>
                {ticketNumber(ticket.number)} ·{" "}
                {ticket.messages[0]?.body ||
                  "Nossa equipe aguarda suas informações."}
              </small>
            </div>
            <TicketDetail ticket={ticket} label="Ver pedido →" />
          </div>
        ))
      ) : (
        <p className="portal-empty">Tudo certo. Nenhuma resposta pendente.</p>
      )}
    </Card>
  );
}
