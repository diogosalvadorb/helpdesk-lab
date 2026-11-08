import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getServiceQueue } from "@/data/ticket-service";
import {
  priorityLabels,
  statusLabels,
  ticketNumber,
} from "@/lib/portal-format";

import { PortalLink } from "../../_components/portal-link";

export default async function ServiceQueuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getServiceQueue(await searchParams);
  if (!data) notFound();
  const { filters } = data;
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page }))
      if (value !== undefined && value !== "") query.set(key, String(value));
    return `/operacao/filas?${query}`;
  };
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Central de atendimento</p>
          <h1>
            {filters.triage === "true" ? "Triagem sem equipe" : "Chamados"}
          </h1>
          <p>Priorize, atribua e acompanhe. Sua operação em movimento.</p>
        </div>
        <PortalLink href="/chamados/novo" className="portal-primary-button">
          Novo chamado
        </PortalLink>
      </div>
      <nav className="portal-queue-tabs" aria-label="Visões da fila">
        <PortalLink
          href="/operacao/filas"
          className={filters.triage !== "true" ? "active" : ""}
        >
          Filas por nível
        </PortalLink>
        {data.admin && (
          <PortalLink
            href="/operacao/filas?triage=true"
            className={filters.triage === "true" ? "active" : ""}
          >
            Triagem sem equipe · {data.triageCount}
          </PortalLink>
        )}
      </nav>
      <form className="portal-queue-filters" action="/operacao/filas">
        {filters.triage === "true" && (
          <input type="hidden" name="triage" value="true" />
        )}
        <div className="portal-field">
          <Label htmlFor="queue-search">Buscar chamado</Label>
          <Input
            id="queue-search"
            name="q"
            className="portal-form-input"
            defaultValue={filters.q}
            placeholder="Assunto ou número"
            maxLength={120}
          />
        </div>
        <div className="portal-field">
          <Label htmlFor="queue-company">Empresa</Label>
          <select
            id="queue-company"
            name="company"
            className="portal-form-input"
            defaultValue={filters.company || ""}
          >
            <option value="">Todas as empresas autorizadas</option>
            {data.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        {data.admin && filters.triage !== "true" && (
          <div className="portal-field">
            <Label htmlFor="queue-team">Equipe</Label>
            <select
              id="queue-team"
              name="team"
              className="portal-form-input"
              defaultValue={filters.team || ""}
            >
              <option value="">Todas as equipes</option>
              {data.teams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="portal-field">
          <Label htmlFor="queue-level">Nível</Label>
          <select
            id="queue-level"
            name="level"
            className="portal-form-input"
            defaultValue={filters.level || ""}
          >
            <option value="">Níveis autorizados</option>
            {data.levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="portal-field">
          <Label htmlFor="queue-status">Status</Label>
          <select
            id="queue-status"
            name="status"
            className="portal-form-input"
            defaultValue={filters.status || ""}
          >
            <option value="">Todos os ativos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="portal-field">
          <Label htmlFor="queue-priority">Prioridade</Label>
          <select
            id="queue-priority"
            name="priority"
            className="portal-form-input"
            defaultValue={filters.priority || ""}
          >
            <option value="">Todas</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button className="portal-outline-button" type="submit">
          Filtrar
        </Button>
        <PortalLink href="/operacao/filas">Limpar filtros</PortalLink>
      </form>
      <p className="portal-muted">
        {data.total} chamados encontrados · Página {filters.page} · Até 20
        registros por página
      </p>
      <div className="portal-queue-board">
        {data.levels.map((level) => (
          <section className="portal-queue-column" key={level}>
            <div className="portal-card-head">
              <h2>
                {level} ·{" "}
                {level === "N1"
                  ? "Primeiro atendimento"
                  : level === "N2"
                    ? "Especialistas"
                    : "Engenharia"}
              </h2>
              <small>
                {data.groups.find((group) => group.level === level)?._count ||
                  0}
              </small>
            </div>
            {data.tickets
              .filter((ticket) => ticket.level === level)
              .map((ticket) => (
                <Card
                  className="portal-card portal-queue-ticket"
                  key={ticket.id}
                >
                  <div className="portal-card-head">
                    <small>{ticketNumber(ticket.number)}</small>
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
                      {priorityLabels[ticket.priority]}
                    </Badge>
                  </div>
                  <PortalLink
                    href={`/operacao/chamados/${ticket.id}`}
                    className="portal-ticket-link"
                  >
                    {ticket.subject}
                  </PortalLink>
                  <p className="portal-muted">
                    {ticket.company.name} · {ticket.department.name}
                  </p>
                  <Badge className="portal-badge" data-tone="neutral">
                    {statusLabels[ticket.status]}
                  </Badge>
                  <div className="portal-queue-assignee">
                    {ticket.assignee?.user.name || "Não atribuído"}
                  </div>
                </Card>
              ))}
            {!data.tickets.some((ticket) => ticket.level === level) && (
              <p className="portal-empty">
                Nenhum chamado deste nível nesta página.
              </p>
            )}
          </section>
        ))}
      </div>
      <nav className="portal-history-pagination" aria-label="Páginas da fila">
        {filters.page > 1 && (
          <PortalLink href={pageHref(filters.page - 1)}>
            Página anterior
          </PortalLink>
        )}
        {filters.page * 20 < data.total && (
          <PortalLink href={pageHref(filters.page + 1)}>
            Próxima página
          </PortalLink>
        )}
      </nav>
    </>
  );
}
