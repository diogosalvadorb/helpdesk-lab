import { randomUUID } from "node:crypto";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TicketConversationData } from "@/data/ticket-service";
import {
  dateTime,
  initials,
  priorityLabels,
  statusLabels,
  ticketNumber,
} from "@/lib/portal-format";

import { PortalLink } from "./portal-link";
import { TicketReplyForm } from "./ticket-reply-form";

export function TicketConversation({
  ticket,
  controls,
}: {
  ticket: TicketConversationData;
  controls?: ReactNode;
}) {
  const base =
    ticket.mode === "operation"
      ? `/operacao/chamados/${ticket.id}`
      : `/chamados/${ticket.id}`;
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">
            Chamado {ticketNumber(ticket.number)} · {ticket.level}
          </p>
          <h1>{ticket.subject}</h1>
          <p>
            {ticket.company} · {ticket.department} · Aberto em{" "}
            {dateTime(ticket.createdAt)}
          </p>
        </div>
        <div className="portal-ticket-badges">
          <Badge className="portal-badge">{statusLabels[ticket.status]}</Badge>
          <Badge
            className="portal-badge"
            data-tone={ticket.priority === "CRITICAL" ? "danger" : "neutral"}
          >
            {priorityLabels[ticket.priority]}
          </Badge>
          <PortalLink
            href={ticket.mode === "operation" ? "/operacao/filas" : "/chamados"}
          >
            Voltar aos chamados →
          </PortalLink>
        </div>
      </div>
      {controls}
      <div className="portal-dashboard-grid portal-conversation-grid">
        <Card className="portal-card portal-conversation-history">
          <div className="portal-card-head">
            <h2>Histórico do atendimento</h2>
            <Badge className="portal-badge" data-tone="neutral">
              {ticket.totalMessages + 1} registros
            </Badge>
          </div>
          <article className="portal-chat">
            <span className="portal-avatar" aria-hidden="true">
              {initials(ticket.requester)}
            </span>
            <div>
              <div className="portal-chat-head">
                <b>{ticket.requester}</b>
                <time dateTime={ticket.createdAt}>
                  {dateTime(ticket.createdAt)}
                </time>
              </div>
              <p className="portal-description">{ticket.description}</p>
              <small className="portal-muted">
                Descrição inicial do chamado
              </small>
            </div>
          </article>
          {ticket.messages
            .slice()
            .reverse()
            .map((message) => (
              <article
                className={`portal-chat ${message.visibility === "INTERNAL" ? "portal-chat-internal" : ""}`}
                key={message.id}
              >
                <span className="portal-avatar" aria-hidden="true">
                  {initials(message.author.name)}
                </span>
                <div>
                  <div className="portal-chat-head">
                    <b>{message.author.name}</b>
                    <time dateTime={message.createdAt}>
                      {dateTime(message.createdAt)}
                    </time>
                  </div>
                  {message.visibility === "INTERNAL" && (
                    <strong className="portal-internal-label">
                      Nota interna · Somente equipe de suporte
                    </strong>
                  )}
                  <p className="portal-description">{message.body}</p>
                </div>
              </article>
            ))}
          {!ticket.totalMessages && (
            <p className="portal-empty">
              Nenhuma resposta ainda. A descrição inicial já foi recebida.
            </p>
          )}
          <div
            className="portal-history-pagination"
            aria-label="Páginas de mensagens"
          >
            {ticket.page > 1 && (
              <PortalLink
                href={`${base}?page=${ticket.page - 1}&events=${ticket.eventPage}`}
              >
                Mensagens mais recentes
              </PortalLink>
            )}
            {ticket.page * 20 < ticket.totalMessages && (
              <PortalLink
                href={`${base}?page=${ticket.page + 1}&events=${ticket.eventPage}`}
              >
                Mensagens anteriores
              </PortalLink>
            )}
          </div>
          {ticket.canReply ? (
            <TicketReplyForm
              ticketId={ticket.id}
              companyId={ticket.companyId}
              mode={ticket.mode}
              initialKey={randomUUID()}
            />
          ) : (
            <p className="portal-empty">
              Sua conta ou o estado atual do chamado não permite enviar
              mensagens.
            </p>
          )}
        </Card>
        <div className="portal-stack">
          <Card className="portal-card portal-knowledge">
            <p className="portal-eyebrow">Tempo de atendimento</p>
            <h2>SLA em acompanhamento</h2>
            <strong className="portal-sla-clock" data-tone={ticket.sla.tone}>
              {ticket.sla.text}
            </strong>
            <dl className="portal-confirmation-data">
              <div>
                <dt>Primeira resposta</dt>
                <dd>
                  {ticket.firstRespondedAt
                    ? `Respondido em ${dateTime(ticket.firstRespondedAt)}`
                    : ticket.firstResponseDueAt
                      ? dateTime(ticket.firstResponseDueAt)
                      : "Prazo não definido"}
                </dd>
              </div>
              <div>
                <dt>Resolução</dt>
                <dd>
                  {ticket.resolutionDueAt
                    ? dateTime(ticket.resolutionDueAt)
                    : "Prazo não definido"}
                </dd>
              </div>
            </dl>
            <p className="portal-muted">
              Prazos de referência no horário de Brasília.
            </p>
          </Card>
          <Card className="portal-card">
            <h2>Detalhes do chamado</h2>
            <dl className="portal-ticket-details">
              {[
                ["Empresa", ticket.company],
                ["Departamento", ticket.department],
                ["Categoria", ticket.category],
                ["Responsável", ticket.assignee],
                ["Equipe", ticket.team],
                ["Aberto por", ticket.requester],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="portal-card">
            <h2>Etapas do atendimento</h2>
            <ol className="portal-event-timeline">
              <li>
                <b>Chamado aberto</b>
                <small>{dateTime(ticket.createdAt)}</small>
              </li>
              {ticket.events.map((event) => (
                <li key={event.id}>
                  <b>{event.label}</b>
                  <small>{dateTime(event.createdAt)}</small>
                </li>
              ))}
            </ol>
            <div className="portal-history-pagination">
              {ticket.eventPage > 1 && (
                <PortalLink
                  href={`${base}?page=${ticket.page}&events=${ticket.eventPage - 1}`}
                >
                  Eventos recentes
                </PortalLink>
              )}
              {ticket.eventPage * 20 < ticket.totalEvents && (
                <PortalLink
                  href={`${base}?page=${ticket.page}&events=${ticket.eventPage + 1}`}
                >
                  Eventos anteriores
                </PortalLink>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
