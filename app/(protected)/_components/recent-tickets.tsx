import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PortalTicket } from "@/data/dashboard";
import {
  priorityLabels,
  statusLabels,
  ticketNumber,
} from "@/lib/portal-format";

import { PortalLink } from "./portal-link";

export function TicketDetail({
  ticket,
  label,
}: {
  ticket: Pick<PortalTicket, "id" | "subject">;
  label?: string;
}) {
  return (
    <PortalLink href={`/chamados/${ticket.id}`} className="portal-ticket-link">
      {label || ticket.subject}
    </PortalLink>
  );
}
export function RecentTickets({
  tickets,
  all = false,
  emptyMessage = "Você ainda não tem chamados neste espaço.",
}: {
  tickets: Pick<
    PortalTicket,
    | "id"
    | "number"
    | "subject"
    | "status"
    | "priority"
    | "level"
    | "department"
    | "sla"
  >[];
  all?: boolean;
  emptyMessage?: string;
}) {
  return (
    <Card className="portal-card" id="chamados">
      <div className="portal-card-head">
        <h2>{all ? "Seus chamados" : "Acompanhe seus chamados"}</h2>
        {!all && <PortalLink href="/chamados">Ver todos →</PortalLink>}
      </div>
      {tickets.length ? (
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Lista de chamados"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Chamado",
                  "Departamento",
                  "Status",
                  "Prioridade",
                  "Nível",
                  "SLA",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <TicketDetail ticket={ticket} />
                    <small>
                      {ticketNumber(ticket.number)} · {ticket.department.name}
                    </small>
                  </TableCell>
                  <TableCell>{ticket.department.name}</TableCell>
                  <TableCell>
                    <Badge
                      className="portal-badge"
                      data-tone={
                        ticket.status === "WAITING_CUSTOMER"
                          ? "warning"
                          : ticket.status === "OPEN"
                            ? "info"
                            : "success"
                      }
                    >
                      {statusLabels[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="portal-badge"
                      data-tone={
                        ticket.priority === "CRITICAL"
                          ? "danger"
                          : ticket.priority === "HIGH"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      <span aria-hidden="true">●</span>
                      {priorityLabels[ticket.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.level}</TableCell>
                  <TableCell>
                    <span data-tone={ticket.sla.tone}>{ticket.sla.text}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="portal-empty">{emptyMessage}</p>
      )}
    </Card>
  );
}
